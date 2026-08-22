import * as SecureStore from 'expo-secure-store';

import { Thought, ThemeId, isThemeId, CollectionId, isCollectionId, COLLECTIONS } from '../types';

/**
 * Minimal Notion REST client for the two-way thought sync.
 *
 * Pinned to the 2025-09-03 API, where a database became a container for one or
 * more *data sources* and the row-level endpoints moved onto the data source.
 * The older 2022-06-28 shape is simpler, but its query endpoint is deprecated
 * and Notion documents that it starts failing outright the moment a database
 * gains a second data source -- a trap we would only discover in the field.
 */
const NOTION_VERSION = '2025-09-03';
const API_BASE = 'https://api.notion.com/v1';

const TOKEN_KEY = 'remember_notion_token';
/** Android Keystore alias for the integration token. */
const KEYCHAIN_SERVICE = 'remember.notion';

/** Notion rejects any single rich text chunk longer than this. */
const RICH_TEXT_CHUNK = 2000;

/** Notion's own page cap for paginated reads. */
const PAGE_SIZE = 100;

/** Attempts for a single request before giving up, covering 429 and 5xx. */
const MAX_ATTEMPTS = 4;

/* --------------------------------- schema --------------------------------- */

/**
 * Property names the sync owns. `Paused` deliberately avoids the word "archived"
 * because Notion's own page-level `archived` flag means *deleted*, and colliding
 * on that word invites someone to wire the two together by mistake.
 */
export const PROPS = {
  title: 'Thought',
  heading: 'Heading',
  subheading: 'Subheading',
  author: 'Author',
  eventDate: 'Event Date',
  interval: 'Repeat (days)',
  color: 'Color',
  customColor: 'Custom Color',
  created: 'Created',
  updated: 'Updated',
  completions: 'Completions',
  paused: 'Paused',
  spoiler: 'Hidden',
  appId: 'App ID',
  collection: 'Collection',
} as const;

/** Property definitions used to provision anything missing from the data source. */
const PROP_SCHEMA: Record<string, Record<string, unknown>> = {
  [PROPS.heading]: { rich_text: {} },
  [PROPS.subheading]: { rich_text: {} },
  [PROPS.author]: { rich_text: {} },
  [PROPS.eventDate]: { date: {} },
  [PROPS.interval]: { number: {} },
  [PROPS.color]: { rich_text: {} },
  [PROPS.customColor]: { rich_text: {} },
  [PROPS.created]: { date: {} },
  [PROPS.updated]: { date: {} },
  [PROPS.completions]: { rich_text: {} },
  [PROPS.paused]: { checkbox: {} },
  [PROPS.spoiler]: { checkbox: {} },
  [PROPS.appId]: { rich_text: {} },
  [PROPS.collection]: { rich_text: {} },
};

/**
 * Complete schema for a database the app provisions itself.
 *
 * Every Notion data source needs exactly one `title` property, so this is
 * PROP_SCHEMA plus that one -- kept separate because `ensureSchema` must never
 * try to add a title to a database that already has one under another name.
 */
const INITIAL_SCHEMA: Record<string, Record<string, unknown>> = {
  [PROPS.title]: { title: {} },
  ...PROP_SCHEMA,
};

/* --------------------------------- errors --------------------------------- */

export type NotionErrorKind =
  | 'no-token'
  | 'unauthorized'
  | 'not-found'
  | 'rate-limited'
  | 'validation'
  | 'network'
  | 'unknown';

export class NotionError extends Error {
  readonly kind: NotionErrorKind;
  readonly status?: number;

  constructor(kind: NotionErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'NotionError';
    this.kind = kind;
    this.status = status;
  }
}

/** Message safe to show in the UI. Notion's own wording is usually clearer than ours. */
export function describeNotionError(error: unknown): string {
  if (error instanceof NotionError) {
    switch (error.kind) {
      case 'no-token':
        return 'Add your Notion integration token in Settings.';
      case 'unauthorized':
        return 'Notion rejected the token. Check that it is correct and still active.';
      case 'not-found':
        return 'Notion cannot see that database. Share it with your integration.';
      case 'network':
        return 'Could not reach Notion. Changes are saved locally and will sync later.';
      default:
        return error.message;
    }
  }
  return 'Something went wrong syncing with Notion.';
}

function kindForStatus(status: number): NotionErrorKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limited';
  if (status === 400 || status === 422) return 'validation';
  return 'unknown';
}

/* --------------------------------- token ---------------------------------- */

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY, { keychainService: KEYCHAIN_SERVICE });
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token.trim(), { keychainService: KEYCHAIN_SERVICE });
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY, { keychainService: KEYCHAIN_SERVICE }).catch(() => {});
}

/* -------------------------------- transport -------------------------------- */

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface NotionErrorBody {
  message?: string;
  code?: string;
}

/**
 * Issues an authenticated request, retrying on 429 and 5xx with the Retry-After
 * hint when Notion supplies one. Notion's limit is roughly three requests per
 * second, and a full sync can burst well past that.
 */
async function request<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const token = await getToken();
  if (!token) throw new NotionError('no-token', 'No Notion token stored.');

  let lastError: NotionError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: init.method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch {
      lastError = new NotionError('network', 'Could not reach Notion.');
      await delay(500 * 2 ** attempt);
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    const retryable = response.status === 429 || response.status >= 500;
    let body: NotionErrorBody = {};
    try {
      body = (await response.json()) as NotionErrorBody;
    } catch {
      // Non-JSON error body; the status alone is enough to classify it.
    }

    lastError = new NotionError(
      kindForStatus(response.status),
      body.message ?? `Notion request failed (${response.status}).`,
      response.status
    );

    if (!retryable) throw lastError;

    const header = response.headers.get('Retry-After');
    const waitMs = header ? Number(header) * 1000 : 500 * 2 ** attempt;
    await delay(Number.isFinite(waitMs) ? waitMs : 1000);
  }

  throw lastError ?? new NotionError('unknown', 'Notion request failed.');
}

/* ------------------------------ wire helpers ------------------------------- */

interface RichTextItem {
  plain_text?: string;
  text?: { content: string };
}

/** Splits long values so no single chunk exceeds Notion's per-item limit. */
function toRichText(value: string): Array<{ text: { content: string } }> {
  if (!value) return [];
  const chunks: Array<{ text: { content: string } }> = [];
  for (let i = 0; i < value.length; i += RICH_TEXT_CHUNK) {
    chunks.push({ text: { content: value.slice(i, i + RICH_TEXT_CHUNK) } });
  }
  return chunks;
}

function readRichText(items: unknown): string {
  if (!Array.isArray(items)) return '';
  return (items as RichTextItem[])
    .map(item => item.plain_text ?? item.text?.content ?? '')
    .join('');
}

/* ------------------------------ page mapping ------------------------------- */

export interface NotionPage {
  id: string;
  archived?: boolean;
  in_trash?: boolean;
  properties: Record<string, unknown>;
}

interface QueryResponse {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

function propertyOf(page: NotionPage, name: string): Record<string, unknown> | null {
  const value = page.properties[name];
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Serialises a thought into Notion's property payload. */
export function thoughtToProperties(thought: Thought): Record<string, unknown> {
  const props: Record<string, unknown> = {
    [PROPS.title]: { title: toRichText(thought.heading || thought.content) },
    [PROPS.interval]: { number: thought.repeatIntervalDays },
    [PROPS.color]: { rich_text: toRichText(thought.colorTheme) },
    [PROPS.customColor]: { rich_text: toRichText(thought.customColor ?? '') },
    [PROPS.created]: { date: { start: thought.createdAt } },
    [PROPS.updated]: { date: { start: thought.updatedAt } },
    [PROPS.completions]: { rich_text: toRichText(thought.completionHistory.join(',')) },
    [PROPS.paused]: { checkbox: thought.archived === true },
    [PROPS.spoiler]: { checkbox: thought.spoiler === true },
    [PROPS.appId]: { rich_text: toRichText(thought.id) },
    [PROPS.collection]: { rich_text: toRichText(thought.collection ?? 'remember') },
  };

  if (thought.heading) {
    props[PROPS.heading] = { rich_text: toRichText(thought.heading) };
  }
  if (thought.subheading) {
    props[PROPS.subheading] = { rich_text: toRichText(thought.subheading) };
  }
  if (thought.author) {
    props[PROPS.author] = { rich_text: toRichText(thought.author) };
  }
  if (thought.eventDate) {
    props[PROPS.eventDate] = { date: { start: thought.eventDate } };
  }

  return props;
}

/**
 * Parses a Notion page back into a thought.
 *
 * Returns null when the row carries no App ID, which means a human created it
 * directly in Notion. Those are adopted separately, with a fresh local id, so a
 * half-filled row can never overwrite a real thought.
 */
export function pageToThought(page: NotionPage, defaultCollection: CollectionId = 'remember'): Thought | null {
  const appId = readRichText(propertyOf(page, PROPS.appId)?.rich_text);
  if (!appId) return null;
  return buildThought(page, appId, defaultCollection);
}

/** Reads a page into a thought under a caller-supplied local id. */
export function pageToThoughtWithId(page: NotionPage, id: string, defaultCollection: CollectionId = 'remember'): Thought {
  return buildThought(page, id, defaultCollection);
}

function buildThought(page: NotionPage, id: string, defaultCollection: CollectionId = 'remember'): Thought {
  const rawTitle = readRichText(propertyOf(page, PROPS.title)?.title);
  const rawHeading = readRichText(propertyOf(page, PROPS.heading)?.rich_text);
  const rawSubheading = readRichText(propertyOf(page, PROPS.subheading)?.rich_text);
  const rawAuthor = readRichText(propertyOf(page, PROPS.author)?.rich_text);
  const eventDateObj = propertyOf(page, PROPS.eventDate)?.date as { start?: string } | null | undefined;

  const rawInterval = propertyOf(page, PROPS.interval)?.number;
  const interval = typeof rawInterval === 'number' && rawInterval > 0 ? Math.round(rawInterval) : 1;

  const rawColor = readRichText(propertyOf(page, PROPS.color)?.rich_text);
  const colorTheme: ThemeId = isThemeId(rawColor) ? rawColor : 'sage';

  const customColor = readRichText(propertyOf(page, PROPS.customColor)?.rich_text);

  const createdDate = propertyOf(page, PROPS.created)?.date as { start?: string } | null | undefined;
  const updatedDate = propertyOf(page, PROPS.updated)?.date as { start?: string } | null | undefined;
  const fallback = new Date().toISOString();

  const completions = readRichText(propertyOf(page, PROPS.completions)?.rich_text)
    .split(',')
    .map(value => value.trim())
    .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));

  const paused = propertyOf(page, PROPS.paused)?.checkbox === true;
  const spoiler = propertyOf(page, PROPS.spoiler)?.checkbox === true;

  const rawCollection = readRichText(propertyOf(page, PROPS.collection)?.rich_text);
  const collection: CollectionId = isCollectionId(rawCollection) ? rawCollection : defaultCollection;

  const content = rawTitle || rawHeading || '';
  const heading = rawHeading || (collection !== 'remember' && collection !== 'tryDoing' && rawTitle ? rawTitle : undefined);

  return {
    id,
    content,
    ...(heading ? { heading } : {}),
    ...(rawSubheading ? { subheading: rawSubheading } : {}),
    ...(rawAuthor ? { author: rawAuthor } : {}),
    ...(eventDateObj?.start ? { eventDate: eventDateObj.start } : {}),
    colorTheme,
    repeatIntervalDays: interval,
    createdAt: createdDate?.start ?? fallback,
    updatedAt: updatedDate?.start ?? createdDate?.start ?? fallback,
    completionHistory: Array.from(new Set(completions)).sort(),
    ...(paused ? { archived: true } : {}),
    ...(spoiler ? { spoiler: true } : {}),
    ...(customColor ? { customColor } : {}),
    notionPageId: page.id,
    collection,
  };
}

/* -------------------------------- endpoints -------------------------------- */

interface DatabaseResponse {
  id: string;
  title?: RichTextItem[];
  data_sources?: Array<{ id: string; name?: string }>;
}

export interface NotionTarget {
  databaseId: string;
  dataSourceId: string;
}

/**
 * Resolves the data source that actually holds the rows.
 *
 * A database can host several; we take the first, which is the one Notion
 * creates with the database and the only one a personal setup will have.
 */
export async function resolveTarget(databaseId: string): Promise<NotionTarget> {
  const database = await request<DatabaseResponse>(`/databases/${databaseId}`, { method: 'GET' });
  const first = database.data_sources?.[0];
  if (!first) {
    throw new NotionError('validation', 'That Notion database has no data source to sync with.');
  }
  return { databaseId, dataSourceId: first.id };
}

interface DataSourceResponse {
  id: string;
  properties: Record<string, { type?: string }>;
}

/**
 * Adds any properties the sync needs but the data source lacks, leaving existing
 * ones untouched so a user's own extra columns and edits survive.
 */
export async function ensureSchema(target: NotionTarget): Promise<void> {
  const source = await request<DataSourceResponse>(`/data_sources/${target.dataSourceId}`, {
    method: 'GET',
  });

  const missing: Record<string, unknown> = {};
  for (const [name, definition] of Object.entries(PROP_SCHEMA)) {
    if (!(name in source.properties)) missing[name] = definition;
  }

  if (Object.keys(missing).length === 0) return;

  await request(`/data_sources/${target.dataSourceId}`, {
    method: 'PATCH',
    body: { properties: missing },
  });
}

/** Reads every row, following Notion's cursor pagination. */
export async function queryAllPages(target: NotionTarget): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | null = null;

  do {
    const body: Record<string, unknown> = { page_size: PAGE_SIZE };
    if (cursor) body.start_cursor = cursor;

    const response: QueryResponse = await request<QueryResponse>(
      `/data_sources/${target.dataSourceId}/query`,
      { method: 'POST', body }
    );

    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return pages;
}

export async function createPage(target: NotionTarget, thought: Thought): Promise<NotionPage> {
  return request<NotionPage>('/pages', {
    method: 'POST',
    body: {
      parent: { type: 'data_source_id', data_source_id: target.dataSourceId },
      properties: thoughtToProperties(thought),
    },
  });
}

export async function updatePage(pageId: string, thought: Thought): Promise<NotionPage> {
  return request<NotionPage>(`/pages/${pageId}`, {
    method: 'PATCH',
    body: { properties: thoughtToProperties(thought) },
  });
}

/**
 * Sends a page to the Notion trash. Deliberately not a hard delete: the user can
 * still recover a row they did not mean to lose.
 */
export async function archivePage(pageId: string): Promise<void> {
  await request(`/pages/${pageId}`, { method: 'PATCH', body: { in_trash: true } });
}

interface SearchResult {
  id: string;
  object: string;
  title?: RichTextItem[];
  name?: string;
  parent?: { type?: string; database_id?: string };
  properties?: Record<string, { type?: string; title?: RichTextItem[] }>;
}

interface SearchResponse {
  results: SearchResult[];
  has_more?: boolean;
  next_cursor?: string | null;
}

/**
 * Upper bound on search pages, so a very large workspace cannot turn opening the
 * picker into an unbounded series of round trips.
 */
const MAX_SEARCH_PAGES = 6;

/**
 * Reads every page of a `/search` result rather than only the first.
 *
 * Search spans the whole workspace and its natural ordering is not documented,
 * so a single 100-item page can silently omit the object the user just shared --
 * which reads to them as "the app cannot see it". Sorting by last edit puts the
 * thing they were just working on at the top, and following the cursor means a
 * large workspace degrades into "slower", not "wrong".
 */
async function searchAll(value: 'page' | 'data_source'): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
    const response = await request<SearchResponse>('/search', {
      method: 'POST',
      body: {
        filter: { property: 'object', value },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: PAGE_SIZE,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });

    results.push(...response.results);
    if (!response.has_more || !response.next_cursor) break;
    cursor = response.next_cursor;
  }

  return results;
}

export interface NotionDatabaseOption {
  id: string;
  title: string;
}

/**
 * Lists the databases shared with the integration, so the user can pick one
 * instead of hunting for a 32-character id in a URL.
 */
export async function listDatabases(): Promise<NotionDatabaseOption[]> {
  const results = await searchAll('data_source');

  const seen = new Set<string>();
  const options: NotionDatabaseOption[] = [];

  for (const result of results) {
    const databaseId = result.parent?.database_id;
    if (!databaseId || seen.has(databaseId)) continue;
    seen.add(databaseId);
    const title = readRichText(result.title) || result.name || 'Untitled database';
    options.push({ id: databaseId, title });
  }

  return options;
}

export interface NotionPageOption {
  id: string;
  title: string;
}

/**
 * Lists pages the integration can write into, as parents for a new database.
 *
 * Pages whose parent is a database are skipped: those are database *rows*, and
 * nesting a database inside a row is legal but never what someone means here.
 */
export async function listParentPages(): Promise<NotionPageOption[]> {
  const results = await searchAll('page');

  const options: NotionPageOption[] = [];

  for (const result of results) {
    if (result.parent?.type === 'database_id' || result.parent?.type === 'data_source_id') continue;

    // A page's name lives in whichever property has type "title"; the key is
    // user-defined, so it has to be found rather than looked up by name.
    const titleProp = Object.values(result.properties ?? {}).find(prop => prop.type === 'title');
    options.push({ id: result.id, title: readRichText(titleProp?.title) || 'Untitled page' });
  }

  return options;
}

/* ----------------------------- manual targeting ---------------------------- */

/** A Notion object id is 32 hex characters, shown either bare or dash-grouped. */
const NOTION_ID_PATTERN = /[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Pulls a Notion object id out of a pasted URL, or accepts a bare id.
 *
 * Share URLs put the id last (`.../Some-Title-<id>?pvs=4`), but the slug itself
 * can contain hex-looking runs, so the *last* match wins rather than the first.
 *
 * @returns the dashless id, or `null` if nothing id-shaped was found.
 */
export function extractNotionId(input: string): string | null {
  const withoutQuery = input.trim().split(/[?#]/)[0];
  const matches = withoutQuery.match(NOTION_ID_PATTERN);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1].replace(/-/g, '').toLowerCase();
}

export type NotionLinkTarget =
  | { kind: 'database'; id: string }
  | { kind: 'page'; id: string; title: string };

/**
 * Works out what a pasted Notion link points at.
 *
 * This is the escape hatch from the pickers: `/search` only surfaces what its
 * index has caught up on, so a page shared seconds ago can be genuinely absent
 * from the list while a direct fetch of it succeeds. Resolving the link by id
 * sidesteps the index completely.
 *
 * A database is tried first because a database URL also resolves as a page in
 * some Notion link formats, and treating a database as a parent page would nest
 * a second database inside the first.
 */
export async function resolveNotionLink(input: string): Promise<NotionLinkTarget> {
  const id = extractNotionId(input);
  if (!id) {
    throw new NotionError('validation', 'That does not look like a Notion link or id.');
  }

  try {
    await request<{ id: string }>(`/databases/${id}`, { method: 'GET' });
    return { kind: 'database', id };
  } catch (error) {
    // Only "there is no database here" is worth falling through on. An auth or
    // network failure must surface as itself, not as "try it as a page".
    if (!(error instanceof NotionError) || error.kind !== 'not-found') throw error;
  }

  const page = await request<SearchResult>(`/pages/${id}`, { method: 'GET' });
  const titleProp = Object.values(page.properties ?? {}).find(prop => prop.type === 'title');
  return { kind: 'page', id, title: readRichText(titleProp?.title) || 'Untitled page' };
}

interface CreateDatabaseResponse {
  id: string;
}

export const COLLECTION_ICONS: Record<CollectionId, string> = {
  remember: '\u{1F9E0}', // 🧠 Brain
  learnings: '\u{1F4D6}', // 📖 Open book
  blessings: '\u{2728}', // ✨ Sparkles
  sayings: '\u{1F4AC}', // 💬 Speech bubble
  tryDoing: '\u{26A1}', // ⚡ Lightning bolt
};

export const COLLECTION_TITLES: Record<CollectionId, string> = {
  remember: 'Remember',
  learnings: 'Learnings',
  blessings: 'Blessings',
  sayings: 'Sayings',
  tryDoing: 'Try Doing',
};

/**
 * Provisions a database with the full sync schema already in place.
 *
 * Creating it here rather than asking the user to build columns by hand removes
 * the whole class of "property is missing or is the wrong type" setup failures:
 * the schema the app writes is the schema the app reads.
 */
export async function createDatabase(
  parentPageId: string,
  title: string,
  emoji: string = '\u{1F9E0}'
): Promise<string> {
  const response = await request<CreateDatabaseResponse>('/databases', {
    method: 'POST',
    body: {
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: title } }],
      icon: { type: 'emoji', emoji },
      initial_data_source: { properties: INITIAL_SCHEMA },
    },
  });

  return response.id;
}

/**
 * Creates databases for all 5 collections (Remember, Learnings, Blessings, Sayings, Try Doing)
 * under the chosen parent page with matching schemas and emojis.
 */
export async function createAllDatabases(
  parentPageId: string
): Promise<Record<CollectionId, string>> {
  const createdMap: Partial<Record<CollectionId, string>> = {};

  for (const collection of COLLECTIONS) {
    const dbId = await createDatabase(
      parentPageId,
      collection.notionTitle,
      COLLECTION_ICONS[collection.id]
    );
    createdMap[collection.id] = dbId;
  }

  return createdMap as Record<CollectionId, string>;
}

/**
 * Looks up the parent page ID of an existing Notion database so sibling databases
 * can be provisioned in the same page.
 */
export async function getDatabaseParentPageId(databaseId: string): Promise<string | null> {
  try {
    const database = await request<{ id: string; parent?: { type?: string; page_id?: string } }>(
      `/databases/${databaseId}`,
      { method: 'GET' }
    );
    if (database.parent?.type === 'page_id' && database.parent.page_id) {
      return database.parent.page_id;
    }
    return null;
  } catch {
    return null;
  }
}

/** Verifies the stored token by hitting an endpoint that needs no extra scope. */
export async function verifyToken(): Promise<void> {
  await request('/users/me', { method: 'GET' });
}

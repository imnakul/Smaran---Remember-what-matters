import { randomUUID } from 'expo-crypto';

import { CollectionId, isCollectionId, Thought, Tombstone } from '../types';
import {
  NotionError,
  NotionPage,
  NotionTarget,
  archivePage,
  createPage,
  describeNotionError,
  ensureSchema,
  getToken,
  pageToThought,
  pageToThoughtWithId,
  queryAllPages,
  resolveTarget,
  updatePage,
} from './notion';
import {
  addTombstone,
  clearTombstones,
  loadThoughts,
  loadTombstones,
  removeThoughtLocally,
  saveThoughts,
  updateThought,
} from './storage';

/**
 * Two-way sync between local storage and Notion data sources.
 *
 * The app is local-first: every screen reads and writes AsyncStorage, and this
 * module reconciles that state with Notion whenever the network allows. Supports
 * multi-collection syncing across Remember, Learnings, Blessings, Sayings, and Try Doing.
 *
 * Conflicts are resolved last-write-wins on `Thought.updatedAt`, with one
 * deliberate exception: a local delete always beats a remote edit. Deleting is
 * an explicit, considered action, and silently resurrecting a row the user threw
 * away is a worse failure than losing an edit they made elsewhere.
 */

export interface SyncOutcome {
  ok: boolean;
  /** Local changes written to Notion. */
  pushed: number;
  /** Remote changes written locally. */
  pulled: number;
  /** Rows created directly in Notion that the app took ownership of. */
  adopted: number;
  /** Local thoughts removed because their Notion page was trashed. */
  removed: number;
  /** Notion pages trashed to replay local deletes. */
  trashed: number;
  /** ISO timestamp, present only on success. */
  syncedAt?: string;
  /** User-facing message, present only on failure. */
  error?: string;
}

const EMPTY: Omit<SyncOutcome, 'ok'> = {
  pushed: 0,
  pulled: 0,
  adopted: 0,
  removed: 0,
  trashed: 0,
};

export type NotionSyncTargets = Partial<Record<CollectionId, string>> | string;

/**
 * Guards against overlapping runs. Reconnect, foreground and manual refresh can
 * all fire within the same second, and two passes interleaving their reads and
 * writes would double-create pages.
 */
let inFlight: Promise<SyncOutcome> | null = null;

/** Resolved target cache per database ID, so repeat syncs skip the database lookup. */
const cachedTargets = new Map<string, NotionTarget>();

export function invalidateTargetCache(): void {
  cachedTargets.clear();
}

export async function syncWithNotion(targets: NotionSyncTargets): Promise<SyncOutcome> {
  if (inFlight) return inFlight;
  inFlight = performSync(targets).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function resolveCachedTarget(databaseId: string): Promise<NotionTarget> {
  const cached = cachedTargets.get(databaseId);
  if (cached) return cached;
  const target = await resolveTarget(databaseId);
  await ensureSchema(target);
  cachedTargets.set(databaseId, target);
  return target;
}

function normalizeTargets(targets: NotionSyncTargets): Array<{ collection: CollectionId; databaseId: string }> {
  if (typeof targets === 'string') {
    const trimmed = targets.trim();
    return trimmed ? [{ collection: 'remember', databaseId: trimmed }] : [];
  }
  const list: Array<{ collection: CollectionId; databaseId: string }> = [];
  for (const [col, dbId] of Object.entries(targets)) {
    if (typeof dbId === 'string' && dbId.trim() && isCollectionId(col)) {
      list.push({ collection: col, databaseId: dbId.trim() });
    }
  }
  return list;
}

async function performSync(targetsInput: NotionSyncTargets): Promise<SyncOutcome> {
  try {
    const token = await getToken();
    if (!token) {
      return { ok: false, ...EMPTY, error: 'Add your Notion integration token in Settings.' };
    }

    const targetList = normalizeTargets(targetsInput);
    if (targetList.length === 0) {
      return { ok: true, ...EMPTY, syncedAt: new Date().toISOString() };
    }

    const combinedCounts = { ...EMPTY };

    for (const { collection, databaseId } of targetList) {
      const target = await resolveCachedTarget(databaseId);
      const pages = await queryAllPages(target);
      const local = (await loadThoughts()).filter(t => (t.collection ?? 'remember') === collection);
      const tombstones = (await loadTombstones()).filter(
        t => !t.collection || t.collection === collection
      );

      // Index remote rows by the local id they carry, and keep the ownerless ones
      // aside for adoption.
      const remoteById = new Map<string, NotionPage>();
      const orphanPages: NotionPage[] = [];
      for (const page of pages) {
        if (page.in_trash === true || page.archived === true) continue;
        const parsed = pageToThought(page, collection);
        if (parsed) remoteById.set(parsed.id, page);
        else orphanPages.push(page);
      }

      combinedCounts.trashed += await replayDeletes(tombstones, remoteById);
      const pulledOrRemoved = await applyRemoteChanges(local, remoteById, tombstones, collection);
      combinedCounts.pulled += pulledOrRemoved.pulled;
      combinedCounts.removed += pulledOrRemoved.removed;
      combinedCounts.adopted += await adoptOrphans(target, orphanPages, collection);
      combinedCounts.pushed += await pushLocalChanges(target, remoteById, tombstones, collection);
    }

    return { ok: true, ...combinedCounts, syncedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof NotionError && (error.kind === 'not-found' || error.kind === 'unauthorized')) {
      cachedTargets.clear();
    }
    return { ok: false, ...EMPTY, error: describeNotionError(error) };
  }
}

/**
 * Replays local deletes to Notion, then forgets the tombstones that landed.
 *
 * A tombstone whose page is already gone counts as settled -- the outcome the
 * user asked for is the outcome that exists.
 */
async function replayDeletes(
  tombstones: Tombstone[],
  remoteById: Map<string, NotionPage>
): Promise<number> {
  if (tombstones.length === 0) return 0;

  const settled: string[] = [];
  let trashed = 0;

  for (const tombstone of tombstones) {
    const pageId = tombstone.notionPageId ?? remoteById.get(tombstone.id)?.id;
    if (!pageId) {
      // Never reached Notion in the first place; nothing to replay.
      settled.push(tombstone.id);
      continue;
    }
    try {
      await archivePage(pageId);
      trashed++;
      settled.push(tombstone.id);
    } catch (error) {
      // 404 means someone already removed it in Notion. Anything else is a real
      // failure worth retrying on the next pass, so the tombstone stays put.
      if (error instanceof NotionError && error.kind === 'not-found') {
        settled.push(tombstone.id);
      }
    }
    remoteById.delete(tombstone.id);
  }

  await clearTombstones(settled);
  return trashed;
}

/**
 * Writes remote-newer edits locally and drops thoughts whose page was trashed
 * in Notion.
 */
async function applyRemoteChanges(
  local: Thought[],
  remoteById: Map<string, NotionPage>,
  tombstones: Tombstone[],
  collection: CollectionId = 'remember'
): Promise<{ pulled: number; removed: number }> {
  const deletedIds = new Set(tombstones.map(t => t.id));
  let pulled = 0;
  let removed = 0;

  for (const thought of local) {
    if (deletedIds.has(thought.id)) continue;

    const page = remoteById.get(thought.id);

    if (!page) {
      // Only treat absence as a remote delete for thoughts that were synced
      // before. One that has never been pushed is simply new, not deleted.
      if (thought.notionPageId) {
        await removeThoughtLocally(thought.id);
        removed++;
      }
      continue;
    }

    const remote = pageToThought(page, collection);
    if (!remote) continue;

    if (Date.parse(remote.updatedAt) > Date.parse(thought.updatedAt)) {
      // touch:false preserves the remote timestamp -- bumping it here would make
      // the record look locally-newer and bounce straight back to Notion.
      await updateThought(remote, false);
      pulled++;
    }
  }

  // Rows that exist remotely with an App ID we have never seen: either created
  // on another device, or restored from the Notion trash.
  const localIds = new Set(local.map(t => t.id));
  const additions: Thought[] = [];
  for (const [id, page] of remoteById) {
    if (localIds.has(id) || deletedIds.has(id)) continue;
    const remote = pageToThought(page, collection);
    if (remote) additions.push(remote);
  }

  if (additions.length > 0) {
    const current = await loadThoughts();
    await saveThoughts([...current, ...additions]);
    pulled += additions.length;
  }

  return { pulled, removed };
}

/**
 * Takes ownership of rows a user typed straight into Notion by giving them a
 * local id and stamping it back onto the page, so later syncs can match them.
 */
async function adoptOrphans(
  target: NotionTarget,
  orphanPages: NotionPage[],
  collection: CollectionId = 'remember'
): Promise<number> {
  if (orphanPages.length === 0) return 0;

  const adopted: Thought[] = [];
  for (const page of orphanPages) {
    const thought = pageToThoughtWithId(page, randomUUID(), collection);
    if (!thought.content.trim()) continue; // Skip the blank row Notion leaves behind.
    try {
      await updatePage(page.id, thought);
      adopted.push(thought);
    } catch {
      // Leave it orphaned; the next sync will try again.
    }
  }

  if (adopted.length > 0) {
    const current = await loadThoughts();
    await saveThoughts([...current, ...adopted]);
  }

  return adopted.length;
}

/** Creates pages for new thoughts and updates the ones edited locally. */
async function pushLocalChanges(
  target: NotionTarget,
  remoteById: Map<string, NotionPage>,
  tombstones: Tombstone[],
  collection: CollectionId = 'remember'
): Promise<number> {
  const deletedIds = new Set(tombstones.map(t => t.id));
  const local = (await loadThoughts()).filter(t => (t.collection ?? 'remember') === collection);
  let pushed = 0;

  for (const thought of local) {
    if (deletedIds.has(thought.id)) continue;

    const page = remoteById.get(thought.id);

    if (!page) {
      if (thought.notionPageId) continue; // Handled as a remote delete already.
      try {
        const created = await createPage(target, thought);
        await updateThought({ ...thought, notionPageId: created.id }, false);
        pushed++;
      } catch (error) {
        if (isFatal(error)) throw error;
      }
      continue;
    }

    const remote = pageToThought(page, collection);
    const remoteNewer = remote && Date.parse(remote.updatedAt) >= Date.parse(thought.updatedAt);
    if (remoteNewer) {
      // Backfill the page id for a thought adopted from another device.
      if (!thought.notionPageId) {
        await updateThought({ ...thought, notionPageId: page.id }, false);
      }
      continue;
    }

    try {
      await updatePage(page.id, thought);
      if (!thought.notionPageId) {
        await updateThought({ ...thought, notionPageId: page.id }, false);
      }
      pushed++;
    } catch (error) {
      if (isFatal(error)) throw error;
    }
  }

  return pushed;
}

/**
 * Auth and connectivity failures doom the whole pass, so they abort it. A single
 * malformed row should not, so validation errors are swallowed per-item.
 */
function isFatal(error: unknown): boolean {
  return (
    error instanceof NotionError &&
    (error.kind === 'unauthorized' || error.kind === 'network' || error.kind === 'no-token')
  );
}

/**
 * Records a delete for a thought that was never pushed, so callers can drop a
 * row without reaching for the storage layer's tombstone API directly.
 */
export async function recordRemoteDelete(thought: Thought): Promise<void> {
  await addTombstone({
    id: thought.id,
    deletedAt: new Date().toISOString(),
    notionPageId: thought.notionPageId,
  });
}

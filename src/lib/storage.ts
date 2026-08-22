import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { CollectionId, isCollectionId, Thought, ThoughtDraft, Tombstone } from '../types';

const STORAGE_KEY = 'remember_app_thoughts';
const TOMBSTONE_KEY = 'remember_app_tombstones';

/**
 * Tombstones older than this are pruned on load. The window only needs to be long
 * enough for a delete to reach Notion; beyond that the remote page is already gone
 * and the record is dead weight.
 */
const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Backfills fields added after the initial release so records written by older
 * builds keep working. Without this, pre-existing thoughts have no `updatedAt`
 * or `collection` and would lose conflict resolution against Notion.
 */
function migrate(thought: Thought): Thought {
  const collection: CollectionId = isCollectionId(thought.collection) ? thought.collection : 'remember';
  const updatedAt = thought.updatedAt ?? thought.createdAt ?? nowIso();
  if (thought.updatedAt && thought.collection) return thought;
  return { ...thought, collection, updatedAt };
}

const STARTER_THOUGHTS: Thought[] = [
  {
    id: 'starter-1',
    collection: 'remember',
    content: 'Review core architecture decisions before morning deep work session.',
    repeatIntervalDays: 1,
    colorTheme: 'sage',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completionHistory: [],
  },
  {
    id: 'starter-2',
    collection: 'learnings',
    heading: 'First Principles Thinking',
    subheading: 'Break problems down into fundamental truths rather than reasoning by analogy.',
    content: 'First Principles Thinking: Break problems down into fundamental truths rather than reasoning by analogy.',
    repeatIntervalDays: 1,
    colorTheme: 'dustyBlue',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completionHistory: [],
  },
  {
    id: 'starter-3',
    collection: 'blessings',
    heading: 'Morning stillness & sunlight',
    subheading: 'A peaceful cup of coffee with cool breeze and zero rush.',
    content: 'Morning stillness & sunlight: A peaceful cup of coffee with cool breeze and zero rush.',
    eventDate: nowIso(),
    repeatIntervalDays: 1,
    colorTheme: 'rose',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completionHistory: [],
  },
  {
    id: 'starter-4',
    collection: 'sayings',
    content: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
    repeatIntervalDays: 1,
    colorTheme: 'lavender',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completionHistory: [],
  },
  {
    id: 'starter-5',
    collection: 'tryDoing',
    content: 'Go for a 20-minute walk without your phone or headphones.',
    repeatIntervalDays: 1,
    colorTheme: 'mutedYellow',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completionHistory: [],
  },
];

export async function loadThoughts(): Promise<Thought[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue == null) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_THOUGHTS));
      return STARTER_THOUGHTS;
    }
    const parsed: Thought[] = JSON.parse(jsonValue);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_THOUGHTS));
      return STARTER_THOUGHTS;
    }
    return parsed.map(migrate);
  } catch (e) {
    console.error('Failed to load thoughts from local storage', e);
    return [];
  }
}

export async function saveThoughts(thoughts: Thought[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  } catch (e) {
    console.error('Failed to save thoughts to local storage', e);
  }
}

/** Creates a thought from user-editable fields, owning id and both timestamps. */
export async function addThought(draft: ThoughtDraft): Promise<Thought[]> {
  const timestamp = nowIso();
  const thought: Thought = {
    ...draft,
    collection: draft.collection ?? 'remember',
    id: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    completionHistory: [],
  };
  const current = await loadThoughts();
  const updated = [...current, thought];
  await saveThoughts(updated);
  return updated;
}

/**
 * Persists a thought and stamps `updatedAt`. Pass `touch: false` only for writes
 * originating from a Notion pull, where the remote timestamp must be preserved —
 * bumping it there would make every pulled record look locally-newer and ping-pong
 * the change straight back to Notion.
 */
export async function updateThought(thought: Thought, touch = true): Promise<Thought[]> {
  const current = await loadThoughts();
  const next = touch ? { ...thought, updatedAt: nowIso() } : thought;
  const updated = current.map(t => (t.id === next.id ? next : t));
  await saveThoughts(updated);
  return updated;
}

/** Deletes a thought and records a tombstone so the deletion can reach Notion. */
export async function deleteThought(id: string): Promise<Thought[]> {
  const current = await loadThoughts();
  const target = current.find(t => t.id === id);
  const updated = current.filter(t => t.id !== id);
  await saveThoughts(updated);
  if (target) {
    await addTombstone({
      id,
      deletedAt: nowIso(),
      notionPageId: target.notionPageId,
      collection: target.collection ?? 'remember',
    });
  }
  return updated;
}

/**
 * Removes a thought without recording a tombstone. Used when applying a deletion
 * that originated in Notion — a tombstone there would be redundant.
 */
export async function removeThoughtLocally(id: string): Promise<Thought[]> {
  const current = await loadThoughts();
  const updated = current.filter(t => t.id !== id);
  await saveThoughts(updated);
  return updated;
}

export async function replaceAllThoughts(thoughts: Thought[]): Promise<Thought[]> {
  const migrated = thoughts.map(migrate);
  await saveThoughts(migrated);
  return migrated;
}

/* ------------------------------- tombstones ------------------------------- */

export async function loadTombstones(): Promise<Tombstone[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(TOMBSTONE_KEY);
    if (jsonValue == null) return [];
    const parsed: Tombstone[] = JSON.parse(jsonValue);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - TOMBSTONE_RETENTION_MS;
    return parsed.filter(t => new Date(t.deletedAt).getTime() >= cutoff);
  } catch (e) {
    console.error('Failed to load tombstones from local storage', e);
    return [];
  }
}

export async function saveTombstones(tombstones: Tombstone[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
  } catch (e) {
    console.error('Failed to save tombstones to local storage', e);
  }
}

export async function addTombstone(tombstone: Tombstone): Promise<void> {
  const current = await loadTombstones();
  if (current.some(t => t.id === tombstone.id)) return;
  await saveTombstones([...current, tombstone]);
}

/** Drops tombstones once their deletion has been confirmed against Notion. */
export async function clearTombstones(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const current = await loadTombstones();
  const removal = new Set(ids);
  await saveTombstones(current.filter(t => !removal.has(t.id)));
}

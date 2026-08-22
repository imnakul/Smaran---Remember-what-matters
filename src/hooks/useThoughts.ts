import { useState, useEffect, useCallback } from 'react';
import { Thought, ThoughtDraft } from '../types';
import * as storage from '../lib/storage';
import { formatDateString } from '../lib/scheduling';
import { useSync } from '../context/SyncContext';

export interface UseThoughtsResult {
  thoughts: Thought[];
  isLoading: boolean;
  addThought: (draft: ThoughtDraft) => Promise<void>;
  updateThought: (thought: Thought) => Promise<void>;
  deleteThought: (id: string) => Promise<void>;
  restoreThought: (thought: Thought) => Promise<void>;
  setArchived: (thought: Thought, archived: boolean) => Promise<void>;
  toggleCompletion: (thought: Thought, date: Date | string) => Promise<void>;
  replaceAll: (thoughts: Thought[]) => Promise<void>;
  /** Re-reads from disk. Called after a sync writes records behind the hook's back. */
  reload: () => Promise<void>;
}

export function useThoughts(): UseThoughtsResult {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /**
   * Every mutation below nudges the sync engine. Hooking it in here rather than
   * at each call site means a new write path cannot silently skip syncing --
   * this hook is the only way the app mutates thoughts.
   */
  const { requestSync } = useSync();

  useEffect(() => {
    let cancelled = false;
    storage.loadThoughts().then(data => {
      if (cancelled) return;
      setThoughts(data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    setThoughts(await storage.loadThoughts());
  }, []);

  const addThought = useCallback(async (draft: ThoughtDraft) => {
    setThoughts(await storage.addThought(draft));
    requestSync();
  }, [requestSync]);

  const updateThought = useCallback(async (thought: Thought) => {
    setThoughts(await storage.updateThought(thought));
    requestSync();
  }, [requestSync]);

  const deleteThought = useCallback(async (id: string) => {
    setThoughts(await storage.deleteThought(id));
    requestSync();
  }, [requestSync]);

  /**
   * Re-inserts a deleted thought and drops its tombstone, backing the undo
   * affordance on swipe-to-delete.
   */
  const restoreThought = useCallback(async (thought: Thought) => {
    await storage.clearTombstones([thought.id]);
    const current = await storage.loadThoughts();
    if (current.some(t => t.id === thought.id)) {
      setThoughts(current);
      requestSync();
      return;
    }
    await storage.saveThoughts([...current, thought]);
    setThoughts(await storage.loadThoughts());
    requestSync();
  }, [requestSync]);

  const setArchived = useCallback(async (thought: Thought, archived: boolean) => {
    setThoughts(await storage.updateThought({ ...thought, archived }));
    requestSync();
  }, [requestSync]);

  const replaceAll = useCallback(async (newThoughts: Thought[]) => {
    setThoughts(await storage.replaceAllThoughts(newThoughts));
    requestSync();
  }, [requestSync]);

  const toggleCompletion = useCallback(async (thought: Thought, date: Date | string) => {
    const dateStr = formatDateString(date);
    const isCompleted = thought.completionHistory.includes(dateStr);

    const completionHistory = isCompleted
      ? thought.completionHistory.filter(d => d !== dateStr)
      : [...thought.completionHistory, dateStr];

    setThoughts(await storage.updateThought({ ...thought, completionHistory }));
    requestSync();
  }, [requestSync]);

  return {
    thoughts,
    isLoading,
    addThought,
    updateThought,
    deleteThought,
    restoreThought,
    setArchived,
    toggleCompletion,
    replaceAll,
    reload,
  };
}

import { subDays } from 'date-fns';
import { Thought } from '../types';
import { getProgressForDate } from './scheduling';

/**
 * Current streak = consecutive days, walking back from `from`, where every
 * scheduled thought was completed. Days with nothing scheduled are skipped
 * (they neither extend nor break the streak).
 */
export function computeStreak(thoughts: Thought[], from: Date = new Date()): number {
  let streak = 0;
  let cursor = from;
  const maxLookback = 1000;

  for (let i = 0; i < maxLookback; i++) {
    const { completed, total } = getProgressForDate(thoughts, cursor);
    if (total > 0) {
      if (completed === total) {
        streak += 1;
      } else {
        break;
      }
    }
    cursor = subDays(cursor, 1);
  }

  return streak;
}

export interface HeatmapDay {
  date: Date;
  completed: number;
  total: number;
}

/**
 * Builds day-by-day completion data ending at `endDate`, oldest first —
 * suitable for a GitHub-style contribution heatmap.
 */
export function computeHeatmapData(thoughts: Thought[], endDate: Date = new Date(), days = 98): HeatmapDay[] {
  const result: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(endDate, i);
    const { completed, total } = getProgressForDate(thoughts, date);
    result.push({ date, completed, total });
  }
  return result;
}

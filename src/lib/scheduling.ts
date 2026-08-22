import { differenceInCalendarDays, startOfDay, format, parseISO } from 'date-fns';
import { Thought } from '../types';

/**
 * Normalizes a date or ISO string to the start of the day for consistent comparison.
 */
export function normalizeDate(date: Date | string): Date {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(parsed);
}

/**
 * Formats a date to YYYY-MM-DD string format for storage in completion history.
 */
export function formatDateString(date: Date | string): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, 'yyyy-MM-dd');
}

/**
 * Determines if a Thought is scheduled to appear on a specific target date.
 * 
 * Logic:
 * - Date must be on or after the creation date.
 * - The difference in calendar days between targetDate and createdAt must be 
 *   an exact multiple of the repeatIntervalDays.
 */
export function isThoughtScheduledForDate(thought: Thought, targetDate: Date | string): boolean {
  if (thought.archived) return false;

  const target = normalizeDate(targetDate);
  const created = normalizeDate(thought.createdAt);

  // It shouldn't appear before it was created
  if (target < created) {
    return false;
  }

  const daysDiff = differenceInCalendarDays(target, created);
  
  // If interval is 0 or negative (edge case, shouldn't happen), prevent division by zero
  if (thought.repeatIntervalDays <= 0) return false;

  return daysDiff % thought.repeatIntervalDays === 0;
}

/**
 * Returns all Thoughts scheduled for a specific date from a list.
 */
export function getScheduledThoughtsForDate(thoughts: Thought[], targetDate: Date | string): Thought[] {
  return thoughts.filter(thought => isThoughtScheduledForDate(thought, targetDate));
}

/**
 * Checks if a Thought is marked as completed on a specific date.
 */
export function isThoughtCompletedOnDate(thought: Thought, targetDate: Date | string): boolean {
  const dateStr = formatDateString(targetDate);
  return thought.completionHistory.includes(dateStr);
}

/**
 * Calculates progress for a specific date (completed / total scheduled).
 */
export function getProgressForDate(thoughts: Thought[], targetDate: Date | string): { completed: number, total: number } {
  const scheduledThoughts = getScheduledThoughtsForDate(thoughts, targetDate);
  const completed = scheduledThoughts.filter(t => isThoughtCompletedOnDate(t, targetDate)).length;
  
  return {
    completed,
    total: scheduledThoughts.length
  };
}

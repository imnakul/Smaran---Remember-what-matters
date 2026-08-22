import { useState, useCallback } from 'react';
import { addDays, subDays } from 'date-fns';
import { normalizeDate } from '../lib/scheduling';

export function useSelectedDate(initialDate: Date = new Date()) {
  const [selectedDate, setSelectedDate] = useState<Date>(normalizeDate(initialDate));

  const setDate = useCallback((date: Date) => {
    setSelectedDate(normalizeDate(date));
  }, []);

  const nextDay = useCallback(() => {
    setSelectedDate(prev => addDays(prev, 1));
  }, []);

  const prevDay = useCallback(() => {
    setSelectedDate(prev => subDays(prev, 1));
  }, []);

  return {
    selectedDate,
    setDate,
    nextDay,
    prevDay,
  };
}

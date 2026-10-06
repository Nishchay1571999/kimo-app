import type { EntryAnalysis } from '../entries/analysis';

export type EntryType = 'image' | 'audio' | 'text';

export type TimelineEntryData = {
  id: string;
  time: string;
  title: string;
  type: EntryType;
  description?: string;
  image?: string;
  duration?: string;
  category?: 'note' | 'nutrition' | 'exercise';
  outsideSchedule?: boolean;
  eventDate?: string;
  ai: EntryAnalysis;
};

export type TimelineItemData =
  | { kind: 'boundary'; id: string; label: string; time: string; eventDate?: string }
  | { kind: 'entry'; id: string; entry: TimelineEntryData };

export type DayData = {
  dateKey: string;
  day: string;
  date: string;
  recorded: boolean | null;
  active?: boolean;
};

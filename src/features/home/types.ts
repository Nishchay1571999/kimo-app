export type EntryType = 'image' | 'audio' | 'text';

export type TimelineEntryData = {
  id: string;
  time: string;
  title: string;
  type: EntryType;
  description?: string;
  image?: string;
  duration?: string;
};

export type DayData = {
  day: string;
  date: string;
  recorded: boolean;
  active?: boolean;
};

import type { Home } from './schema/home-schema';
import type { TimelineItemData } from './types';
import { dateLabel, formatTime } from './calendar';

export function toTimeline(home: Home): TimelineItemData[] {
  return home.timeline.map((item) => {
    const time = formatTime(item.time);
    const eventDate = item.date !== home.date ? dateLabel(item.date, 'short') : undefined;
    if (item.type === 'boundary') return {
      kind: 'boundary', id: `${item.boundary}-${item.date}-${item.time}`,
      time, label: item.boundary === 'wake' ? 'Wake up' : 'Sleep', eventDate,
    };
    const image = item.entry.attachments.find((file) => file.type === 'image');
    const audio = item.entry.attachments.find((file) => file.type === 'audio');
    return { kind: 'entry', id: item.entry.id, entry: {
      id: item.entry.id, time, eventDate, outsideSchedule: item.outsideSchedule,
      title: item.entry.title, category: item.entry.category, description: item.entry.note ?? undefined,
      ai: item.entry.ai,
      type: image ? 'image' : audio ? 'audio' : 'text',
      image: image ? `data:${image.mimeType};base64,${image.base64}` : undefined,
      duration: audio?.durationMs === undefined ? undefined : `${Math.floor(audio.durationMs / 60000)}:${String(Math.floor(audio.durationMs / 1000) % 60).padStart(2, '0')}`,
    } };
  });
}

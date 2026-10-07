import { reportingDateSchema } from './schema/home-schema';

export function todayInTimezone(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function shiftDate(value: string, days: number) {
  const date = new Date(reportingDateSchema.parse(value));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(reportingDateSchema.parse(to)) - Date.parse(reportingDateSchema.parse(from))) / 86400000);
}
/** Last day of the rolling 7-day window holding `value`; windows are anchored on `today`, which is the newest day shown. */
export function windowEnd(value: string, today: string) {
  const back = daysBetween(value, today);
  return back <= 0 ? today : shiftDate(today, -7 * Math.floor(back / 7));
}
/** Seven days ending at the window's last day, newest first (today, yesterday, …). */
export function weekDates(value: string, today: string) {
  const end = windowEnd(value, today);
  return Array.from({ length: 7 }, (_, day) => shiftDate(end, -day));
}
export function dateLabel(value: string, weekday: 'short' | 'long' = 'long') {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday, month: 'short', day: 'numeric' }).format(new Date(reportingDateSchema.parse(value)));
}
export function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

import { router } from 'expo-router';
import type { DayGoal } from '@/features/home/schema/home-schema';

/** Opens Kimo with a question already asked, so the user never starts from a blank chat. */
export function askKimo(prompt: string) {
  router.push({ pathname: '/chat/new', params: { prompt } });
}
const weekday = (date: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(new Date(date));
export function dayQuestion(date: string, isToday: boolean, goal: DayGoal | null) {
  if (isToday) return goal?.status === 'over' ? 'I went over my target today. What should I do for the rest of the day?' : 'How am I doing today with my meals and exercise, and what should I eat next?';
  const day = `${weekday(date)} (${date})`;
  if (goal?.status === 'over') return `Why was I over my target on ${day}?`;
  if (goal?.status === 'under') return `Was I really under my target on ${day}, or did I miss logging something?`;
  return `How did ${day} go against my target?`;
}
export function mealQuestion(title: string, date: string, entryId: string) {
  return `Tell me about my meal "${title}" on ${date} (entry ${entryId}). How does it fit my target, and what would you change?`;
}

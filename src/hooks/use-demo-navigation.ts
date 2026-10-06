import { useLocalSearchParams, type Href } from 'expo-router';
import { useSessionStore } from '@/features/auth/store/session-store';
import { todayInTimezone } from '@/features/home/calendar';

export function localDate(timezone?: string) {
  if (timezone) return todayInTimezone(timezone);
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function useDemoNavigation() {
  const timezone = useSessionStore(state => state.account?.timezone);
  const params = useLocalSearchParams<{
    origin?: string; date?: string; entryId?: string; threadId?: string; returnTo?: string;
  }>();
  const date = params.date ?? localDate(timezone);
  const origin = params.origin ?? 'home';
  const day: Href = { pathname: '/history/day/[date]', params: { date } };
  const origins: Record<string, Href> = {
    home: { pathname: '/(tabs)', params: { date } }, profile: '/(tabs)/profile', history: '/history', ai: '/(tabs)/ai', day,
  };
  return {
    ...params, date, origin, day,
    backToOrigin: origins[origin] ?? origins.home,
    withOrigin: (pathname: '/capture' | '/capture/review' | '/entries/new-meal' |
      '/entries/new-exercise' | '/entries/new-note' | '/goals/current' | '/goals/edit' | '/weight/new',
      source = origin): Href => ({ pathname, params: { origin: source, date } }),
    entry: { pathname: '/entries/[entryId]', params: { entryId: 'demo-meal', date, origin } } satisfies Href,
  };
}

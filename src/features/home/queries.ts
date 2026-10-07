import { queryOptions } from '@tanstack/react-query';
import type { createHomeService } from './services/home-service';
import { analysisPending, analysisPollInterval } from '../entries/analysis';
import type { Home } from './schema/home-schema';

export const homeHasPendingAnalysis = (home?: Home) => !!home?.timeline.some(item => item.type === 'entry' && analysisPending(item.entry.ai));

export type HomeIdentity = { id: string; epoch: number; timezone: string };
export const homeKey = (identity: HomeIdentity, date: string) => ['account', identity.epoch, 'home', identity.id, identity.timezone, date] as const;
export function homeQueryOptions(service: ReturnType<typeof createHomeService>, identity: HomeIdentity, date: string, activeSince: number | null = null) {
  return queryOptions({ queryKey: homeKey(identity, date), queryFn: ({ signal }) => service.get(date, signal), staleTime: 30000, gcTime: 120000,
    retry: false, refetchIntervalInBackground: false,
    refetchInterval: query => analysisPollInterval(homeHasPendingAnalysis(query.state.data), query.state.status === 'error', activeSince),
  });
}
// Shares the 'home' key segment so saving an entry also refreshes week statuses.
export const weekKey = (identity: HomeIdentity, date: string) => ['account', identity.epoch, 'home', identity.id, identity.timezone, 'week', date] as const;
export function weekQueryOptions(service: ReturnType<typeof createHomeService>, identity: HomeIdentity, date: string) {
  return queryOptions({ queryKey: weekKey(identity, date), queryFn: ({ signal }) => service.week(date, signal), staleTime: 30000, gcTime: 120000, retry: false });
}

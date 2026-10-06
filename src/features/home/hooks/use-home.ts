import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useActiveScreen } from '@/hooks/use-active-screen';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useSessionStore } from '@/features/auth/store/session-store';
import { homeHasPendingAnalysis, homeKey, homeQueryOptions } from '../queries';
import { createHomeService } from '../services/home-service';
import { reportingDateSchema, type Home } from '../schema/home-schema';
import { todayInTimezone, weekDates } from '../calendar';
import type { DayData } from '../types';

const service = createHomeService(api);
export function useHome(requestedDate?: string) {
  const { account, epoch } = useSessionStore(state => state);
  const timezone = account?.timezone ?? 'Asia/Kolkata';
  const [now, setNow] = useState(() => Date.now());
  const activeSince = useActiveScreen(`${account?.id}:${epoch}:${timezone}:${requestedDate ?? 'today'}`);
  const today = todayInTimezone(timezone, new Date(Math.max(now, activeSince ?? 0)));
  const refreshToday = useCallback(() => setNow(Date.now()), []);
  useEffect(() => {
    const timer = setInterval(refreshToday, 60000);
    return () => clearInterval(timer);
  }, [refreshToday]);
  const validDate = requestedDate === undefined || Boolean(reportingDateSchema.safeParse(requestedDate).success);
  const onboarded = Boolean(account?.onboardingCompleted);
  const date = validDate ? requestedDate ?? today : today;
  const identity = { id: account?.id ?? 'visitor', epoch, timezone };
  const query = useQuery({ ...homeQueryOptions(service, identity, date, activeSince), enabled: onboarded && validDate && activeSince !== null });
  const { refetch } = query;
  const ownerId = identity.id;
  useEffect(() => {
    if (activeSince === null) return;
    if (!onboarded || !validDate) return;
    const cached = queryClient.getQueryState<Home>(homeKey({ id: ownerId, epoch, timezone }, date));
    if (cached?.data && cached.fetchStatus !== 'fetching' && (homeHasPendingAnalysis(cached.data) || activeSince - cached.dataUpdatedAt >= 30000)) void refetch();
  }, [activeSince, onboarded, validDate, ownerId, epoch, timezone, date, refetch]);
  const days: DayData[] = weekDates(date).map(dateKey => {
    const cached = queryClient.getQueryData<Home>(homeKey(identity, dateKey));
    return { dateKey, day: dateKey === today ? 'Today' : new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(new Date(dateKey)),
      date: String(Number(dateKey.slice(-2))), active: dateKey === date,
      recorded: cached ? cached.timeline.some(item => item.type === 'entry') : null };
  });
  return { query, account, date, today, days, validDate };
}

import { queryOptions, type QueryClient } from '@tanstack/react-query';
import type { Entry } from './schema';
import type { createEntryService, EntryIdentity } from './services/entry-service';
import { analysisPending, analysisPollInterval } from './analysis';

export const entryKey = (owner: Pick<EntryIdentity, 'id' | 'epoch'>, id: string) => ['account', owner.epoch, 'entry', owner.id, id] as const;
export const entriesKey = (owner: Pick<EntryIdentity, 'id' | 'epoch'>, date: string) => ['account', owner.epoch, 'entries', owner.id, date] as const;
export function entryQueryOptions(service: ReturnType<typeof createEntryService>, owner: Pick<EntryIdentity, 'id' | 'epoch'>, id: string, activeSince: number | null = null) {
  return queryOptions({ queryKey: entryKey(owner, id), queryFn: ({ signal }) => service.get(id, signal, owner), staleTime: 30000, gcTime: 120000,
    retry: false, refetchIntervalInBackground: false,
    refetchInterval: query => analysisPollInterval(!!query.state.data && analysisPending(query.state.data.ai), query.state.status === 'error', activeSince),
  });
}
export function entriesQueryOptions(service: ReturnType<typeof createEntryService>, owner: Pick<EntryIdentity, 'id' | 'epoch'>, date: string) {
  return queryOptions({ queryKey: entriesKey(owner, date), queryFn: ({ signal }) => service.list(date, signal, owner), staleTime: 30000, gcTime: 120000 });
}
export async function refreshEntryCaches(client: QueryClient, owner: EntryIdentity, entryId: string, entry: Entry | undefined, isCurrent: () => boolean) {
  if (!isCurrent()) return;
  const related = { predicate: (query: { queryKey: readonly unknown[] }) => {
    const key = query.queryKey;
    return key[0] === 'account' && key[1] === owner.epoch && key[3] === owner.id && (key[2] === 'home' || key[2] === 'entries');
  } };
  // Stop older in-flight reads from replacing newly saved facts.
  await Promise.all([client.cancelQueries(related), client.cancelQueries({ queryKey: entryKey(owner, entryId), exact: true })]);
  if (!isCurrent()) return;
  if (entry) client.setQueryData(entryKey(owner, entryId), entry);
  else client.removeQueries({ queryKey: entryKey(owner, entryId), exact: true });
  await client.invalidateQueries(related);
}

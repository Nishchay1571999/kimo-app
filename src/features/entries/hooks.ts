import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useActiveScreen } from '@/hooks/use-active-screen';
import { api } from '@/lib/api';
import { sessionStore, useSessionStore } from '@/features/auth/store/session-store';
import { uploadStore } from '@/features/upload/store/upload-store';
import { createEntryService, type EntryIdentity } from './services/entry-service';
import { createSaveDraft } from './save-draft';
import { entryKey, entryQueryOptions, refreshEntryCaches } from './queries';
import { analysisPending } from './analysis';
import type { Entry } from './schema';

export function getEntryIdentity(): EntryIdentity | null {
  const { account, token, epoch } = sessionStore.getState();
  return account?.onboardingCompleted && token ? { id: account.id, token, epoch } : null;
}
export const entryService = createEntryService(api, getEntryIdentity);
const saveDraft = createSaveDraft(entryService, uploadStore, getEntryIdentity);
export function useEntry(id: string) {
  const { account, epoch } = useSessionStore(s => s);
  const validId = z.uuid().safeParse(id).success;
  const owner = { id: account?.id ?? '', epoch };
  const activeSince = useActiveScreen(`${owner.id}:${epoch}:${id}`);
  const client = useQueryClient();
  const enabled = !!account?.onboardingCompleted && validId && activeSince !== null;
  const query = useQuery({ ...entryQueryOptions(entryService, owner, id, activeSince), enabled });
  const { refetch } = query;
  const ownerId = owner.id;
  useEffect(() => {
    if (!enabled || activeSince === null) return;
    const cached = client.getQueryState<Entry>(entryKey({ id: ownerId, epoch }, id));
    if (cached?.data && cached.fetchStatus !== 'fetching' && (analysisPending(cached.data.ai) || activeSince - cached.dataUpdatedAt >= 30000)) void refetch();
  }, [activeSince, enabled, ownerId, epoch, id, client, refetch]);
  return { query, validId };
}
export function useSaveEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveDraft, retry: false,
    onSuccess: async result => { await refreshEntryCaches(client, result.owner, result.entry.id, result.entry, () => entryService.isCurrent(result.owner)); },
    onError: (_error, draftId) => {
      const owner = getEntryIdentity(); const draft = uploadStore.getState().draft;
      if (owner && draft?.id === draftId && draft.ownerId === owner.id && draft.edit) void client.invalidateQueries({ queryKey: entryKey(owner, draft.edit.entryId), exact: true });
    },
  });
}
export function useDeleteEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const owner = getEntryIdentity(); if (!owner) throw new Error('Please sign in to continue.');
      await entryService.delete(id, owner); return { owner, id };
    }, retry: false,
    onSuccess: async result => { await refreshEntryCaches(client, result.owner, result.id, undefined, () => entryService.isCurrent(result.owner)); },
  });
}

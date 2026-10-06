import type { StoreApi } from 'zustand/vanilla';
import { ApiError } from '../../lib/api/client';
import type { UploadState } from '../upload/store/create-upload-store';
import type { createEntryService, EntryIdentity } from './services/entry-service';

export function createSaveDraft(service: ReturnType<typeof createEntryService>, drafts: StoreApi<UploadState>, getIdentity: () => EntryIdentity | null) {
  const pending = new Map<string, Promise<SaveResult>>();
  type SaveResult = { entry: Awaited<ReturnType<typeof service.save>>; owner: EntryIdentity; cleaned: boolean; previousDate?: string };
  return (draftId: string): Promise<SaveResult> => {
    const owner = getIdentity(); const draft = drafts.getState().draft;
    if (!owner || draft?.id !== draftId || draft.ownerId !== owner.id) return Promise.reject(new ApiError('Your draft or account changed. Please try again.', 0, 'DRAFT_CHANGED'));
    const key = `${owner.id}:${owner.epoch}:${draftId}`;
    const existing = pending.get(key); if (existing) return existing;
    const run = async () => {
      drafts.getState().beginSave(draftId, key);
      try {
        // A confirmed save receipt lets local cleanup retry without another POST/PATCH.
        const entry = draft.savedEntryId ? await service.get(draft.savedEntryId, undefined, owner) : await service.save(draft, owner);
        if (!service.isCurrent(owner)) throw new ApiError('Your session changed. Return to your current account.', 0, 'SESSION_CHANGED');
        const cleaned = drafts.getState().acknowledgeSave(draftId, entry.id);
        return { entry, owner, cleaned, previousDate: draft.edit?.originalDate };
      } finally { drafts.getState().endSave(key); }
    };
    const promise = run().finally(() => { pending.delete(key); });
    pending.set(key, promise); return promise;
  };
}

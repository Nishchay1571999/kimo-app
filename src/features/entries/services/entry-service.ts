import { z } from 'zod';
import { ApiError, type createApiClient } from '../../../lib/api/client';
import { reportingDateSchema } from '../../home/schema/home-schema';
import { validatePhotos } from '../../upload/schema';
import type { UploadDraft } from '../../upload/store/create-upload-store';
import { draftPayload } from '../draft';
import { entrySchema, type Entry } from '../schema';

export type EntryIdentity = { id: string; epoch: number; token: string };
type EntryScope = Pick<EntryIdentity, 'id' | 'epoch'>;
export function createEntryService(client: ReturnType<typeof createApiClient>, getIdentity: () => EntryIdentity | null) {
  const identity = () => { const current = getIdentity(); if (!current) throw new ApiError('Please sign in to continue.', 401, 'SESSION_REQUIRED'); return current; };
  const isCurrent = (expected: EntryIdentity) => {
    const current = getIdentity(); return !!current && current.id === expected.id && current.token === expected.token && current.epoch === expected.epoch;
  };
  const check = (expected: EntryIdentity) => { if (!isCurrent(expected)) throw new ApiError('Your session changed. Return to your current account before trying again.', 0, 'SESSION_CHANGED'); };
  const scopedIdentity = (scope?: EntryScope) => {
    const current = identity();
    if (scope && (scope.id !== current.id || scope.epoch !== current.epoch)) throw new ApiError('Your session changed. Refresh from your current account.', 0, 'SESSION_CHANGED');
    return current;
  };
  const parse = (raw: unknown): Entry => {
    const parsed = entrySchema.safeParse(raw);
    if (!parsed.success) throw new ApiError('Could not confirm the entry returned by the service. Refresh the day before retrying a save.', 0, 'INVALID_ENTRY_RESPONSE');
    try { validatePhotos(parsed.data.attachments); } catch { throw new ApiError('Could not read the entry attachments. Please refresh.', 0, 'INVALID_ENTRY_RESPONSE'); }
    return parsed.data;
  };
  return {
    isCurrent,
    async get(id: string, signal?: AbortSignal, scope?: EntryScope) {
      z.uuid().parse(id); const owner = scopedIdentity(scope);
      const raw = await client.request(`/v1/entries/${id}`, { signal, identity: owner }); check(owner);
      const entry = parse(raw);
      if (entry.id !== id) throw new ApiError('Could not load this entry. Please refresh.', 0, 'INVALID_ENTRY_RESPONSE');
      return entry;
    },
    async list(date: string, signal?: AbortSignal, scope?: EntryScope) {
      reportingDateSchema.parse(date); const owner = scopedIdentity(scope);
      const raw = await client.request(`/v1/entries?date=${encodeURIComponent(date)}`, { signal, identity: owner }); check(owner);
      const parsed = z.array(z.unknown()).safeParse(raw);
      if (!parsed.success) throw new ApiError('Could not load these entries. Please refresh.', 0, 'INVALID_ENTRY_RESPONSE');
      const array = parsed.data.map(parse);
      if (array.some(entry => entry.entryDate !== date) || new Set(array.map(entry => entry.id)).size !== array.length)
        throw new ApiError('Could not load these entries. Please refresh.', 0, 'INVALID_ENTRY_RESPONSE');
      return array;
    },
    async save(draft: UploadDraft, expected: EntryIdentity) {
      check(expected);
      if (draft.ownerId !== expected.id || draft.savedEntryId) throw new ApiError('This draft cannot be saved again.', 0, 'DRAFT_CHANGED');
      const body = draftPayload(draft);
      let raw: unknown;
      try { raw = await client.request(draft.edit ? `/v1/entries/${draft.edit.entryId}` : '/v1/entries', { method: draft.edit ? 'PATCH' : 'POST', body, identity: expected }); }
      catch (error) {
        check(expected);
        if (!draft.edit && error instanceof ApiError && (error.status === 0 || error.status >= 500))
          throw new ApiError('Could not confirm whether the entry was saved. Check the originating day before retrying to avoid creating a duplicate. Your draft is kept.', error.status, 'SAVE_UNCONFIRMED');
        throw error;
      }
      check(expected); const entry = parse(raw);
      if (entry.entryDate !== body.entryDate || entry.category !== body.category || (draft.edit && (entry.id !== draft.edit.entryId || entry.revision < draft.edit.revision)))
        throw new ApiError('Could not confirm the saved entry. Refresh the day before retrying.', 0, 'INVALID_ENTRY_RESPONSE');
      return entry;
    },
    async delete(id: string, expected: EntryIdentity) {
      z.uuid().parse(id); check(expected);
      try { await client.request(`/v1/entries/${id}`, { method: 'DELETE', identity: expected }); }
      catch (error) {
        check(expected);
        // A retry after a lost deletion response can legitimately find it already gone.
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
      check(expected);
    },
  };
}

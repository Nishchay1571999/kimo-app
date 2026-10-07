import { createStore } from 'zustand/vanilla';
import { z } from 'zod';
import { formValuesSchema, initialValues, photoSchema, validatePhotos, type DraftPhoto, type EntryCategory, type EntryFormValues } from '../schema';
import { reportingDateSchema } from '../../home/schema/home-schema';
import { exerciseActivitySchema, foodItemSchema, type ExerciseActivity, type FoodItem } from '../../entries/schema';
import { addCalculatedFood } from '../../nutrition/draft';

export const editMetadataSchema = z.object({ entryId: z.uuid(), revision: z.number().int().positive(), originalDate: reportingDateSchema, originalItems: z.array(foodItemSchema) });
export type EditMetadata = z.infer<typeof editMetadataSchema>;
const draftSchema = z.object({ id: z.string(), ownerId: z.string(), origin: z.string(), sourceDate: reportingDateSchema, values: formValuesSchema, photos: z.array(photoSchema), edit: editMetadataSchema.optional(), savedEntryId: z.uuid().optional(), nutritionItems: z.array(foodItemSchema).max(100).optional(), activities: z.array(exerciseActivitySchema).max(20).optional() });
export type UploadDraft = z.infer<typeof draftSchema>;
type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };
export type UploadState = {
  ownerId: string | null; draft: UploadDraft | null; storageError: string | null; restoreFailed: boolean;
  savingId: string | null;
  beginSave(id: string, operationKey: string): void; endSave(operationKey: string): void;
  acknowledgeSave(id: string, entryId: string): boolean;
  beginEdit(id: string, edit: EditMetadata, values: EntryFormValues, photos: DraftPhoto[], origin: string): boolean;
  addNutritionFood(ownerId: string, id: string, item: FoodItem, targetId?: string, expectedTarget?: EntryFormValues['items'][number]): EntryFormValues;
  /** Writes a confirmed calorie estimate into the draft, replacing earlier foods or activities. */
  applyEstimate(id: string, values: EntryFormValues, result: { nutritionItems?: FoodItem[]; activities?: ExerciseActivity[] }): void;
  retryStorage(): boolean;
  activate(ownerId: string | null): void;
  start(id: string, category: EntryCategory, date: string, origin: string): void;
  update(id: string, values: EntryFormValues): void;
  addPhotos(ownerId: string, id: string, photos: DraftPhoto[]): void;
  removePhoto(id: string, photoId: string): void;
  discard(id: string): boolean; flush(): boolean;
};
export function createUploadStore(storage: Storage) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const key = (owner: string) => `kimo-upload-v1:${owner}`;
  const cache = new Map<string, UploadDraft | null>();
  const writeErrors = new Map<string, string>();
  const store = createStore<UploadState>((set, get) => {
    const persist = () => {
      clearTimeout(timer);
      const { ownerId, draft, restoreFailed } = get();
      if (!ownerId) return true;
      if (restoreFailed) return false;
      cache.set(ownerId, draft);
      try {
        if (draft) storage.setItem(key(ownerId), JSON.stringify(draft)); else storage.removeItem(key(ownerId));
        writeErrors.delete(ownerId); set({ storageError: null }); return true;
      } catch {
        const storageError = 'Could not keep your draft on this device. It is still available while the app is open. Free up space and retry.';
        writeErrors.set(ownerId, storageError); set({ storageError }); return false;
      }
    };
    const changed = (draft: UploadDraft) => {
      set({ draft }); clearTimeout(timer); timer = setTimeout(persist, 350);
    };
    return {
      ownerId: null, draft: null, storageError: null, restoreFailed: false, savingId: null, flush: persist,
      beginSave(id, operationKey) {
        if (get().draft?.id !== id || get().savingId) throw new Error('This draft is already saving or has changed.');
        if (!persist()) throw new Error('Keep your draft on this device before saving. Retry draft storage first.');
        set({ savingId: operationKey });
      },
      endSave(operationKey) { if (get().savingId === operationKey) set({ savingId: null }); },
      acknowledgeSave(id, entryId) {
        const draft = get().draft;
        if (draft?.id !== id) return false;
        changed({ ...draft, savedEntryId: entryId }); persist();
        set({ savingId: null });
        return get().discard(id);
      },
      beginEdit(id, edit, values, photos, origin) {
        const { ownerId, draft, storageError } = get();
        if (!ownerId || draft || storageError) return false;
        validatePhotos(photos);
        changed({ id, ownerId, origin, sourceDate: values.entryDate, values, photos, edit }); persist(); return true;
      },
      addNutritionFood(ownerId, id, item, targetId, expectedTarget) {
        const draft = get().draft;
        if (get().ownerId !== ownerId || draft?.id !== id || get().savingId || draft.savedEntryId) throw new Error('Your draft changed. Select this food again.');
        if (targetId && expectedTarget) {
          const target = draft.values.items.find(food => food.id === targetId);
          const fields = ['id', 'name', 'quantity', 'unit', 'caloriesKcal', 'proteinG', 'carbohydratesG', 'fatG'] as const;
          if (!target || fields.some(field => target[field] !== expectedTarget[field])) throw new Error('This food changed while calculating. Select its reference again to keep your latest edits.');
        }
        const result = addCalculatedFood(draft.values, foodItemSchema.parse(item), targetId);
        const ids = new Set(result.values.items.map(food => food.id));
        const nutritionItems = [...(draft.nutritionItems ?? []).filter(food => food.id !== result.item.id && ids.has(food.id)), result.item];
        changed({ ...draft, values: result.values, nutritionItems }); persist(); return result.values;
      },
      applyEstimate(id, values, result) {
        const draft = get().draft;
        if (draft?.id !== id || get().savingId || draft.savedEntryId) throw new Error('Your draft changed. Calculate again.');
        changed({ ...draft, values: formValuesSchema.parse(values), nutritionItems: result.nutritionItems?.map(item => foodItemSchema.parse(item)),
          activities: result.activities?.map(activity => exerciseActivitySchema.parse(activity)) });
        if (!persist()) throw new Error('Keep your draft on this device before saving. Retry draft storage first.');
      },
      retryStorage() {
        if (!get().restoreFailed) return persist();
        const ownerId = get().ownerId;
        set({ ownerId: null }); get().activate(ownerId);
        return !get().restoreFailed;
      },
      activate(ownerId) {
        if (ownerId === get().ownerId) return;
        persist(); let draft = ownerId ? cache.get(ownerId) ?? null : null;
        let storageError: string | null = ownerId ? writeErrors.get(ownerId) ?? null : null;
        let restoreFailed = false;
        if (ownerId && !cache.has(ownerId)) {
          try {
            const raw = storage.getItem(key(ownerId));
            if (raw) { draft = draftSchema.parse(JSON.parse(raw)); validatePhotos(draft.photos);
              if (draft.ownerId !== ownerId) throw new Error('Wrong owner'); }
          } catch { draft = null; restoreFailed = true; storageError = 'Could not restore your draft. Retry before creating a new one.'; }
        }
        set({ ownerId, draft, storageError, restoreFailed, savingId: null });
      },
      start(id, category, date, origin) {
        const { ownerId, draft, storageError } = get();
        if (!ownerId || draft || storageError) return;
        const sourceDate = reportingDateSchema.safeParse(date).success ? date : new Date().toISOString().slice(0, 10);
        changed({ id, ownerId, origin, sourceDate, values: initialValues(category, date), photos: [] }); persist();
      },
      update(id, values) {
        const draft = get().draft;
        if (draft?.id === id && !get().savingId && !draft.savedEntryId) {
          const ids = new Set(values.items.map(item => item.id));
          changed({ ...draft, values, nutritionItems: draft.nutritionItems?.filter(item => ids.has(item.id)) });
        }
      },
      addPhotos(ownerId, id, photos) {
        const draft = get().draft;
        if (get().ownerId !== ownerId || draft?.id !== id) throw new Error('Your draft changed. Please select the photos again.');
        if (get().savingId || draft.savedEntryId) throw new Error('Wait until saving finishes before changing attachments.');
        const next = [...draft.photos, ...photos]; validatePhotos(next); changed({ ...draft, photos: next }); persist();
      },
      removePhoto(id, photoId) {
        const draft = get().draft;
        if (draft?.id === id && !get().savingId && !draft.savedEntryId) { changed({ ...draft, photos: draft.photos.filter(p => p.id !== photoId) }); persist(); }
      },
      discard(id) {
        if (get().draft?.id !== id) return false;
        if (get().savingId) return false;
        const old = get().draft;
        if (!old) return false;
        set({ draft: null });
        if (persist()) return true;
        set({ draft: old }); cache.set(old.ownerId, old); return false;
      },
    };
  });
  return store;
}

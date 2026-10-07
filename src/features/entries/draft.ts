import type { Entry, FoodItem } from './schema';
import { entryFacts, initialValues, validatePhotos, type EntryFormValues } from '../upload/schema';
import type { UploadDraft } from '../upload/store/create-upload-store';
import { foodToForm } from '../nutrition/draft';

export function entryToForm(entry: Entry): EntryFormValues {
  const values = { ...initialValues(entry.category, entry.entryDate), title: entry.title, occurredAt: entry.occurredAt, note: entry.note ?? '' };
  const text = (value: number | null) => value === null ? '' : String(value);
  if (entry.category === 'nutrition') {
    values.mealCategory = entry.data.mealCategory;
    values.items = entry.data.items.map(foodToForm);
  }
  if (entry.category === 'exercise') Object.assign(values, { activityName: entry.data.activityName, durationMinutes: String(entry.data.durationMinutes),
    intensity: entry.data.intensity, estimatedCaloriesBurnedKcal: text(entry.data.estimatedCaloriesBurnedKcal), calorieEstimationSource: entry.data.calorieEstimationSource ?? '' });
  return values;
}
export function draftFacts(draft: UploadDraft) {
  const facts = entryFacts(draft.values);
  if ('items' in facts.data && facts.data.items) {
    const items: (Omit<FoodItem, 'id'> & { id?: string })[] = facts.data.items.map(item => {
      const original = draft.nutritionItems?.find(food => food.id === item.id) ?? draft.edit?.originalItems.find(food => food.id === item.id);
      const unchanged = original && (['name', 'quantity', 'unit', 'caloriesKcal', 'proteinG', 'carbohydratesG', 'fatG'] as const).every(key => item[key] === original[key]);
      // Keep reference provenance and estimated sources for untouched foods.
      return unchanged ? { ...original } : item;
    });
    return { ...facts, data: { ...facts.data, items } };
  }
  // The per-activity breakdown from a confirmed estimate travels with the exercise totals.
  if (facts.category === 'exercise' && draft.activities?.length) return { ...facts, data: { ...facts.data, activities: draft.activities } };
  return facts;
}
export function draftPayload(draft: UploadDraft) {
  validatePhotos(draft.photos);
  return { ...draftFacts(draft), attachments: draft.photos, ...(draft.edit ? { revision: draft.edit.revision } : {}) };
}

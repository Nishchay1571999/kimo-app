import { z } from 'zod';
import { reportingDateSchema } from '../home/schema/home-schema';

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const categorySchema = z.enum(['nutrition', 'exercise', 'note']);
export type EntryCategory = z.infer<typeof categorySchema>;
const foodSchema = z.object({
  id: z.string().optional(),
  name: z.string(), quantity: z.string(), unit: z.string(), caloriesKcal: z.string(),
  proteinG: z.string(), carbohydratesG: z.string(), fatG: z.string(),
});
// Raw values remain strings so incomplete input survives navigation and restarts.
export const formValuesSchema = z.object({
  category: categorySchema, title: z.string(), entryDate: z.string(), occurredAt: z.string(), note: z.string(),
  mealCategory: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']), items: z.array(foodSchema),
  activityName: z.string(), durationMinutes: z.string(), intensity: z.enum(['light', 'moderate', 'vigorous']),
  estimatedCaloriesBurnedKcal: z.string(), calorieEstimationSource: z.string(),
});
export type EntryFormValues = z.infer<typeof formValuesSchema>;
export const emptyFood = () => ({ name: '', quantity: '', unit: '', caloriesKcal: '', proteinG: '', carbohydratesG: '', fatG: '' });
export function initialValues(category: EntryCategory, date: string, now = new Date()): EntryFormValues {
  return { category, title: '', entryDate: date, occurredAt: now.toISOString(), note: '', mealCategory: 'other',
    items: [emptyFood()], activityName: '', durationMinutes: '', intensity: 'moderate',
    estimatedCaloriesBurnedKcal: '', calorieEstimationSource: '' };
}
export const entryFormSchema = formValuesSchema.superRefine((v, ctx) => {
  const error = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  const text = (value: string, path: (string | number)[], max = 10000) => {
    if (!value.trim() || value.trim().length > max) error(path, `Enter between 1 and ${max} characters`);
  };
  const number = (value: string, path: (string | number)[], positive = false, optional = false) => {
    if (optional && !value.trim()) return;
    if (!/^\d+(?:\.\d+)?$/.test(value.trim()) || !Number.isFinite(Number(value)) || (positive && Number(value) <= 0))
      error(path, positive ? 'Enter a number greater than zero' : 'Enter a nonnegative number');
  };
  text(v.title, ['title'], 100);
  if (!reportingDateSchema.safeParse(v.entryDate).success) error(['entryDate'], 'Use a valid date: YYYY-MM-DD');
  if (!z.iso.datetime({ offset: true }).safeParse(v.occurredAt).success) error(['occurredAt'], 'Use an ISO timestamp with Z or a timezone offset');
  if (v.note.trim().length > 10000) error(['note'], 'Use at most 10000 characters');
  // Every entry needs a note: for meals and workouts it is what Kimo reads to calculate calories.
  text(v.note, ['note']);
  if (v.category === 'nutrition') {
    if (v.items.length < 1 || v.items.length > 100) error(['items'], 'Add between 1 and 100 foods');
    v.items.forEach((item, i) => {
      text(item.name, ['items', i, 'name']); text(item.unit, ['items', i, 'unit'], 30);
      number(item.quantity, ['items', i, 'quantity'], true); number(item.caloriesKcal, ['items', i, 'caloriesKcal']);
      for (const key of ['proteinG', 'carbohydratesG', 'fatG'] as const) number(item[key], ['items', i, key], false, true);
    });
  }
  if (v.category === 'exercise') {
    text(v.activityName, ['activityName']); number(v.durationMinutes, ['durationMinutes'], true);
    number(v.estimatedCaloriesBurnedKcal, ['estimatedCaloriesBurnedKcal'], false, true);
    if (v.estimatedCaloriesBurnedKcal.trim()) text(v.calorieEstimationSource, ['calorieEstimationSource']);
  }
});
export const photoSchema = z.object({
  id: z.string().min(1), type: z.enum(['image', 'audio']), mimeType: z.string(), base64: z.string().min(1),
  fileSizeBytes: z.number().int().positive(), widthPx: z.number().positive().optional(), heightPx: z.number().positive().optional(), durationMs: z.number().positive().optional(),
}).refine(value => (value.type === 'image' ? ['image/jpeg', 'image/png', 'image/webp'] : ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm']).includes(value.mimeType), 'Unsupported attachment type');
export type DraftPhoto = z.infer<typeof photoSchema>;
export function validatePhotos(photos: DraftPhoto[]) {
  if (photos.length > MAX_PHOTOS) throw new Error('You can attach up to 10 photos.');
  if (photos.reduce((sum, p) => sum + p.fileSizeBytes, 0) > MAX_PHOTO_BYTES) throw new Error('Photos must total 20 MB or less.');
  if (new Set(photos.map(p => p.id)).size !== photos.length) throw new Error('This photo is already attached.');
  for (const photo of photos) {
    photoSchema.parse(photo);
    const bytes = decodedBytes(photo.base64);
    const signature = photo.mimeType === 'image/jpeg' ? photo.base64.startsWith('/9j/')
      : photo.mimeType === 'image/png' ? photo.base64.startsWith('iVBORw0KGgo')
      : photo.mimeType === 'image/webp' ? photo.base64.startsWith('UklGR') : true;
    if (bytes !== photo.fileSizeBytes || !signature) throw new Error('Could not read this photo. Choose another image.');
  }
}
export function decodedBytes(base64: string) {
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error('Could not read this photo.');
  return base64.length / 4 * 3 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
}
export function entryFacts(raw: EntryFormValues) {
  const v = entryFormSchema.parse(raw);
  const optional = (value: string) => value.trim() ? Number(value) : null;
  return { category: v.category, title: v.title.trim(), entryDate: v.entryDate, occurredAt: new Date(v.occurredAt).toISOString(),
    note: v.note.trim() || null,
    data: v.category === 'nutrition' ? { mealCategory: v.mealCategory, items: v.items.map(item => ({
      ...(item.id ? { id: item.id } : {}),
      name: item.name.trim(), quantity: Number(item.quantity), unit: item.unit.trim(), caloriesKcal: Number(item.caloriesKcal),
      proteinG: optional(item.proteinG), carbohydratesG: optional(item.carbohydratesG), fatG: optional(item.fatG),
      quantitySource: 'user_entered' as const, nutritionSource: 'user_entered' as const,
    })) } : v.category === 'exercise' ? { activityName: v.activityName.trim(), durationMinutes: Number(v.durationMinutes),
      intensity: v.intensity, estimatedCaloriesBurnedKcal: optional(v.estimatedCaloriesBurnedKcal),
      calorieEstimationSource: v.estimatedCaloriesBurnedKcal.trim() ? v.calorieEstimationSource.trim() : null } : {},
  };
}

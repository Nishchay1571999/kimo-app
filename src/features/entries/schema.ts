import { z } from 'zod';
import { reportingDateSchema } from '../home/schema/home-schema';
import { photoSchema } from '../upload/schema';
import { entryAnalysisSchema } from './analysis';

const macro = z.number().nonnegative().nullable();
export const foodItemSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), quantity: z.number().positive(), unit: z.string().min(1),
  caloriesKcal: z.number().nonnegative(), proteinG: macro, carbohydratesG: macro, fatG: macro,
  quantitySource: z.enum(['user_entered', 'estimated']), nutritionSource: z.enum(['user_entered', 'estimated', 'reference']),
  reference: z.object({ provider: z.string(), providerFoodId: z.string(), amount: z.number().positive(), unit: z.string() }).optional(),
}).superRefine((item, context) => {
  if (item.nutritionSource === 'reference' && !item.reference) context.addIssue({ code: 'custom', path: ['reference'], message: 'Reference nutrition requires its source' });
  if (item.nutritionSource !== 'reference' && item.reference) context.addIssue({ code: 'custom', path: ['reference'], message: 'Manual nutrition cannot contain a food reference' });
});
const common = {
  id: z.uuid(), title: z.string().min(1), entryDate: reportingDateSchema, occurredAt: z.iso.datetime({ offset: true }),
  recordedTimezone: z.string().refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }), inputSource: z.enum(['text', 'image', 'audio', 'mixed']), note: z.string().nullable(),
  attachments: z.array(photoSchema).max(10), revision: z.number().int().positive(),
  createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }),
  summary: z.object({ caloriesKcal: macro }),
  ai: entryAnalysisSchema,
};
export const entrySchema = z.discriminatedUnion('category', [
  z.object({ ...common, category: z.literal('nutrition'), data: z.object({ mealCategory: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']), items: z.array(foodItemSchema).min(1).max(100) }) }),
  z.object({ ...common, category: z.literal('exercise'), data: z.object({ activityName: z.string(), durationMinutes: z.number().positive(), intensity: z.enum(['light', 'moderate', 'vigorous']), estimatedCaloriesBurnedKcal: macro, calorieEstimationSource: z.string().nullable() }) }),
  z.object({ ...common, category: z.literal('note'), data: z.object({}) }),
]);
export type Entry = z.infer<typeof entrySchema>;
export type FoodItem = z.infer<typeof foodItemSchema>;

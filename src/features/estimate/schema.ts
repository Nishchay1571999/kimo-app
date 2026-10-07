import { z } from 'zod';
import { exerciseActivitySchema, foodItemSchema } from '../entries/schema';

export const nutritionEstimateSchema = z.object({
  category: z.literal('nutrition'),
  items: z.array(z.intersection(foodItemSchema, z.object({ matchedName: z.string(), amount: z.number().positive(), amountUnit: z.string() }))).min(1),
  unmatched: z.array(z.object({ name: z.string(), reason: z.string() })),
  totals: z.object({ caloriesKcal: z.number(), proteinG: z.number(), carbohydratesG: z.number(), fatG: z.number() }),
});
export const exerciseEstimateSchema = z.object({
  category: z.literal('exercise'),
  weightKg: z.number().positive(),
  activities: z.array(exerciseActivitySchema.extend({ metKey: z.string(), met: z.number().positive() })).min(1),
  totals: z.object({ durationMinutes: z.number(), caloriesBurnedKcal: z.number() }),
});
export const estimateSchema = z.discriminatedUnion('category', [nutritionEstimateSchema, exerciseEstimateSchema]);
export type Estimate = z.infer<typeof estimateSchema>;
export type NutritionEstimate = z.infer<typeof nutritionEstimateSchema>;
export type ExerciseEstimate = z.infer<typeof exerciseEstimateSchema>;
export type EstimateRequest = { category: 'nutrition' | 'exercise'; title: string; note: string; image: { mimeType: string; base64: string } };

const MESSAGES: Record<string, string> = {
  ESTIMATE_NO_FOOD_FOUND: "We couldn't find any food in your note. Describe what you ate, e.g. \"2 rotis, a bowl of dal and a coke\".",
  ESTIMATE_NO_MATCH: "We couldn't match the foods in your note to USDA or Open Food Facts. Try simpler food names.",
  ESTIMATE_NO_ACTIVITY_FOUND: "We couldn't find an activity and duration in your note. Try something like \"30 min brisk walk\".",
  ESTIMATE_WEIGHT_REQUIRED: 'Kimo needs your body weight to estimate calories burned. Log your weight, then try again.',
  ESTIMATE_AI_UNAVAILABLE: 'Kimo could not read your note right now. Please try again in a moment.',
};
/** Friendly text for estimate failures; falls back to the server's message. */
export function estimateErrorMessage(code: string | undefined, fallback: string) {
  return (code && MESSAGES[code]) ?? fallback;
}

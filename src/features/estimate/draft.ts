import type { EntryFormValues } from '../upload/schema';
import type { ExerciseEstimate, NutritionEstimate } from './schema';

const INTENSITY = ['light', 'moderate', 'vigorous'] as const;
const text = (value: number | null) => value === null ? '' : String(value);
/** Meals default to the time of day they were logged; edits keep their meal. */
function mealFor(occurredAt: string): EntryFormValues['mealCategory'] {
  const hour = new Date(occurredAt).getHours();
  return hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 19 ? 'snack' : 'dinner';
}
export function nutritionValues(values: EntryFormValues, result: NutritionEstimate, editing: boolean) {
  const nutritionItems = result.items.map(({ matchedName: _m, amount: _a, amountUnit: _u, ...item }) => item);
  return {
    values: { ...values, mealCategory: editing ? values.mealCategory : mealFor(values.occurredAt),
      items: nutritionItems.map(item => ({ id: item.id, name: item.name, quantity: String(item.quantity), unit: item.unit, caloriesKcal: String(item.caloriesKcal),
        proteinG: text(item.proteinG), carbohydratesG: text(item.carbohydratesG), fatG: text(item.fatG) })) },
    extras: { nutritionItems },
  };
}
export function exerciseValues(values: EntryFormValues, result: ExerciseEstimate) {
  const activities = result.activities.map(({ activityName, durationMinutes, intensity, met, caloriesBurnedKcal }) => ({ activityName, durationMinutes, intensity, met, caloriesBurnedKcal }));
  const intensity = INTENSITY[Math.max(...activities.map(a => INTENSITY.indexOf(a.intensity)))];
  return {
    values: { ...values, activityName: activities.map(a => a.activityName).join(' + ').slice(0, 200), durationMinutes: String(result.totals.durationMinutes),
      intensity, estimatedCaloriesBurnedKcal: String(result.totals.caloriesBurnedKcal), calorieEstimationSource: 'ai_met_estimate' },
    extras: { activities },
  };
}

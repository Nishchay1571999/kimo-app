import type { Home } from './schema/home-schema';

export function dailySummary(summary: Home['summary']) {
  return [
    { label: 'Calories consumed', value: `${summary.nutrition.caloriesConsumedKcal} kcal` },
    { label: 'Meal entries', value: String(summary.nutrition.entryCount) },
    { label: 'Exercise duration', value: `${summary.exercise.durationMinutes} min` },
    { label: 'Estimated calories burned', value: summary.exercise.caloriesBurnedKcal === null ? 'Unknown' : `${summary.exercise.caloriesBurnedKcal} kcal` },
  ];
}

const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { createUploadStore } = require('../src/features/upload/store/create-upload-store.ts');
const { entryFormSchema } = require('../src/features/upload/schema.ts');
const { draftPayload } = require('../src/features/entries/draft.ts');
const { estimateSchema, estimateErrorMessage } = require('../src/features/estimate/schema.ts');
const { nutritionValues, exerciseValues } = require('../src/features/estimate/draft.ts');
function memory() { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }; }
const photo = { id: 'p', type: 'image', mimeType: 'image/jpeg', base64: '/9j/AA==', fileSizeBytes: 4 };
const meal = estimateSchema.parse({
  category: 'nutrition',
  items: [
    { id: 'a', name: 'roti', quantity: 2, unit: 'piece', caloriesKcal: 240, proteinG: 8, carbohydratesG: 40, fatG: null, quantitySource: 'estimated', nutritionSource: 'reference',
      reference: { provider: 'usda-fdc', providerFoodId: '1', amount: 100, unit: 'g' }, matchedName: 'Chapati', amount: 80, amountUnit: 'g' },
    { id: 'b', name: 'coke', quantity: 1, unit: 'can', caloriesKcal: 138.6, proteinG: 0, carbohydratesG: 35, fatG: 0, quantitySource: 'estimated', nutritionSource: 'reference',
      reference: { provider: 'open-food-facts', providerFoodId: '5449000000996', amount: 100, unit: 'ml' }, matchedName: 'Coca-Cola', amount: 330, amountUnit: 'ml' },
  ],
  unmatched: [{ name: 'chutney', reason: 'Not found in USDA or Open Food Facts' }],
  totals: { caloriesKcal: 378.6, proteinG: 8, carbohydratesG: 75, fatG: 0 },
});
const workout = estimateSchema.parse({
  category: 'exercise', weightKg: 70,
  activities: [
    { activityName: 'Run', metKey: 'running_moderate', durationMinutes: 30, intensity: 'vigorous', met: 9.8, caloriesBurnedKcal: 343 },
    { activityName: 'Yoga', metKey: 'yoga', durationMinutes: 20, intensity: 'light', met: 2.5, caloriesBurnedKcal: 58.33 },
  ],
  totals: { durationMinutes: 50, caloriesBurnedKcal: 401.33 },
});
function draft(category) {
  const store = createUploadStore(memory()); store.getState().activate('owner');
  store.getState().start('d', category, '2026-10-07', 'home');
  store.getState().update('d', { ...store.getState().draft.values, title: 'Lunch', note: '2 rotis and a coke', occurredAt: '2026-10-07T07:30:00Z' });
  store.getState().addPhotos('owner', 'd', [photo]);
  return store;
}
// Confirmed meals keep database provenance through save, and unmatched foods are left out.
const meals = draft('nutrition');
const m = nutritionValues(meals.getState().draft.values, meal, false);
meals.getState().applyEstimate('d', m.values, m.extras);
assert.ok(entryFormSchema.safeParse(meals.getState().draft.values).success);
const mealPayload = draftPayload(meals.getState().draft);
assert.deepEqual(mealPayload.data.items.map(i => [i.name, i.nutritionSource, i.reference.provider, i.quantitySource]),
  [['roti', 'reference', 'usda-fdc', 'estimated'], ['coke', 'reference', 'open-food-facts', 'estimated']]);
assert.equal(mealPayload.data.items[0].fatG, null);
assert.equal(mealPayload.data.items.some(i => 'matchedName' in i), false);
assert.equal(mealPayload.note, '2 rotis and a coke'); assert.equal(mealPayload.attachments.length, 1);
// Re-estimating replaces the previous foods instead of appending.
meals.getState().applyEstimate('d', nutritionValues(meals.getState().draft.values, { ...meal, items: [meal.items[0]] }, false).values, { nutritionItems: [nutritionValues(meals.getState().draft.values, meal, false).extras.nutritionItems[0]] });
assert.equal(draftPayload(meals.getState().draft).data.items.length, 1);
// Workouts store totals plus a per-activity breakdown.
const workouts = draft('exercise');
const w = exerciseValues(workouts.getState().draft.values, workout);
workouts.getState().applyEstimate('d', w.values, w.extras);
const exercisePayload = draftPayload(workouts.getState().draft);
assert.deepEqual(exercisePayload.data, {
  activityName: 'Run + Yoga', durationMinutes: 50, intensity: 'vigorous', estimatedCaloriesBurnedKcal: 401.33, calorieEstimationSource: 'ai_met_estimate',
  activities: [
    { activityName: 'Run', durationMinutes: 30, intensity: 'vigorous', met: 9.8, caloriesBurnedKcal: 343 },
    { activityName: 'Yoga', durationMinutes: 20, intensity: 'light', met: 2.5, caloriesBurnedKcal: 58.33 },
  ],
});
// A draft that is saving cannot be overwritten by a late estimate.
workouts.getState().beginSave('d', 'k');
assert.throws(() => workouts.getState().applyEstimate('d', w.values, w.extras), /Calculate again/);
assert.match(estimateErrorMessage('ESTIMATE_NO_FOOD_FOUND', 'x'), /couldn't find any food/);
assert.equal(estimateErrorMessage('UNKNOWN', 'Server says no'), 'Server says no');
console.log('Estimate checks passed: meal provenance, unmatched exclusion, re-estimate replacement, exercise breakdown, save locking and error messages.');

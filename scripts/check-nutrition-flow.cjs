const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { QueryClient, QueryObserver, MutationObserver } = require('@tanstack/react-query');
const { AxiosError } = require('axios');
const { createApiClient } = require('../src/lib/api/client.ts');
const { createNutritionService } = require('../src/features/nutrition/service.ts');
const { foodSearchOptions, foodDetailOptions, searchKey, foodKey } = require('../src/features/nutrition/queries.ts');
const { portionSchema, unitsFor } = require('../src/features/nutrition/schema.ts');
const { createUploadStore } = require('../src/features/upload/store/create-upload-store.ts');
const { createEntryService } = require('../src/features/entries/services/entry-service.ts');
const { entryToForm, draftPayload } = require('../src/features/entries/draft.ts');
const { entryFormSchema } = require('../src/features/upload/schema.ts');
const guest = { id: 'guest-test', epoch: 1, token: 'guest-token' };
const member = { id: 'member-test', epoch: 2, token: 'member-token', email: 'test@email.com' };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { resolve, promise }; };
function memory() { const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; }
function food(provider = 'usda-fdc', id = '123', unit = 'g') {
  return { id: `${provider}:${id}`, provider, providerFoodId: id, name: unit === 'g' ? 'Cooked rice' : 'Milk', reference: { quantity: 100, unit },
    nutrition: { caloriesKcal: 130, proteinG: null, carbohydratesG: 28, fatG: 0 } };
}
async function main() {
  let owner = guest, failure = 0, hold, mismatch = false, malformed = false, missingCalories = false;
  const requests = []; const catalog = { 'usda-fdc': food(), 'open-food-facts': food('open-food-facts', '001234567890', 'ml') };
  const api = createApiClient('https://example.test', { getIdentity: () => owner, unauthorized: () => {}, onboardingRequired: () => {} }, async config => {
    const url = new URL(config.url, 'https://example.test'); const body = config.data ? JSON.parse(config.data) : undefined;
    requests.push({ method: config.method, url, body, authorization: config.headers.Authorization });
    if (hold) await hold.promise;
    let status = failure || 200, data;
    const provider = body?.provider ?? url.searchParams.get('provider') ?? 'usda-fdc';
    const value = structuredClone(catalog[provider]); if (missingCalories) value.nutrition.caloriesKcal = null;
    if (failure) data = { message: failure === 422 ? 'Food has no calorie reference; enter confirmed nutrition manually' : 'Provider unavailable' };
    else if (url.pathname.endsWith('/search')) data = { foods: [value], page: Number(url.searchParams.get('page')), totalPages: 3, totalHits: 45 };
    else if (url.pathname.includes('/foods/')) data = value;
    else if (url.pathname.endsWith('/calculate')) {
      const base = body.quantity * (body.unit === 'kg' || body.unit === 'l' ? 1000 : body.unit === 'oz' ? 28.349523125 : 1);
      const ratio = base / value.reference.quantity;
      const scale = v => v === null ? null : Math.round(v * ratio * 100) / 100;
      data = { id: `calculated-${requests.length}`, name: value.name, quantity: body.quantity, unit: body.unit, quantitySource: 'user_entered', nutritionSource: 'reference',
        ...Object.fromEntries(Object.entries(value.nutrition).map(([key, v]) => [key, scale(v)])),
        reference: { provider, providerFoodId: value.providerFoodId, amount: value.reference.quantity, unit: value.reference.unit } };
    } else if (url.pathname === '/v1/entries') data = { ...body, id: '1e49a1fd-43c0-4b32-a478-70138847c4ab', revision: 1, recordedTimezone: 'Asia/Kolkata', inputSource: 'text',
      summary: { caloriesKcal: body.data.items.reduce((sum, item) => sum + item.caloriesKcal, 0) }, ai: { status: 'pending', synopsis: null },
      createdAt: '2026-10-06T12:00:00Z', updatedAt: '2026-10-06T12:00:00Z' };
    if (malformed) data = {};
    if (mismatch) {
      if (url.pathname.endsWith('/search')) data.page += 1;
      else if (url.pathname.includes('/foods/')) data.providerFoodId = '987';
      else if (url.pathname.endsWith('/calculate')) data.quantity += 1;
    }
    const result = { config, status, data, statusText: '', headers: {} };
    if (status >= 400) throw new AxiosError('Failed', 'ERR_BAD_REQUEST', config, undefined, result);
    return result;
  });
  const service = createNutritionService(api, () => owner);
  const entries = createEntryService(api, () => owner);
  const storage = memory(); const drafts = createUploadStore(storage);
  drafts.getState().activate(guest.id); drafts.getState().start('meal', 'nutrition', '2026-10-06', 'day');
  drafts.getState().update('meal', { ...drafts.getState().draft.values, note: 'Rice and milk for lunch' });
  drafts.getState().update('meal', { ...drafts.getState().draft.values, title: 'Lunch' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false, gcTime: 0 } } });
  const calculate = new MutationObserver(client, { mutationFn: input => service.calculate(input, owner) });
  const search = { provider: 'usda-fdc', q: 'rice & beans', page: 1 };
  const selection = { provider: 'usda-fdc', providerFoodId: '123' };
  try {
    const result = await client.fetchQuery(foodSearchOptions(service, guest, search));
    assert.equal(result.foods[0].providerFoodId, '123'); assert.equal(requests.at(-1).url.searchParams.get('q'), 'rice & beans');
    assert.equal(requests.at(-1).authorization, 'Bearer guest-token');
    const count = requests.length; await client.fetchQuery(foodSearchOptions(service, guest, search)); assert.equal(requests.length, count, 'Cache avoids needless provider calls');
    const details = await client.fetchQuery(foodDetailOptions(service, guest, selection));
    assert.equal(details.nutrition.proteinG, null); assert.equal(details.nutrition.fatG, 0);
    const observer = new QueryObserver(client, foodSearchOptions(service, guest, search));
    observer.setOptions({ ...foodSearchOptions(service, guest, { ...search, page: 2 }), enabled: false });
    assert.equal(observer.getCurrentResult().data, undefined, 'A new page must not show the preceding page as current'); observer.destroy();
    assert.equal(client.getQueryData(searchKey(member, search)), undefined);
    assert.equal(client.getQueryData(foodKey(guest, { ...selection, provider: 'open-food-facts' })), undefined);
    await client.fetchQuery(foodSearchOptions(service, guest, { ...search, page: 2 })); assert.equal(requests.at(-1).url.searchParams.get('page'), '2');
    assert.deepEqual(unitsFor('g'), ['g', 'kg', 'oz']); assert.deepEqual(unitsFor('ml'), ['ml', 'l']);
    for (const quantity of ['', '0', '-1', 'Infinity', '1e10', '1..2']) assert.equal(portionSchema.safeParse({ quantity, unit: 'g' }).success, false);
    const portion = await calculate.mutate({ ...selection, quantity: 150, unit: 'g' });
    assert.equal(portion.caloriesKcal, 195); assert.equal(portion.proteinG, null); assert.equal(portion.fatG, 0);
    let values = drafts.getState().addNutritionFood(guest.id, 'meal', portion);
    assert.equal(values.items.length, 1, 'Replace the untouched blank placeholder'); assert.equal(values.items[0].proteinG, '');
    assert.ok(entryFormSchema.safeParse(values).success);
    const restarted = createUploadStore(storage); restarted.getState().activate(guest.id);
    let payload = draftPayload(restarted.getState().draft);
    assert.equal(payload.data.items[0].nutritionSource, 'reference'); assert.equal(payload.data.items[0].reference.providerFoodId, '123'); assert.equal(payload.data.items[0].proteinG, null);
    const saved = await entries.save(restarted.getState().draft, guest);
    assert.equal(saved.data.items[0].reference.provider, 'usda-fdc');
    assert.equal(requests.at(-1).body.data.items[0].reference.providerFoodId, '123', 'Entry POST preserves calculated provenance');
    // Ordinary manual changes switch the item to confirmed manual values.
    const expectedTarget = structuredClone(values.items[0]);
    const manual = structuredClone(values); manual.items[0].caloriesKcal = '200'; drafts.getState().update('meal', manual);
    assert.throws(() => drafts.getState().addNutritionFood(guest.id, 'meal', portion, portion.id, expectedTarget), /changed while calculating/);
    assert.equal(drafts.getState().draft.values.items[0].caloriesKcal, '200', 'Late calculations must not overwrite new manual edits');
    payload = draftPayload(drafts.getState().draft);
    assert.equal(payload.data.items[0].nutritionSource, 'user_entered'); assert.equal(payload.data.items[0].reference, undefined);
    const smaller = await calculate.mutate({ ...selection, quantity: 75, unit: 'g' });
    values = drafts.getState().addNutritionFood(guest.id, 'meal', smaller, portion.id);
    assert.equal(values.items.length, 1); assert.equal(values.items[0].id, portion.id); assert.equal(values.items[0].caloriesKcal, '97.5');
    assert.equal(draftPayload(drafts.getState().draft).data.items[0].nutritionSource, 'reference');
    assert.throws(() => drafts.getState().addNutritionFood(guest.id, 'meal', smaller, 'removed-item'), /removed/);
    const liquidSelection = { provider: 'open-food-facts', providerFoodId: '001234567890' };
    const liquid = await client.fetchQuery(foodDetailOptions(service, guest, liquidSelection)); assert.equal(liquid.reference.unit, 'ml');
    const milk = await calculate.mutate({ ...liquidSelection, quantity: 0.25, unit: 'l' });
    assert.equal(milk.caloriesKcal, 325); assert.equal(milk.reference.providerFoodId, '001234567890');
    drafts.getState().addNutritionFood(guest.id, 'meal', milk);
    assert.equal(drafts.getState().draft.values.items.length, 2);
    // Edit recalculation overrides the old reference snapshot while retaining the food's ID.
    const editStorage = memory(); const edits = createUploadStore(editStorage); edits.getState().activate(guest.id);
    edits.getState().beginEdit('edit', { entryId: saved.id, revision: saved.revision, originalDate: saved.entryDate, originalItems: saved.data.items }, entryToForm(saved), [], 'day');
    edits.getState().addNutritionFood(guest.id, 'edit', smaller, saved.data.items[0].id);
    assert.equal(draftPayload(edits.getState().draft).data.items[0].caloriesKcal, 97.5);
    assert.equal(draftPayload(edits.getState().draft).data.items[0].id, saved.data.items[0].id); edits.getState().flush();
    // Null calories are shown as unknown; no invented zero reaches a meal.
    missingCalories = true; const unknown = await service.food(selection, guest); assert.equal(unknown.nutrition.caloriesKcal, null); missingCalories = false;
    const unchanged = structuredClone(drafts.getState().draft);
    for (const status of [400, 422, 503]) { failure = status; await assert.rejects(calculate.mutate({ ...selection, quantity: 150, unit: 'g' }), error => error.status === status); assert.deepEqual(drafts.getState().draft, unchanged); }
    failure = 0;
    mismatch = true;
    await assert.rejects(service.search(search, guest), error => error.code === 'INVALID_NUTRITION_RESPONSE');
    await assert.rejects(service.food(selection, guest), error => error.code === 'INVALID_NUTRITION_RESPONSE');
    await assert.rejects(service.calculate({ ...selection, quantity: 1, unit: 'g' }, guest), error => error.code === 'INVALID_NUTRITION_RESPONSE'); mismatch = false;
    malformed = true; await assert.rejects(service.search(search, guest), error => error.code === 'INVALID_NUTRITION_RESPONSE'); malformed = false;
    const beforeInvalid = requests.length;
    await assert.rejects(service.food({ provider: 'open-food-facts', providerFoodId: 'bad-barcode' }, guest));
    await assert.rejects(service.search({ ...search, q: ' ' }, guest));
    await assert.rejects(service.search({ ...search, page: 0 }, guest));
    await assert.rejects(service.calculate({ ...selection, quantity: 0, unit: 'g' }, guest));
    await assert.rejects(service.calculate({ ...selection, quantity: 1, unit: 'cup' }, guest));
    assert.equal(requests.length, beforeInvalid);
    await assert.rejects(service.search(search, guest, AbortSignal.abort()), error => error.code === 'ERR_CANCELED');
    // Token binding prevents old-account payloads from being sent under a new account.
    const preSendCount = requests.length; const preSend = service.calculate({ ...selection, quantity: 1, unit: 'g' }, guest); owner = member;
    await assert.rejects(preSend, error => error.code === 'SESSION_CHANGED'); assert.equal(requests.length, preSendCount);
    await assert.rejects(service.search(search, guest), error => error.code === 'SESSION_CHANGED');
    owner = guest; hold = deferred(); const stale = service.calculate({ ...selection, quantity: 1, unit: 'g' }, guest);
    const rejected = assert.rejects(stale, error => error.code === 'SESSION_CHANGED');
    await Promise.resolve(); await Promise.resolve(); owner = member; drafts.getState().activate(member.id);
    hold.resolve(); hold = undefined; await rejected;
    assert.equal(drafts.getState().draft, null);
    assert.throws(() => drafts.getState().addNutritionFood(guest.id, 'meal', smaller), /draft changed/);
    owner = guest; drafts.getState().activate(guest.id);
    drafts.getState().beginSave('meal', 'saving'); assert.throws(() => drafts.getState().addNutritionFood(guest.id, 'meal', smaller), /draft changed/); drafts.getState().endSave('saving');
    const removed = { ...drafts.getState().draft.values, items: [drafts.getState().draft.values.items[0]] }; drafts.getState().update('meal', removed);
    assert.equal(drafts.getState().draft.nutritionItems.length, 1, 'Removed foods lose unused reference metadata');
  } finally { drafts.getState().flush(); client.clear(); }
  console.log('Nutrition checks passed: bearer search/detail/calculation, both providers, pagination/cache isolation, units, null nutrients, draft/restart/save provenance, manual overrides, recalculation, validation/errors, cancellation and session/draft races.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { QueryClient, QueryObserver } = require('@tanstack/react-query');
const { AxiosError } = require('axios');
const { createApiClient } = require('../src/lib/api/client.ts');
const { createHomeService } = require('../src/features/home/services/home-service.ts');
const { createEntryService } = require('../src/features/entries/services/entry-service.ts');
const { homeQueryOptions, homeHasPendingAnalysis, homeKey } = require('../src/features/home/queries.ts');
const { entryQueryOptions, entryKey, refreshEntryCaches } = require('../src/features/entries/queries.ts');
const { dailySummary } = require('../src/features/home/daily-summary.ts');
const { toTimeline } = require('../src/features/home/home-view.ts');
const { entryAnalysisSchema, analysisView, analysisPending, analysisPollInterval } = require('../src/features/entries/analysis.ts');
const date = '2026-10-06';
const id = '622f44f3-000e-42ce-82c4-c1a832e159ff';
const member = { id: 'member-account', epoch: 1, token: 'member-token', timezone: 'Asia/Kolkata', email: 'test@email.com' };
function entry(ai, revision = 1) {
  return { id, category: 'nutrition', title: 'Lunch', entryDate: date, occurredAt: '2026-10-06T10:00:00Z',
    recordedTimezone: member.timezone, inputSource: 'text', note: 'My confirmed meal', attachments: [],
    data: { mealCategory: 'lunch', items: [{ id: 'food-1', name: 'Rice', quantity: 150, unit: 'g',
      caloriesKcal: 195, proteinG: null, carbohydratesG: 42, fatG: 0, quantitySource: 'user_entered', nutritionSource: 'user_entered' }] },
    summary: { caloriesKcal: 195 }, ai, revision, createdAt: '2026-10-06T10:00:00Z', updatedAt: '2026-10-06T10:00:00Z' };
}
function home(saved) {
  return { date, timezone: member.timezone, day: { label: 'Today', weekday: 'Tuesday', previous: '2026-10-05', next: '2026-10-07', isToday: true },
    schedule: { wakeTime: null, sleepTime: null, crossesMidnight: false },
    summary: { nutrition: { caloriesConsumedKcal: 195, entryCount: 1 }, exercise: { durationMinutes: 30, caloriesBurnedKcal: null } },
    timeline: [{ type: 'entry', date, time: '15:30', outsideSchedule: false, entry: saved }] };
}
async function main() {
  for (const status of ['not_requested', 'pending', 'processing', 'completed', 'failed']) {
    const ai = entryAnalysisSchema.parse({ status, synopsis: 'Old synopsis must be hidden unless completed', errorCode: 'PROVIDER_ERROR' });
    const view = analysisView(ai);
    assert.equal(analysisPending(ai), ['pending', 'processing'].includes(status));
    assert.equal(view.text.includes(ai.synopsis), status === 'completed');
    assert.ok(!view.text.includes(ai.errorCode), 'Do not display provider/internal error codes');
  }
  assert.equal(analysisView({ status: 'completed', synopsis: null }).text, 'Analysis finished without a summary.');
  assert.equal(analysisView({ status: 'completed', synopsis: '  ' }).text, 'Analysis finished without a summary.');
  assert.equal(entryAnalysisSchema.safeParse({ status: 'unknown', synopsis: null }).success, false);
  assert.equal(entryAnalysisSchema.safeParse({ status: 'completed', synopsis: 10 }).success, false);
  const since = 1000;
  assert.equal(analysisPollInterval(true, false, since, since + 119999), 5000);
  assert.equal(analysisPollInterval(true, false, since, since + 120000), false);
  assert.equal(analysisPollInterval(true, false, null, since), false, 'Hidden/background screens do not poll');
  assert.equal(analysisPollInterval(true, true, since, since), false, 'Read failures stop polling');
  assert.equal(analysisPollInterval(false, false, since, since), false);

  const summary = home(entry({ status: 'pending', synopsis: null })).summary;
  assert.deepEqual(dailySummary(summary).map(metric => metric.value), ['195 kcal', '1', '30 min', 'Unknown']);
  summary.exercise.caloriesBurnedKcal = 0;
  assert.equal(dailySummary(summary)[3].value, '0 kcal', 'Known zero remains zero');
  summary.nutrition = { caloriesConsumedKcal: 0, entryCount: 0 }; summary.exercise.durationMinutes = 0;
  assert.deepEqual(dailySummary(summary).map(metric => metric.value), ['0 kcal', '0', '0 min', '0 kcal']);

  let owner = member, serverEntry = entry({ status: 'pending', synopsis: null }), failure = 0;
  const requests = [];
  const api = createApiClient('https://example.test', { getIdentity: () => owner, unauthorized: () => {}, onboardingRequired: () => {} }, async config => {
    requests.push({ method: config.method, url: config.url, token: config.headers.Authorization });
    const data = failure ? { message: 'Read unavailable' } : config.url.startsWith('/v1/home') ? home(serverEntry) : serverEntry;
    const response = { config, status: failure || 200, data, headers: {}, statusText: '' };
    if (failure) throw new AxiosError('Failed', 'ERR_BAD_REQUEST', config, undefined, response);
    return response;
  });
  const homes = createHomeService(api), entries = createEntryService(api, () => owner);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  try {
    const active = Date.now();
    const homeOptions = homeQueryOptions(homes, member, date, active);
    const entryOptions = entryQueryOptions(entries, member, id, active);
    const read = async () => {
      await Promise.all([client.fetchQuery({ ...homeOptions, staleTime: 0 }), client.fetchQuery({ ...entryOptions, staleTime: 0 })]);
      return client.getQueryData(homeKey(member, date));
    };
    const interval = (options, data, status = 'success') => options.refetchInterval({ state: { data, status } });
    let loaded = await read();
    assert.equal(homeHasPendingAnalysis(loaded), true);
    assert.equal(interval(homeOptions, loaded), 5000);
    assert.equal(interval(entryOptions, serverEntry), 5000);
    serverEntry = entry({ status: 'processing', synopsis: null }); loaded = await read();
    assert.equal(toTimeline(loaded)[0].entry.ai.status, 'processing');
    serverEntry = entry({ status: 'completed', synopsis: 'AI describes a meal with 999 kcal.' }); loaded = await read();
    assert.equal(interval(homeOptions, loaded), false);
    assert.equal(interval(entryOptions, serverEntry), false);
    assert.equal(toTimeline(loaded)[0].entry.description, 'My confirmed meal');
    assert.equal(toTimeline(loaded)[0].entry.ai.synopsis, serverEntry.ai.synopsis);
    assert.equal(loaded.summary.nutrition.caloriesConsumedKcal, 195, 'AI text cannot replace server totals');
    assert.equal(client.getQueryData(entryKey(member, id)).data.items[0].caloriesKcal, 195);
    serverEntry = entry({ status: 'failed', synopsis: null, errorCode: 'PROVIDER_UNAVAILABLE' }); loaded = await read();
    assert.equal(interval(homeOptions, loaded), false);
    assert.equal(interval(entryOptions, serverEntry), false);
    serverEntry = entry({ status: 'pending', synopsis: null }, 3);
    await refreshEntryCaches(client, member, id, serverEntry, () => entries.isCurrent(member));
    assert.equal(client.getQueryData(entryKey(member, id)).ai.synopsis, null, 'Edits discard the previous AI summary');
    assert.equal(interval(entryOptions, serverEntry), 5000);
    loaded = await read();
    failure = 503;
    await assert.rejects(client.fetchQuery({ ...entryOptions, staleTime: 0 }), error => error.status === 503);
    assert.equal(interval(entryOptions, serverEntry, 'error'), false);
    assert.equal(client.getQueryData(entryKey(member, id)).revision, 3, 'Read failures preserve last loaded facts');
    failure = 0; serverEntry = entry({ status: 'completed', synopsis: 'Ready after a manual refresh.' }, 3); await read();
    assert.equal(client.getQueryData(entryKey(member, id)).ai.status, 'completed');
    const other = { ...member, id: 'other-account', epoch: 2 };
    assert.equal(client.getQueryData(homeKey(other, date)), undefined);
    assert.equal(client.getQueryData(entryKey(other, id)), undefined);
    const observer = new QueryObserver(client, entryOptions);
    observer.setOptions({ ...entryQueryOptions(entries, other, id, active), enabled: false });
    assert.equal(observer.getCurrentResult().data, undefined); observer.destroy();
    owner = other;
    await assert.rejects(entries.get(id, undefined, member), error => error.code === 'SESSION_CHANGED');
    assert.ok(requests.every(request => request.method === 'get'), 'Checking analysis never starts generation or saves an entry');
    assert.ok(requests.every(request => request.token === 'Bearer member-token'));
  } finally { client.clear(); }
  console.log('Summary checks passed: server totals/unknown/zero, AI states, bounded polling, read failures/manual refresh, edit resets, facts preservation and account isolation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

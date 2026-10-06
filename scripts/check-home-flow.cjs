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
const { createHomeService } = require('../src/features/home/services/home-service.ts');
const { homeQueryOptions, homeKey } = require('../src/features/home/queries.ts');
const { homeSchema } = require('../src/features/home/schema/home-schema.ts');
const { toTimeline } = require('../src/features/home/home-view.ts');
const { shiftDate, todayInTimezone, weekDates, formatTime } = require('../src/features/home/calendar.ts');
const { createRemoteOnboardingService } = require('../src/features/onboarding/services/remote-onboarding-service.ts');
const { createSessionStore } = require('../src/features/auth/store/create-session-store.ts');
const { createOnboardingStore } = require('../src/features/onboarding/store/create-onboarding-store.ts');
const { createOnboardingTransport } = require('../src/features/onboarding/services/onboarding-service.ts');
const guest = { id: 'c115c629-d911-42aa-8e51-4a7d6db658ed', name: null, email: null, accountStatus: 'guest',
  timezone: 'Asia/Kolkata', onboardingCompleted: false, token: 'test-guest-token', tokenType: 'Bearer' };
const goal = { age: 28, gender: 'unspecified', feet: '5', inches: '0', weight: '72.5', intention: 'maintain' };
const lifestyle = { healthyEating: 'most-of-the-time', exerciseFrequency: 'once-or-twice', wakeTime: '07:00', sleepTime: '00:30' };
const reportingDate = '2026-10-06';
function home(date = reportingDate) {
  return { date, timezone: 'Asia/Kolkata', day: { label: 'Today', weekday: 'Tuesday', previous: shiftDate(date, -1), next: shiftDate(date, 1), isToday: date === reportingDate },
    schedule: { wakeTime: '07:00', sleepTime: '00:30', crossesMidnight: true },
    summary: { nutrition: { caloriesConsumedKcal: 0, entryCount: 0 }, exercise: { durationMinutes: 0, caloriesBurnedKcal: null } },
    timeline: [ { type: 'boundary', boundary: 'wake', date, time: '07:00' },
      { type: 'boundary', boundary: 'sleep', date: shiftDate(date, 1), time: '00:30' } ] };
}
function memory() { const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; }
async function main() {
  assert.equal(todayInTimezone('Asia/Kolkata', new Date('2026-10-06T20:00:00Z')), '2026-10-07');
  assert.equal(todayInTimezone('America/Los_Angeles', new Date('2026-10-06T00:00:00Z')), '2026-10-05');
  assert.equal(shiftDate('2026-03-08', 1), '2026-03-09');
  assert.equal(shiftDate('2024-02-28', 1), '2024-02-29');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.deepEqual(weekDates('2026-10-04'), ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  assert.equal(formatTime('00:30'), '12:30 AM'); assert.equal(formatTime('12:00'), '12:00 PM');

  const storage = memory(); const session = createSessionStore(storage);
  await session.getState().hydrate(); await session.getState().accept(guest);
  const drafts = createOnboardingStore(memory(), createOnboardingTransport()); await drafts.persist.rehydrate();
  drafts.getState().setGoal(goal); assert.ok(drafts.getState().saveGoal()); drafts.getState().setLifestyle(lifestyle);
  let serverCompleted = false, failSave = true, malformed = false, wrongDate = false;
  let afterOnboarding;
  const requests = [];
  const api = createApiClient('https://example.test', {
    getIdentity: () => session.getState(), unauthorized: () => {}, onboardingRequired: () => session.getState().requireOnboarding(),
  }, async config => {
    requests.push({ url: config.url, authorization: config.headers.Authorization, body: config.data ? JSON.parse(config.data) : undefined });
    let status = 200, data;
    if (config.url === '/v1/accounts/onboarding') {
      if (failSave) { status = 503; data = { message: 'Upstream unavailable' }; }
      else { serverCompleted = true; data = { ...guest, onboardingCompleted: true }; afterOnboarding?.(); }
    } else if (!serverCompleted) { status = 403; data = { message: 'Complete onboarding first' }; }
    else {
      const date = new URL(config.url, 'https://example.test').searchParams.get('date');
      data = malformed ? { date } : home(wrongDate ? shiftDate(date, 1) : date);
    }
    const response = { config, status, data, headers: {}, statusText: '' };
    if (status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response);
    return response;
  });
  const remote = createRemoteOnboardingService(api, () => session.getState());
  const homes = createHomeService(api);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false, gcTime: 0 } } });
  try {
    await assert.rejects(homes.get(reportingDate), error => error.status === 403);
    const mutation = new MutationObserver(client, { mutationFn: remote.submit });
    let completed;
    const submit = async payload => { completed = await mutation.mutate(payload); return 'remote'; };
    assert.equal(await drafts.getState().submitLifestyle(submit), false);
    assert.equal(session.getState().account.onboardingCompleted, false);
    assert.equal(drafts.getState().lifestyle.sleepTime, '00:30', 'Retain guest answers on failure');
    failSave = false;
    assert.equal(await drafts.getState().submitLifestyle(submit), true);
    assert.equal(completed.accountStatus, 'guest');
    session.getState().confirm(guest.token, completed);
    assert.equal(session.getState().token, guest.token);
    assert.equal(requests.at(-1).body.exerciseFrequency, 'once_or_twice');
    assert.equal(requests.at(-1).authorization, `Bearer ${guest.token}`);
    const identity = { id: guest.id, epoch: session.getState().epoch, timezone: guest.timezone };
    const result = await client.fetchQuery(homeQueryOptions(homes, identity, reportingDate));
    assert.equal(result.date, reportingDate);
    assert.equal(result.summary.exercise.caloriesBurnedKcal, null);
    assert.equal(toTimeline(result)[1].eventDate, 'Wed, Oct 7');
    assert.equal(result.timeline.filter(item => item.type === 'entry').length, 0, 'An empty day has only real schedule boundaries');

    const withEntries = home();
    const entry = { id: '6a3e6c0d-e513-4a53-98ea-d7ddc0c16f3b', title: 'Breakfast', category: 'nutrition', note: null,
      entryDate: reportingDate, occurredAt: '2026-10-05T23:30:00Z', ai: { status: 'pending', synopsis: null }, attachments: [{ type: 'image', mimeType: 'image/png', base64: 'aW1hZ2U=' }] };
    withEntries.timeline.unshift({ type: 'entry', date: reportingDate, time: '05:00', outsideSchedule: true, entry });
    withEntries.timeline.push({ type: 'entry', date: '2026-10-07', time: '02:00', outsideSchedule: true,
      entry: { ...entry, id: 'eff549b3-c38b-4c25-9f46-b3dd5f490a79', category: 'note', attachments: [{ type: 'audio', mimeType: 'audio/wav', base64: 'YXVkaW8=', durationMs: 24000 }] } });
    const mapped = toTimeline(homeSchema.parse(withEntries));
    assert.deepEqual(mapped.map(item => item.kind), ['entry', 'boundary', 'boundary', 'entry']);
    assert.equal(mapped[0].entry.outsideSchedule, true);
    assert.equal(mapped[0].entry.image, 'data:image/png;base64,aW1hZ2U=');
    assert.equal(mapped[3].entry.eventDate, 'Wed, Oct 7'); assert.equal(mapped[3].entry.duration, '0:24');
    const noSchedule = home(); noSchedule.schedule = { wakeTime: null, sleepTime: null, crossesMidnight: false }; noSchedule.timeline = [];
    assert.equal(toTimeline(homeSchema.parse(noSchedule)).length, 0);

    const observer = new QueryObserver(client, homeQueryOptions(homes, identity, reportingDate));
    assert.equal(observer.getCurrentResult().data.date, reportingDate);
    observer.setOptions({ ...homeQueryOptions(homes, identity, '2026-10-05'), enabled: false });
    assert.equal(observer.getCurrentResult().data, undefined, 'Changing dates must not show the preceding day as current'); observer.destroy();
    assert.equal(client.getQueryData(homeKey({ ...identity, id: 'different-account' }, reportingDate)), undefined);
    assert.equal(client.getQueryData(homeKey({ ...identity, epoch: identity.epoch + 1 }, reportingDate)), undefined);
    assert.equal(client.getQueryData(homeKey({ ...identity, timezone: 'UTC' }, reportingDate)), undefined);
    let requestCount = requests.length;
    await assert.rejects(homes.get('2026-02-30')); assert.equal(requests.length, requestCount);
    malformed = true; await assert.rejects(homes.get(reportingDate), error => error.code === 'INVALID_HOME_RESPONSE'); malformed = false;
    wrongDate = true; await assert.rejects(homes.get(reportingDate), error => error.code === 'INVALID_HOME_RESPONSE'); wrongDate = false;
    await assert.rejects(homes.get(reportingDate, AbortSignal.abort()), error => error.code === 'ERR_CANCELED');
    requestCount = requests.length; await assert.rejects(homes.get(reportingDate, AbortSignal.abort())); assert.equal(requests.length, requestCount);
    afterOnboarding = () => { void session.getState().clear(); };
    await assert.rejects(remote.submit({ goal, lifestyle }), error => error.code === 'SESSION_CHANGED');
    assert.equal(session.getState().account, null);
  } finally { client.clear(); }
  console.log('Home checks passed: guest onboarding/retry, bearer ownership, timezone/DST dates, timeline order/media, null schedules, cache isolation, validation and cancellation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

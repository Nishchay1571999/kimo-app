const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Exercise the actual store without loading native Expo modules in Node.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { createOnboardingStore } = require('../src/features/onboarding/store/create-onboarding-store.ts');
const { onboardingDestination } = require('../src/features/onboarding/store/onboarding-destination.ts');
const { createOnboardingTransport } = require('../src/features/onboarding/services/onboarding-service.ts');

const goal = { age: 28, gender: 'unspecified', feet: '5', inches: '', weight: '72.5', intention: 'maintain' };
const lifestyle = { healthyEating: 'most-of-the-time', exerciseFrequency: 'once-or-twice' };
function memoryStorage() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}
async function ready(storage, transport = createOnboardingTransport()) {
  const store = createOnboardingStore(storage, transport);
  await store.persist.rehydrate();
  return store;
}
async function main() {
  const disk = memoryStorage();
  let posts = 0;
  let release;
  const store = await ready(disk, () => { posts++; return new Promise((resolve) => { release = resolve; }); });
  assert.equal(onboardingDestination(store.getState()), '/(auth)/welcome');
  assert.equal(store.getState().complete(), false);
  assert.equal(store.getState().saveGoal(), false);
  assert.ok(store.getState().goalErrors.feet);
  store.getState().setGoal({ ...goal, feet: '' });
  assert.equal(onboardingDestination(store.getState()), '/(onboarding)/goal');
  store.getState().setGoal(goal);
  assert.equal(store.getState().saveGoal(), true);
  assert.equal(store.getState().goal.inches, '00');
  assert.equal(onboardingDestination(store.getState()), '/(onboarding)/lifestyle');
  assert.equal(await store.getState().submitLifestyle(), false);
  assert.equal(posts, 0);
  assert.ok(store.getState().lifestyleErrors.healthyEating);
  store.getState().setLifestyle(lifestyle);
  const pending = store.getState().submitLifestyle();
  assert.equal(await store.getState().submitLifestyle(), false);
  assert.equal(posts, 1);
  store.getState().setGoal({ ...goal, age: 72 });
  assert.equal(store.getState().goal.age, 28);
  release('remote');
  assert.equal(await pending, true);
  assert.equal(store.getState().step, 'target');
  assert.equal(onboardingDestination(store.getState()), '/(onboarding)/target');
  const saved = JSON.parse(disk.data.get('kimo-onboarding')).state;
  assert.deepEqual(Object.keys(saved).sort(), ['accessMode', 'completed', 'goal', 'hasStarted', 'lifestyle', 'step', 'syncMode']);
  const restored = await ready(disk);
  assert.deepEqual(restored.getState().goal, { ...goal, inches: '00' });
  assert.deepEqual(restored.getState().lifestyle, lifestyle);
  assert.equal(restored.getState().submitting, false);
  assert.deepEqual(restored.getState().goalErrors, {});

  const failingPost = await ready(disk, async () => { throw new Error('offline'); });
  assert.equal(await failingPost.getState().submitLifestyle(), false);
  assert.ok(failingPost.getState().submitError);
  assert.deepEqual(failingPost.getState().lifestyle, lifestyle);
  const retry = await ready(disk);
  assert.equal(await retry.getState().submitLifestyle(), true);
  assert.equal(retry.getState().syncMode, 'local');

  let read;
  const delayed = createOnboardingStore({ ...disk, getItem: () => new Promise((resolve) => { read = resolve; }) }, createOnboardingTransport());
  const hydration = delayed.persist.rehydrate();
  delayed.getState().setGoal(goal);
  assert.equal(delayed.getState().goal.feet, '');
  read(disk.data.get('kimo-onboarding'));
  await hydration;
  assert.equal(delayed.getState().goal.feet, '5');

  const corrupt = await ready({ ...memoryStorage(), getItem: () => '{broken' });
  assert.equal(corrupt.getState().hydrated, true);
  assert.ok(corrupt.getState().storageError);
  assert.equal(corrupt.getState().saveGoal(), false);

  let diskFails = false;
  const unavailable = memoryStorage();
  const diskFailure = await ready({ ...unavailable, setItem: (key, value) => { if (diskFails) throw new Error('disk full'); unavailable.setItem(key, value); } });
  diskFails = true;
  diskFailure.getState().setGoal(goal);
  assert.ok(diskFailure.getState().storageError);
  assert.equal(diskFailure.getState().saveGoal(), false);

  const resetPending = await ready(disk, () => new Promise((resolve) => { release = resolve; }));
  const oldRequest = resetPending.getState().submitLifestyle();
  resetPending.getState().reset();
  release('remote');
  assert.equal(await oldRequest, false);
  assert.equal(resetPending.getState().step, 'about-you');
  assert.deepEqual((await ready(disk)).getState().lifestyle, {});

  const completionDisk = memoryStorage();
  const completion = await ready(completionDisk);
  completion.getState().setAccessMode('account');
  completion.getState().setGoal(goal);
  completion.getState().saveGoal();
  completion.getState().setLifestyle(lifestyle);
  await completion.getState().submitLifestyle();
  assert.equal(completion.getState().complete(), true);
  const reopened = await ready(completionDisk);
  assert.equal(reopened.getState().completed, true);
  assert.equal(reopened.getState().accessMode, 'account');
  assert.equal(onboardingDestination(reopened.getState()), '/(tabs)');
  reopened.getState().visitStep('target');
  reopened.getState().setGoal({ ...goal, age: 72 });
  assert.equal(onboardingDestination(reopened.getState()), '/(tabs)');
  assert.equal(reopened.getState().goal.age, 28);
  reopened.getState().reset();
  assert.equal(onboardingDestination((await ready(completionDisk)).getState()), '/(auth)/welcome');

  // Older snapshots retain drafts while receiving new completion defaults.
  const legacyDisk = memoryStorage();
  legacyDisk.setItem('kimo-onboarding', JSON.stringify({ version: 1, state: { goal, lifestyle: {}, step: 'lifestyle', syncMode: 'local' } }));
  assert.equal(onboardingDestination((await ready(legacyDisk)).getState()), '/(onboarding)/lifestyle');

  const originalFetch = global.fetch;
  try {
    let request;
    global.fetch = async (url, options) => { request = { url, ...options }; return { ok: true }; };
    const post = createOnboardingTransport('https://example.test/onboarding', async () => 'test-token');
    assert.equal(await post({ goal, lifestyle }), 'remote');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(request.body), { goal, lifestyle });
    global.fetch = async () => ({ ok: false });
    await assert.rejects(post({ goal, lifestyle }));
  } finally { global.fetch = originalFetch; }
  console.log('Onboarding checks passed: validation, persistence, hydration, POST, retry, duplicate protection, storage failures, and reset.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

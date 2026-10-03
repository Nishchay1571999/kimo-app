const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { createSignupStore } = require('../src/features/auth/store/create-signup-store.ts');
const { appDestination } = require('../src/features/auth/store/signup-destination.ts');
const { createOnboardingStore } = require('../src/features/onboarding/store/create-onboarding-store.ts');

function memoryStorage() {
  const data = new Map();
  return { data, getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); }, removeItem: async (key) => { data.delete(key); } };
}
async function ready(disk) {
  const store = createSignupStore(disk);
  await store.persist.rehydrate();
  await store.getState().flush();
  return store;
}
async function main() {
  const disk = memoryStorage();
  const store = await ready(disk);
  const onboarding = createOnboardingStore(memoryStorage(), async () => 'local');
  await onboarding.persist.rehydrate();
  onboarding.setState({ hasStarted: true, step: 'lifestyle' });
  store.getState().begin('ai');
  store.getState().saveDraft({ displayName: 'First', email: 'first@example.com', password: 'never-save' });
  store.getState().saveDraft({ displayName: 'Latest', email: 'latest@example.com' });
  await store.getState().flush();
  const saved = JSON.parse(disk.data.get('kimo-signup')).state;
  assert.deepEqual(Object.keys(saved).sort(), ['displayName', 'email', 'pending', 'returnTo']);
  assert.equal(saved.displayName, 'Latest');
  assert.ok(!disk.data.get('kimo-signup').includes('never-save'));
  const reopened = await ready(disk);
  assert.equal(reopened.getState().displayName, 'Latest');
  assert.deepEqual(appDestination(reopened.getState(), onboarding.getState()), {
    pathname: '/(auth)/register', params: { returnTo: 'ai' },
  });
  // Continuing as guest releases the signup gate and retains the reusable draft.
  reopened.getState().cancel();
  await reopened.getState().flush();
  const guest = await ready(disk);
  assert.equal(guest.getState().pending, false);
  assert.equal(guest.getState().displayName, 'Latest');
  assert.equal(appDestination(guest.getState(), onboarding.getState()), '/(onboarding)/goal');
  reopened.getState().begin('ai');
  // Signup also wins for an onboarded guest upgrading from the AI sheet.
  onboarding.setState({ completed: true });
  assert.equal(appDestination(reopened.getState(), onboarding.getState()).pathname, '/(auth)/register');
  assert.equal(await reopened.getState().finish(), true);
  assert.equal(appDestination((await ready(disk)).getState(), onboarding.getState()), '/(tabs)');
  assert.equal((await ready(disk)).getState().email, '');
  onboarding.setState({ completed: false });
  assert.equal(appDestination(reopened.getState(), onboarding.getState()), '/(onboarding)/goal');

  const serializedDisk = memoryStorage();
  let active = 0;
  let maximumActive = 0;
  const serialized = await ready({ ...serializedDisk, setItem: async (key, value) => {
    active++;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setImmediate(resolve));
    serializedDisk.data.set(key, value);
    active--;
  } });
  serialized.getState().begin('ai');
  serialized.getState().saveDraft({ displayName: 'A', email: 'a@example.com' });
  serialized.getState().saveDraft({ displayName: 'B', email: 'b@example.com' });
  assert.equal(await serialized.getState().finish(), true);
  assert.equal(maximumActive, 1);
  assert.equal((await ready(serializedDisk)).getState().pending, false);

  let read;
  const delayed = createSignupStore({ ...disk, getItem: () => new Promise((resolve) => { read = resolve; }) });
  const hydration = delayed.persist.rehydrate();
  delayed.getState().saveDraft({ displayName: 'Too early', email: '' });
  assert.equal(delayed.getState().displayName, '');
  await new Promise((resolve) => setImmediate(resolve));
  read(disk.data.get('kimo-signup'));
  await hydration;

  const corruptDisk = memoryStorage();
  corruptDisk.data.set('kimo-signup', '{broken');
  const corrupt = await ready(corruptDisk);
  assert.ok(corrupt.getState().storageError);
  assert.equal(corruptDisk.data.get('kimo-signup'), '{broken');
  assert.equal(await corrupt.getState().finish(), false);

  let fail = false;
  const failing = await ready({ ...memoryStorage(), setItem: async () => {
    if (fail) throw new Error('secure storage unavailable');
  } });
  fail = true;
  failing.getState().begin('ai');
  await failing.getState().flush();
  assert.ok(failing.getState().storageError);
  assert.equal(await failing.getState().finish(), false);
  assert.equal(failing.getState().pending, true);
  console.log('Signup checks passed: async persistence, resume precedence, AI return destination, ordered writes, hydration, clearing, and storage failures.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

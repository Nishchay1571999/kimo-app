const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { createSessionStore } = require('../src/features/auth/store/create-session-store.ts');
const { createGuestSession } = require('../src/features/auth/services/create-guest-session.ts');
const { createAuthService } = require('../src/features/auth/services/create-auth-service.ts');
const { createApiClient } = require('../src/lib/api/client.ts');
const { AxiosError } = require('axios');
const guest = { id: 'c115c629-d911-42aa-8e51-4a7d6db658ed', name: null, email: null,
  accountStatus: 'guest', timezone: 'Asia/Kolkata', onboardingCompleted: false,
  token: '44ab2d7f-2e76-49c4-8b63-524783fc0ab6', tokenType: 'Bearer' };
const registration = { displayName: 'Test', email: 'test@email.com', password: 'test123', confirmPassword: 'test123' };
async function ready(failWrites = () => false) {
  const disk = new Map();
  const storage = { getItem: async key => disk.get(key) ?? null,
    setItem: async (key, value) => { if (failWrites()) throw new Error('Storage unavailable'); disk.set(key, value); },
    removeItem: async key => disk.delete(key) };
  const store = createSessionStore(storage); await store.getState().hydrate();
  return { store, disk, storage };
}
async function main() {
  const { store, disk, storage } = await ready();
  let created = 0, release;
  const ensureGuest = createGuestSession({ getIdentity: () => store.getState(),
    requestGuest: () => { created++; return new Promise(resolve => { release = resolve; }); },
    accept: session => store.getState().accept(session) });
  const first = ensureGuest(), second = ensureGuest();
  assert.equal(first, second, 'Repeated taps share the complete creation/persistence operation');
  assert.equal(created, 1);
  release(guest);
  await Promise.all([first, second]);
  assert.equal((await ensureGuest()).token, guest.token);
  assert.equal(created, 1, 'A returning guest must not be created again');
  assert.deepEqual([...disk.values()], [guest.token], 'Persist only the token');
  let releaseWrite, slowCreations = 0;
  const slowStore = createSessionStore({ getItem: async () => null, removeItem: async () => {},
    setItem: () => new Promise(resolve => { releaseWrite = resolve; }) });
  await slowStore.getState().hydrate();
  const slowGuest = createGuestSession({ getIdentity: () => slowStore.getState(),
    requestGuest: async () => { slowCreations++; return guest; }, accept: value => slowStore.getState().accept(value) });
  const saving = slowGuest(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(slowGuest(), saving, 'Taps during a delayed token save still share the request');
  assert.equal(slowCreations, 1);
  releaseWrite(); await saving;
  const restored = createSessionStore(storage); await restored.getState().hydrate();
  assert.equal(restored.getState().token, guest.token);
  assert.equal(restored.getState().account, null);
  const duringRestore = createGuestSession({ getIdentity: () => restored.getState(),
    requestGuest: async () => { throw new Error('Must restore the saved identity first'); }, accept: async () => {} });
  await assert.rejects(duringRestore(), error => error.code === 'SESSION_NOT_READY');

  let response = guest, status = 200;
  const requests = [];
  const api = createApiClient('https://example.test', {
    getIdentity: () => restored.getState(), unauthorized: () => { throw new Error('Public errors must not clear guest'); }, onboardingRequired: () => {},
  }, async config => {
    requests.push({ url: config.url, body: config.data ? JSON.parse(config.data) : undefined, token: config.headers.Authorization });
    const result = { config, data: response, status, statusText: '', headers: {} };
    if (status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, result);
    return result;
  });
  const service = createAuthService(api, () => {
    const { account, token } = restored.getState(); return account && token ? { ...account, token } : null;
  }, () => 'Asia/Kolkata');
  response = { ...guest, onboardingCompleted: true };
  const account = await service.me(); restored.getState().confirm(guest.token, account);
  assert.equal(restored.getState().account.accountStatus, 'guest');
  assert.equal(requests[0].token, `Bearer ${guest.token}`);
  await service.continueAsGuest();
  assert.deepEqual(requests[1].body, { timezone: 'Asia/Kolkata' });
  assert.equal(requests[1].token, undefined);
  response = { ...guest, token: undefined, tokenType: undefined, accountStatus: 'member', name: 'Test', email: 'test@email.com', onboardingCompleted: true };
  const member = await service.register(registration);
  assert.equal(member.id, guest.id);
  assert.equal(member.token, guest.token);
  assert.equal(member.onboardingCompleted, true);
  assert.equal(requests.at(-1).body.auth_provider_id, guest.token);
  assert.equal(requests.at(-1).body.confirmPassword, undefined);
  assert.equal(requests.filter(request => request.url.endsWith('sign-in')).length, 0, 'Conversion uses its preserved token');
  await restored.getState().accept(member);
  const rejectMember = createGuestSession({ getIdentity: () => restored.getState(), requestGuest: async () => { throw new Error('Unexpected creation'); }, accept: async () => {} });
  await assert.rejects(rejectMember(), error => error.code === 'ALREADY_SIGNED_IN');

  // Failed conversion retains the guest token; mismatched account IDs cannot replace it.
  await restored.getState().accept(guest);
  response = { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists' }; status = 409;
  await assert.rejects(service.register(registration), error => error.code === 'EMAIL_ALREADY_EXISTS');
  assert.equal(restored.getState().token, guest.token);
  assert.equal(restored.getState().account.accountStatus, 'guest');
  response = { ...member, id: '706c13ca-1b19-4356-86bd-29b00faff74b' }; status = 200;
  await assert.rejects(service.register(registration), error => error.code === 'INVALID_ACCOUNT_RESPONSE');
  assert.equal(restored.getState().token, guest.token);

  let failWrite = true, storageCreations = 0;
  const failing = await ready(() => failWrite);
  const saveGuest = createGuestSession({ getIdentity: () => failing.store.getState(),
    requestGuest: async () => { storageCreations++; return guest; }, accept: value => failing.store.getState().accept(value) });
  await assert.rejects(saveGuest());
  assert.equal(failing.store.getState().storageRecovery, 'save');
  await assert.rejects(saveGuest(), error => error.code === 'SESSION_NOT_READY');
  failWrite = false; await failing.store.getState().retrySave();
  assert.equal((await saveGuest()).token, guest.token);
  assert.equal(storageCreations, 1, 'Retry token persistence without another backend creation');

  const stale = await ready(); let finish;
  const staleGuest = createGuestSession({ getIdentity: () => stale.store.getState(),
    requestGuest: () => new Promise(resolve => { finish = resolve; }), accept: value => stale.store.getState().accept(value) });
  const pending = staleGuest(); await stale.store.getState().clear(); finish(guest);
  await assert.rejects(pending, error => error.code === 'SESSION_CHANGED');
  assert.equal(stale.store.getState().token, null);
  assert.equal(stale.disk.size, 0);
  console.log('Guest checks passed: coalescing, resume, bearer restoration, conversion/ownership, conflict recovery, persistence retry, and stale responses.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

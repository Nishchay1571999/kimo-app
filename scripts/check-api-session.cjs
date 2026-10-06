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
const { AxiosError } = require('axios');
const { createApiClient, ApiError } = require('../src/lib/api/client.ts');
const { loginSchema } = require('../src/features/auth/schema/login-schema.ts');
const { registerSchema } = require('../src/features/auth/schema/register-schema.ts');
const account = { id: 'c115c629-d911-42aa-8e51-4a7d6db658ed', name: 'Test', email: 'test@email.com', accountStatus: 'member', timezone: 'UTC', onboardingCompleted: false };
const session = { ...account, token: 'test-token', tokenType: 'Bearer' };
async function main() {
  const disk = new Map();
  let failRemove = false;
  const storage = { getItem: async key => disk.get(key) ?? null,
    setItem: async (key, value) => { disk.set(key, value); },
    removeItem: async key => { if (failRemove) throw new Error('disk failure'); disk.delete(key); } };
  const store = createSessionStore(storage);
  await store.getState().hydrate();
  await store.getState().accept(session);
  assert.deepEqual([...disk.values()], ['test-token']);
  const restored = createSessionStore(storage);
  await restored.getState().hydrate();
  assert.equal(restored.getState().token, 'test-token');
  assert.equal(restored.getState().account, null, 'Restoration requires server confirmation');
  restored.getState().confirm('stale-token', account);
  assert.equal(restored.getState().account, null);
  restored.getState().confirm('test-token', account);
  assert.equal(restored.getState().account.id, account.id);
  const accepting = store.getState().accept({ ...session, token: 'replacement' });
  const clearing = store.getState().clear();
  await Promise.all([accepting, clearing]);
  assert.equal(store.getState().token, null);
  assert.equal(disk.size, 0, 'Late acceptance must not resurrect a signed-out token');
  failRemove = true;
  await store.getState().clear();
  assert.equal(store.getState().storageRecovery, 'clear');
  assert.ok(store.getState().storageError);
  failRemove = false;
  await store.getState().clear();
  assert.equal(store.getState().storageError, null);

  let identity = { token: 'test-token', epoch: 1 };
  let unauthorized = 0, onboarding = 0, sent;
  let response = { data: {}, status: 200 };
  const respond = config => {
    const result = { ...response, config, headers: {}, statusText: '' };
    if (result.status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, result);
    return result;
  };
  const client = createApiClient('https://example.test/', {
    getIdentity: () => identity, unauthorized: () => unauthorized++, onboardingRequired: () => onboarding++,
  }, async config => { sent = config; return respond(config); });
  await client.request('/v1/accounts/me');
  assert.equal(sent.headers.Authorization, 'Bearer test-token');
  assert.equal(sent.baseURL + sent.url, 'https://example.test/v1/accounts/me');
  response = { data: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, status: 401 };
  await assert.rejects(client.request('/v1/accounts/sign-in', { authenticated: false, method: 'POST', body: { email: 'test@email.com', password: 'test123' } }), error => error instanceof ApiError && error.code === 'INVALID_CREDENTIALS');
  assert.equal(sent.headers.Authorization, undefined);
  assert.equal(unauthorized, 0, 'Wrong login credentials must not sign out a guest');
  response = { data: {}, status: 401 };
  await assert.rejects(client.request('/private'));
  assert.equal(unauthorized, 1);
  response = { data: { message: 'Complete onboarding first' }, status: 403 };
  await assert.rejects(client.request('/private'));
  assert.equal(onboarding, 1);
  response = { data: { message: 'Other forbidden action' }, status: 403 };
  await assert.rejects(client.request('/private'));
  assert.equal(onboarding, 1);
  const stale = createApiClient('https://example.test', { getIdentity: () => identity,
    unauthorized: () => unauthorized++, onboardingRequired: () => onboarding++ },
  async config => { identity = { token: 'different', epoch: 2 }; response = { data: {}, status: 401 }; return respond(config); });
  await assert.rejects(stale.request('/private'));
  assert.equal(unauthorized, 1, 'A previous identity response must not clear the new session');
  response = { data: 'private upstream error', status: 500 };
  await assert.rejects(client.request('/private'), error => !error.message.includes('private upstream'));
  identity = { token: null, epoch: 3 };
  await assert.rejects(client.request('/private'), error => error.code === 'SESSION_REQUIRED');
  assert.ok(loginSchema.safeParse({ email: ' test@email.com ', password: 'test123' }).success);
  assert.ok(!registerSchema.safeParse({ displayName: 'Test', email: 'test@email.com', password: '123456', confirmPassword: '123456' }).success);
  assert.ok(registerSchema.safeParse({ displayName: 'Test', email: 'test@email.com', password: 'test123', confirmPassword: 'test123' }).success);
  console.log('API interceptors, session persistence/races, error isolation, and credential validation passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

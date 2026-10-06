const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { AxiosError } = require('axios');
const { QueryClient, MutationObserver } = require('@tanstack/react-query');
const { createApiClient, ApiError } = require('../src/lib/api/client.ts');
const { createEntryService } = require('../src/features/entries/services/entry-service.ts');
const { createSaveDraft } = require('../src/features/entries/save-draft.ts');
const { entryKey, entriesKey, entryQueryOptions, entriesQueryOptions, refreshEntryCaches } = require('../src/features/entries/queries.ts');
const { createUploadStore } = require('../src/features/upload/store/create-upload-store.ts');
const { entryToForm, draftPayload } = require('../src/features/entries/draft.ts');
const { initialValues } = require('../src/features/upload/schema.ts');
const id = '622f44f3-000e-42ce-82c4-c1a832e159ff';
const date = '2026-10-06';
const guest = { id: 'guest-account', epoch: 1, token: 'test-token' };
const member = { id: 'member-account', epoch: 2, token: 'member-token', email: 'test@email.com' };
const photo = { id: 'photo-1', type: 'image', mimeType: 'image/jpeg', base64: '/9j/AA==', fileSizeBytes: 4, widthPx: 2, heightPx: 2 };
function memory() {
  const data = new Map(); let failDelete = false, failWrite = false;
  return { data, failDeletion(value) { failDelete = value; }, failSaving(value) { failWrite = value; },
    getItem: key => data.get(key) ?? null,
    setItem(key, value) { if (failWrite) throw Error('Write failed'); data.set(key, value); },
    removeItem(key) { if (failDelete) throw Error('Delete failed'); data.delete(key); } };
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function response(body, revision = 1) {
  return { ...body, id, revision, recordedTimezone: 'Asia/Kolkata', inputSource: body.attachments.length ? 'mixed' : 'text',
    summary: { caloriesKcal: body.category === 'nutrition' ? body.data.items.reduce((sum, item) => sum + item.caloriesKcal, 0) : null },
    ai: { status: 'pending', synopsis: null }, createdAt: '2026-10-06T10:00:00Z', updatedAt: '2026-10-06T10:00:00Z',
    data: body.category === 'nutrition' ? { ...body.data, items: body.data.items.map((item, i) => ({ id: `food-${i}`, ...item })) } : body.data };
}
async function main() {
  let owner = guest, serverEntry, hold, failure = 0, malformed = false, wrongId = false;
  const requests = [];
  const api = createApiClient('https://example.test', { getIdentity: () => owner ?? { token: null, epoch: 9 }, unauthorized: () => {}, onboardingRequired: () => {} }, async config => {
    const body = config.data ? JSON.parse(config.data) : undefined;
    requests.push({ method: config.method, url: config.url, body, token: config.headers.Authorization });
    if (hold) await hold.promise;
    let data, status = 200;
    if (failure) { status = failure; data = { message: failure === 409 ? 'Entry changed; reload before editing' : 'Failed' }; }
    else if (config.method === 'post') { serverEntry = response(body); data = serverEntry; }
    else if (config.method === 'patch') {
      if (serverEntry.revision !== body.revision) { status = 409; data = { message: 'Entry changed; reload before editing' }; }
      else { serverEntry = response(body, serverEntry.revision + 2); data = serverEntry; }
    } else if (config.method === 'delete') { serverEntry = undefined; status = 204; data = ''; }
    else if (config.url.includes('?date=')) data = serverEntry ? [serverEntry] : [];
    else if (!serverEntry) { status = 404; data = { message: 'Entry not found' }; }
    else data = serverEntry;
    if (malformed) data = { id };
    if (wrongId && data?.id) data = { ...data, id: 'd593109a-f3c1-4fbb-b6a7-85f9e042232b' };
    const result = { config, status, data, headers: {}, statusText: '' };
    if (status >= 400) throw new AxiosError('Failed', 'ERR_BAD_REQUEST', config, undefined, result);
    return result;
  });
  const service = createEntryService(api, () => owner);
  const storage = memory(); const drafts = createUploadStore(storage);
  const save = createSaveDraft(service, drafts, () => owner);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false, gcTime: 0 } } });
  const saved = new MutationObserver(client, { mutationFn: save, onSuccess: result => refreshEntryCaches(client, result.owner, result.entry.id, result.entry, () => service.isCurrent(result.owner)) });
  const start = (draftId, category = 'nutrition') => {
    drafts.getState().activate(owner.id); drafts.getState().start(draftId, category, date, 'day');
    const values = initialValues(category, date, new Date('2026-10-06T10:00:00Z')); values.title = 'Lunch';
    if (category === 'nutrition') values.items[0] = { name: 'Rice', quantity: '150', unit: 'g', caloriesKcal: '195', proteinG: '', carbohydratesG: '42', fatG: '0' };
    if (category === 'exercise') Object.assign(values, { activityName: 'Walking', durationMinutes: '30' });
    if (category === 'note') values.note = 'Felt rested';
    drafts.getState().update(draftId, values); drafts.getState().flush();
  };
  try {
    start('meal'); drafts.getState().addPhotos(guest.id, 'meal', [photo]);
    const oldHome = ['account', 1, 'home', guest.id, 'Asia/Kolkata', date];
    const otherDay = ['account', 1, 'home', guest.id, 'Asia/Kolkata', '2026-10-05'];
    const foreignHome = ['account', 2, 'home', member.id, 'Asia/Kolkata', date];
    client.setQueryData(oldHome, { old: true }); client.setQueryData(otherDay, { old: true }); client.setQueryData(foreignHome, { other: true });
    failure = 422;
    await assert.rejects(saved.mutate('meal'), error => error.status === 422);
    assert.equal(drafts.getState().draft.photos.length, 1); assert.equal(drafts.getState().draft.values.title, 'Lunch'); assert.equal(drafts.getState().savingId, null);
    failure = 503;
    await assert.rejects(saved.mutate('meal'), error => error.code === 'SAVE_UNCONFIRMED');
    assert.equal(drafts.getState().draft.id, 'meal');
    failure = 0; hold = deferred();
    const first = save('meal'), second = save('meal'); assert.equal(first, second, 'Repeated taps coalesce');
    const count = requests.filter(r => r.method === 'post').length + 1;
    drafts.getState().update('meal', { ...drafts.getState().draft.values, title: 'Changed while saving' });
    drafts.getState().removePhoto('meal', photo.id); assert.equal(drafts.getState().discard('meal'), false);
    assert.equal(drafts.getState().draft.values.title, 'Lunch'); assert.equal(drafts.getState().draft.photos.length, 1);
    hold.resolve(); hold = undefined;
    const result = await first; await refreshEntryCaches(client, result.owner, id, result.entry, () => service.isCurrent(result.owner));
    assert.equal(requests.filter(r => r.method === 'post').length, count);
    assert.equal(result.cleaned, true); assert.equal(drafts.getState().draft, null); assert.equal(storage.data.has('kimo-upload-v1:guest-account'), false);
    assert.equal(requests.at(-1).token, 'Bearer test-token'); assert.equal(requests.at(-1).body.attachments[0].base64, photo.base64);
    assert.equal(serverEntry.data.items[0].proteinG, null); assert.equal(serverEntry.data.items[0].fatG, 0);
    assert.equal(client.getQueryData(entryKey(guest, id)).id, id);
    assert.equal(client.getQueryState(oldHome).isInvalidated, true); assert.equal(client.getQueryState(otherDay).isInvalidated, true);
    assert.equal(client.getQueryState(foreignHome).isInvalidated, false);
    assert.equal((await client.fetchQuery(entryQueryOptions(service, guest, id))).id, id);
    assert.equal((await client.fetchQuery(entriesQueryOptions(service, guest, date))).length, 1);
    assert.equal(client.getQueryData(entriesKey(member, date)), undefined);
    wrongId = true; await assert.rejects(service.get(id), error => error.code === 'INVALID_ENTRY_RESPONSE'); wrongId = false;
    malformed = true; await assert.rejects(service.get(id), error => error.code === 'INVALID_ENTRY_RESPONSE'); malformed = false;
    const beforeInvalid = requests.length;
    await assert.rejects(service.get('demo-meal')); await assert.rejects(service.list('2026-02-30'));
    assert.equal(requests.length, beforeInvalid);
    await assert.rejects(service.get(id, AbortSignal.abort()), error => error.code === 'ERR_CANCELED');

    // Edit preserves original food IDs/provenance and legacy PNG/audio attachments.
    serverEntry.data.items[0].nutritionSource = 'reference'; serverEntry.data.items[0].quantitySource = 'estimated';
    serverEntry.data.items[0].reference = { provider: 'test', providerFoodId: 'rice', amount: 150, unit: 'g' };
    serverEntry.attachments.push({ id: 'png', type: 'image', mimeType: 'image/png', base64: 'iVBORw0KGgo=', fileSizeBytes: 8 },
      { id: 'audio', type: 'audio', mimeType: 'audio/wav', base64: 'YXVkaW8=', fileSizeBytes: 5, durationMs: 1000 });
    const original = structuredClone(serverEntry);
    assert.ok(drafts.getState().beginEdit('edit', { entryId: id, revision: original.revision, originalDate: date, originalItems: original.data.items }, entryToForm(original), original.attachments, 'day'));
    let payload = draftPayload(drafts.getState().draft);
    assert.deepEqual(payload.data.items[0], original.data.items[0]); assert.equal(payload.attachments.length, 3);
    const edited = structuredClone(drafts.getState().draft.values); edited.title = 'Dinner'; edited.entryDate = '2026-10-07'; edited.items[0].caloriesKcal = '200';
    drafts.getState().update('edit', edited);
    payload = draftPayload(drafts.getState().draft);
    assert.equal(payload.data.items[0].id, original.data.items[0].id); assert.equal(payload.data.items[0].nutritionSource, 'user_entered'); assert.equal(payload.data.items[0].reference, undefined);
    serverEntry.revision += 1;
    await assert.rejects(saved.mutate('edit'), error => error.status === 409);
    assert.equal(drafts.getState().draft.values.title, 'Dinner'); assert.equal(drafts.getState().draft.edit.revision, original.revision, 'Conflicts must not rebase silently');
    serverEntry.revision = original.revision;
    const updated = await saved.mutate('edit'); assert.equal(updated.entry.entryDate, '2026-10-07'); assert.equal(updated.previousDate, date);
    assert.equal(requests.at(-1).method, 'patch'); assert.equal(requests.at(-1).body.revision, original.revision); assert.equal(drafts.getState().draft, null);
    assert.equal(client.getQueryState(oldHome).isInvalidated, true);

    // Confirmed save + failed local cleanup must never create again, including after restart.
    start('note', 'note'); storage.failDeletion(true);
    const cleanup = await saved.mutate('note'); assert.equal(cleanup.cleaned, false); assert.equal(drafts.getState().draft.savedEntryId, id);
    const restarted = createUploadStore(storage); restarted.getState().activate(guest.id);
    const restartedSave = createSaveDraft(service, restarted, () => owner);
    const posts = requests.filter(r => r.method === 'post').length;
    storage.failDeletion(false); const recovered = await restartedSave('note');
    assert.equal(recovered.cleaned, true); assert.equal(requests.filter(r => r.method === 'post').length, posts); assert.equal(restarted.getState().draft, null);
    // Clear the original in-memory receipt too before starting a new draft.
    assert.ok(drafts.getState().discard('note'));
    start('exercise', 'exercise'); storage.failSaving(true);
    const priorSave = requests.length; await assert.rejects(save('exercise'), /draft on this device/); assert.equal(requests.length, priorSave);
    storage.failSaving(false); drafts.getState().retryStorage(); await saved.mutate('exercise');
    assert.equal(serverEntry.data.estimatedCaloriesBurnedKcal, null);

    // Switching accounts before Axios applies headers must send no old payload with a new token.
    start('before-send', 'note');
    const beforeSendCount = requests.length;
    const beforeSend = service.save(drafts.getState().draft, guest);
    owner = member;
    await assert.rejects(beforeSend, error => error.code === 'SESSION_CHANGED');
    assert.equal(requests.length, beforeSendCount);
    await assert.rejects(client.fetchQuery({ ...entryQueryOptions(service, guest, id), staleTime: 0 }), error => error.code === 'SESSION_CHANGED');
    await assert.rejects(client.fetchQuery(entriesQueryOptions(service, guest, '2026-10-05')), error => error.code === 'SESSION_CHANGED');
    assert.equal(requests.length, beforeSendCount, 'Old cache keys must not query the new account');
    owner = guest; assert.ok(drafts.getState().discard('before-send'));

    // A response after an account switch cannot clear the previous account's draft or populate caches.
    start('stale', 'note'); hold = deferred(); const stale = save('stale');
    const rejection = assert.rejects(stale, error => error.code === 'SESSION_CHANGED');
    await Promise.resolve(); await Promise.resolve();
    owner = member; drafts.getState().activate(member.id); drafts.getState().start('member-draft', 'note', date, 'home');
    drafts.getState().beginSave('member-draft', 'new-operation');
    hold.resolve(); hold = undefined; await rejection;
    assert.equal(drafts.getState().draft.id, 'member-draft');
    assert.equal(drafts.getState().savingId, 'new-operation', 'An old save completion cannot unlock a newer save');
    drafts.getState().endSave('new-operation');
    drafts.getState().activate(guest.id); assert.equal(drafts.getState().draft.id, 'stale'); assert.equal(drafts.getState().draft.savedEntryId, undefined);
    owner = guest;
    const cacheCount = client.getQueryCache().getAll().length;
    await refreshEntryCaches(client, guest, 'stale-entry', serverEntry, () => false); assert.equal(client.getQueryCache().getAll().length, cacheCount);
    const gate = deferred(); const originalCancel = client.cancelQueries.bind(client);
    client.cancelQueries = async (...args) => { await originalCancel(...args); await gate.promise; };
    let current = true;
    const refreshing = refreshEntryCaches(client, guest, 'another-stale-id', serverEntry, () => current);
    current = false; gate.resolve(); await refreshing;
    assert.equal(client.getQueryData(entryKey(guest, 'another-stale-id')), undefined); client.cancelQueries = originalCancel;

    const deletion = new MutationObserver(client, { mutationFn: async entryId => { await service.delete(entryId, guest); return entryId; }, onSuccess: entryId => refreshEntryCaches(client, guest, entryId, undefined, () => service.isCurrent(guest)) });
    await deletion.mutate(id); assert.equal(requests.at(-1).method, 'delete'); assert.equal(client.getQueryData(entryKey(guest, id)), undefined);
    await assert.rejects(service.get(id), error => error.status === 404);
    assert.equal((await service.list(date)).length, 0);
    failure = 404; await service.delete(id, guest); failure = 0;

  } finally { drafts.getState().flush(); client.clear(); }
  console.log('Entry API checks passed: Axios bearer CRUD, TanStack queries/mutations, Base64, validation, provenance, conflicts, draft retention, duplicate taps, receipts/restart, cache refresh, ownership/session races and deletion.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

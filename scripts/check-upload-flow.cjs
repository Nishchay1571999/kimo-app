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
const { initialValues, entryFormSchema, entryFacts, decodedBytes, validatePhotos, MAX_PHOTO_BYTES } = require('../src/features/upload/schema.ts');
function memory() {
  const data = new Map();
  let failRead = false, failWrite = false;
  return { data, setFailure(read, write) { failRead = read; failWrite = write; },
    getItem(key) { if (failRead) throw Error('Read failed'); return data.get(key) ?? null; },
    setItem(key, value) { if (failWrite) throw Error('Write failed'); data.set(key, value); },
    removeItem(key) { if (failWrite) throw Error('Write failed'); data.delete(key); } };
}
const date = '2026-10-06';
const photo = { id: 'photo-1', type: 'image', mimeType: 'image/jpeg', base64: '/9j/AA==', fileSizeBytes: 4, widthPx: 2, heightPx: 2 };
function main() {
  const meal = initialValues('nutrition', date, new Date('2026-10-06T10:00:00Z'));
  meal.title = 'Lunch'; meal.note = 'Rice for lunch'; meal.items[0] = { name: 'Rice', quantity: '150', unit: 'g', caloriesKcal: '195', proteinG: '', carbohydratesG: '42', fatG: '0' };
  assert.ok(entryFormSchema.safeParse(meal).success);
  assert.equal(entryFormSchema.safeParse({ ...meal, note: ' ' }).success, false, 'Meals need a note describing what was eaten');
  assert.equal(entryFacts(meal).data.items[0].proteinG, null, 'Unknown macros remain unknown');
  assert.equal(entryFacts(meal).data.items[0].fatG, 0, 'Explicit zero is preserved');
  for (const value of ['', '0', '-1', 'Infinity', '1e5', '2..5']) {
    const bad = structuredClone(meal); bad.items[0].quantity = value;
    assert.equal(entryFormSchema.safeParse(bad).success, false);
  }
  for (const value of ['2026-02-30', '2026-13-01', 'not-a-date']) assert.equal(entryFormSchema.safeParse({ ...meal, entryDate: value }).success, false);
  assert.equal(entryFormSchema.safeParse({ ...meal, occurredAt: '2026-10-06T10:00:00' }).success, false);
  assert.equal(entryFormSchema.safeParse({ ...meal, occurredAt: '2026-02-30T10:00:00Z' }).success, false);
  assert.equal(entryFormSchema.safeParse({ ...meal, items: [] }).success, false);
  assert.equal(entryFormSchema.safeParse({ ...meal, items: Array(101).fill(meal.items[0]) }).success, false);
  const exercise = { ...initialValues('exercise', date), title: 'Walk', note: '30 min walk', activityName: 'Walking', durationMinutes: '30' };
  assert.ok(entryFormSchema.safeParse(exercise).success);
  assert.equal(entryFacts(exercise).data.estimatedCaloriesBurnedKcal, null);
  assert.equal(entryFormSchema.safeParse({ ...exercise, estimatedCaloriesBurnedKcal: '80' }).success, false);
  assert.ok(entryFormSchema.safeParse({ ...exercise, estimatedCaloriesBurnedKcal: '80', calorieEstimationSource: 'Watch' }).success);
  const note = { ...initialValues('note', date), title: 'Energy', note: 'Felt rested' };
  assert.ok(entryFormSchema.safeParse(note).success);
  assert.equal(entryFormSchema.safeParse({ ...note, note: ' ' }).success, false);
  assert.equal(decodedBytes(photo.base64), 4);
  validatePhotos([photo]);
  assert.throws(() => decodedBytes('not-base64'));
  assert.throws(() => validatePhotos([photo, photo]), /already attached/);
  assert.throws(() => validatePhotos(Array.from({ length: 11 }, (_, i) => ({ ...photo, id: String(i) }))), /10 photos/);
  assert.throws(() => validatePhotos([{ ...photo, fileSizeBytes: MAX_PHOTO_BYTES + 1 }]), /20 MB/);
  assert.throws(() => validatePhotos([{ ...photo, fileSizeBytes: 3 }]), /read/);
  assert.throws(() => validatePhotos([{ ...photo, base64: 'aW1hZ2U=', fileSizeBytes: 5 }]), /read/);

  const storage = memory(); const store = createUploadStore(storage);
  store.getState().activate('guest'); store.getState().start('draft-1', 'nutrition', date, 'day');
  store.getState().update('draft-1', { ...meal, title: '' }); store.getState().addPhotos('guest', 'draft-1', [photo]);
  assert.equal(store.getState().draft.values.title, '', 'Incomplete forms are retained');
  store.getState().start('replacement', 'note', date, 'home');
  assert.equal(store.getState().draft.id, 'draft-1', 'Starting a new form cannot silently overwrite a draft');
  const restored = createUploadStore(storage); restored.getState().activate('guest');
  assert.equal(restored.getState().draft.photos[0].base64, photo.base64, 'Photos survive without a cache URI');
  assert.equal(restored.getState().draft.origin, 'day'); assert.equal(restored.getState().draft.values.entryDate, date);
  restored.getState().activate('guest'); assert.equal(restored.getState().draft.id, 'draft-1', 'Same account guest conversion keeps draft');
  restored.getState().activate('member'); assert.equal(restored.getState().draft, null, 'Different identities cannot see drafts');
  assert.throws(() => restored.getState().addPhotos('guest', 'draft-1', [photo]), /changed/);
  restored.getState().activate('guest'); restored.getState().removePhoto('draft-1', photo.id);
  assert.equal(restored.getState().draft.photos.length, 0);
  assert.equal(restored.getState().discard('stale-id'), false);
  storage.setFailure(false, true);
  assert.equal(restored.getState().discard('draft-1'), false, 'Failed deletion retains draft and alerts');
  assert.equal(restored.getState().draft.id, 'draft-1'); assert.ok(restored.getState().storageError);
  restored.getState().update('draft-1', meal); assert.equal(restored.getState().flush(), false);
  storage.setFailure(false, false); assert.equal(restored.getState().retryStorage(), true);
  assert.equal(restored.getState().storageError, null);
  const snapshot = storage.data.get('kimo-upload-v1:guest');
  storage.setFailure(true, false);
  const broken = createUploadStore(storage); broken.getState().activate('guest');
  assert.ok(broken.getState().restoreFailed);
  assert.equal(broken.getState().flush(), false, 'A restore failure must never delete the stored draft');
  broken.getState().start('new', 'note', date, 'home'); assert.equal(broken.getState().draft, null);
  assert.equal(storage.data.get('kimo-upload-v1:guest'), snapshot);
  storage.setFailure(false, false); assert.ok(broken.getState().retryStorage());
  assert.equal(broken.getState().draft.values.title, 'Lunch');
  assert.ok(broken.getState().discard('draft-1'));
  assert.equal(storage.data.has('kimo-upload-v1:guest'), false);
  assert.throws(() => broken.getState().addPhotos('guest', 'draft-1', [photo]), /changed/, 'Late picker results cannot resurrect discarded drafts');
  broken.getState().activate(null); assert.equal(broken.getState().draft, null);
  console.log('Upload checks passed: manual validation, unknown macros/calories, photo limits, restart/resume, ownership, late media results, storage retries and explicit discard.');
}
main();

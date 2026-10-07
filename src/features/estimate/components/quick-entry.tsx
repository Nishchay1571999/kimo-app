import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Input, InputError, InputField, InputLabel } from '@/components/ui/TextInput';
import { Button, ButtonText } from '@/components/ui/Button';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { entryService, useSaveEntry } from '@/features/entries/hooks';
import { uploadStore } from '@/features/upload/store/upload-store';
import type { UploadDraft } from '@/features/upload/store/create-upload-store';
import type { EntryFormValues } from '@/features/upload/schema';
import { Action, closeTo, draftRoute, Photos, StorageNotice, styles, UploadPage, useDraft } from '@/features/upload/components/shared';
import { useEstimate } from '../hooks';
import type { Estimate } from '../schema';
import { exerciseValues, nutritionValues } from '../draft';
import { EstimateSheet, type EstimateSheetState } from './estimate-sheet';

type Category = 'nutrition' | 'exercise';
const CATEGORIES: { value: Category; label: string }[] = [{ value: 'nutrition', label: 'Food' }, { value: 'exercise', label: 'Exercise' }];

/** Title + note + photo. Kimo calculates calories in the background and the user confirms before logging. */
export function QuickEntryScreen() {
  const nav = useDemoNavigation();
  const { draft, ownerId, storageError } = useDraft();
  useFocusEffect(useCallback(() => {
    if (ownerId && !draft && !storageError) uploadStore.getState().start(randomUUID(), 'nutrition', nav.date, nav.origin);
  }, [ownerId, draft, storageError, nav.date, nav.origin]));
  const page = (children: React.ReactNode) => <UploadPage title="Enter it yourself" subtitle={`Add a meal or workout for ${nav.date}.`} onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />{children}
  </UploadPage>;
  if (!draft) return page(null);
  // A saved entry still waiting on local cleanup, or an older plain note, finishes in its own flow.
  if (draft.savedEntryId || draft.values.category === 'note') return page(<View style={styles.card}>
    <Text style={styles.section}>{draft.values.title.trim() || 'Unfinished entry'}</Text>
    <Action onPress={() => router.replace(draftRoute(draft))}>Resume draft</Action>
  </View>);
  return <QuickEntryForm key={draft.id} draft={draft} />;
}

function QuickEntryForm({ draft }: { draft: UploadDraft }) {
  const nav = useDemoNavigation();
  const { savingId } = useDraft();
  const estimate = useEstimate();
  const save = useSaveEntry();
  const [sheet, setSheet] = useState<EstimateSheetState | null>(null);
  const [errors, setErrors] = useState<{ title?: string; note?: string; photo?: string }>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const focused = useRef(true);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const v = draft.values;
  const category = v.category as Category;
  const busy = save.isPending || !!savingId;
  const set = (patch: Partial<EntryFormValues>) => uploadStore.getState().update(draft.id, { ...uploadStore.getState().draft!.values, ...patch });
  const image = draft.photos.find(photo => photo.type === 'image');

  const calculate = () => {
    const next = {
      title: v.title.trim() ? undefined : 'Give this entry a title.',
      note: v.note.trim() ? undefined : category === 'nutrition' ? 'Describe what you ate.' : 'Describe what you did.',
      photo: image ? undefined : 'Add a photo as proof.',
    };
    setErrors(next);
    if (next.title || next.note || next.photo || !image) return;
    uploadStore.getState().flush();
    save.reset();
    setSheet({ status: 'loading' });
    estimate.mutate({ category, title: v.title.trim(), note: v.note.trim(), image: { mimeType: image.mimeType, base64: image.base64 } }, {
      onSuccess: result => setSheet(current => current ? { status: 'result', estimate: result } : current),
      onError: error => setSheet(current => current ? { status: 'error', message: error.message } : current),
    });
  };

  const confirm = (result: Estimate) => {
    try {
      const { values, extras } = result.category === 'nutrition' ? nutritionValues(v, result, !!draft.edit) : exerciseValues(v, result);
      uploadStore.getState().applyEstimate(draft.id, values, extras);
    } catch (error) {
      setSheet({ status: 'error', message: error instanceof Error ? error.message : 'Could not update your draft.' });
      return;
    }
    save.mutate(draft.id, { onSuccess: saved => {
      if (!focused.current || !entryService.isCurrent(saved.owner) || !saved.cleaned) return;
      setSheet(null);
      // New meals end on their effect on the day; workouts and edits open the entry itself.
      if (!draft.edit && saved.entry.category === 'nutrition') router.replace({ pathname: '/entries/saved', params: { entryId: saved.entry.id, date: saved.entry.entryDate, origin: draft.origin } });
      else router.replace({ pathname: '/entries/[entryId]', params: { entryId: saved.entry.id, date: saved.entry.entryDate, origin: draft.origin } });
    } });
  };

  return <UploadPage title={draft.edit ? 'Edit entry' : 'Enter it yourself'} subtitle="Add a photo, a title and a note. Kimo works out the calories for you to confirm." onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />
    <View style={[styles.card, { gap: 10 }]}>
      <InputLabel>What are you logging?</InputLabel>
      <View style={styles.row}>
        {CATEGORIES.map(option => <Button key={option.value} disabled={busy || !!draft.edit} variant={category === option.value ? 'default' : 'outline'}
          style={category === option.value ? styles.primary : undefined} accessibilityState={{ selected: category === option.value, disabled: busy || !!draft.edit }}
          onPress={() => set({ category: option.value })}><ButtonText>{option.label}</ButtonText></Button>)}
      </View>
    </View>
    <Photos draft={draft} title="Photo" hint={category === 'nutrition' ? 'Required. A photo of your meal as proof.' : 'Required. A photo of your workout, e.g. your watch or the gym.'} />
    {errors.photo && !image && <InputError accessibilityRole="alert">{errors.photo}</InputError>}
    <View style={styles.card}>
      <InputField>
        <InputLabel>Title</InputLabel>
        <Input value={v.title} editable={!busy} maxLength={100} accessibilityLabel="Title" invalid={!!errors.title && !v.title.trim()}
          placeholder={category === 'nutrition' ? 'e.g. Sunday lunch' : 'e.g. Morning run'} onChangeText={title => set({ title })} />
        {errors.title && !v.title.trim() && <InputError accessibilityRole="alert">{errors.title}</InputError>}
      </InputField>
      <InputField>
        <InputLabel>Note</InputLabel>
        <Input value={v.note} editable={!busy} multiline maxLength={10000} accessibilityLabel="Note" invalid={!!errors.note && !v.note.trim()}
          style={{ minHeight: 120, textAlignVertical: 'top' }} onChangeText={note => set({ note })}
          placeholder={category === 'nutrition' ? 'e.g. 2 rotis, a bowl of dal, some rice and a can of Coke' : 'e.g. 30 min run, then 15 min stretching'} />
        {errors.note && !v.note.trim() && <InputError accessibilityRole="alert">{errors.note}</InputError>}
      </InputField>
      <Text style={styles.muted}>{category === 'nutrition'
        ? 'Describe the whole meal with rough portions. Kimo splits it into foods and looks each one up in USDA and Open Food Facts.'
        : 'Describe each activity and how long you did it. Kimo estimates calories burned from your weight.'}</Text>
    </View>
    <Action disabled={busy || estimate.isPending} onPress={calculate}>{category === 'nutrition' ? 'Calculate calories' : 'Calculate calories burned'}</Action>
    {confirmDiscard ? <View style={styles.card}>
      <Text style={styles.error}>Discard this entry and its photos? This cannot be undone.</Text>
      <Action secondary disabled={busy} onPress={() => { if (uploadStore.getState().discard(draft.id)) router.replace(nav.backToOrigin); }}>Discard</Action>
      <Action secondary onPress={() => setConfirmDiscard(false)}>Keep editing</Action>
    </View> : <Action secondary disabled={busy} onPress={() => setConfirmDiscard(true)}>Discard</Action>}
    <EstimateSheet state={sheet} category={category} saving={busy} saveError={save.error?.message ?? null}
      onRetry={calculate} onClose={() => { if (!busy) { setSheet(null); estimate.reset(); } }}
      onConfirm={() => { if (sheet?.status === 'result') confirm(sheet.estimate); }} />
  </UploadPage>;
}

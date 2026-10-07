import { useCallback, useEffect } from 'react';
import { Text, View, type TextInputProps } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, InputError, InputField, InputLabel } from '@/components/ui/TextInput';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { entryFormSchema, formValuesSchema, type EntryCategory, type EntryFormValues } from '../schema';
import { uploadStore, useUploadStore } from '../store/upload-store';
import type { UploadDraft } from '../store/create-upload-store';
import { Action, closeTo, draftRoute, Photos, StorageNotice, styles, UploadPage, useDraft } from './shared';

/** Plain notes only; meals and workouts use the capture screen's title + note + photo flow. */
export function EntryFormScreen({ category }: { category: EntryCategory }) {
  const nav = useDemoNavigation();
  const { draft, ownerId, storageError } = useDraft();
  useFocusEffect(useCallback(() => {
    if (ownerId && !draft && !storageError) uploadStore.getState().start(randomUUID(), category, nav.date, nav.origin);
  }, [ownerId, draft, storageError, category, nav.date, nav.origin]));
  if (!draft || draft.values.category !== category) return <UploadPage title="Your entry draft" subtitle="Resume your current entry before starting another." onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />{draft && <Action onPress={() => router.replace(draftRoute(draft))}>Resume draft</Action>}
  </UploadPage>;
  return <EntryForm key={draft.id} draft={draft} />;
}
function EntryForm({ draft }: { draft: UploadDraft }) {
  const nav = useDemoNavigation();
  const saving = useUploadStore(s => s.savingId);
  const locked = !!saving || !!draft.savedEntryId;
  const { control, handleSubmit, subscribe, getFieldState, formState } = useForm<EntryFormValues>({ defaultValues: draft.values, resolver: zodResolver(entryFormSchema), mode: 'onBlur' });
  useEffect(() => {
    const unsubscribe = subscribe({ formState: { values: true }, callback: ({ values }) => {
      const parsed = formValuesSchema.safeParse(values);
      if (parsed.success) uploadStore.getState().update(draft.id, parsed.data);
    } });
    return () => { unsubscribe(); uploadStore.getState().flush(); };
  }, [subscribe, draft.id]);
  const field = (name: FieldPath<EntryFormValues>, label: string, props: TextInputProps = {}) => {
    const error = getFieldState(name, formState).error;
    return <Controller key={name} control={control} name={name} render={({ field: input }) => <InputField>
      <InputLabel>{label}</InputLabel><Input {...props} editable={!locked} ref={input.ref} value={String(input.value ?? '')} onChangeText={input.onChange} onBlur={input.onBlur} invalid={!!error} accessibilityLabel={label} />
      {error?.message && <InputError accessibilityRole="alert">{error.message}</InputError>}
    </InputField>} />;
  };
  const title = 'Write a note';
  return <UploadPage title={title} subtitle="Your work stays in a draft. Review the facts before saving." onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />
    <View style={styles.card}>{field('title', 'Entry title', { maxLength: 100, placeholder: 'e.g. How I felt today' })}
      {field('entryDate', 'Reporting date (YYYY-MM-DD)', { autoCapitalize: 'none' })}
      <Text style={styles.muted}>This is the day where the entry will appear.</Text>
      {field('occurredAt', 'Occurred at (ISO timestamp)', { autoCapitalize: 'none', autoCorrect: false, placeholder: '2026-10-06T12:30:00+05:30' })}
      <Text style={styles.muted}>Starts at the current time in UTC (Z). Change it for past entries; include Z or a timezone offset.</Text>
    </View>
    <View style={styles.card}>{field('note', 'Note', { multiline: true, maxLength: 10000, style: { minHeight: 110, textAlignVertical: 'top' } })}</View>
    <Photos draft={draft} />
    <Action disabled={!!saving} onPress={handleSubmit(values => {
      uploadStore.getState().update(draft.id, values); uploadStore.getState().flush();
      router.push(draftRoute({ ...draft, values }, true));
    })}>Review draft</Action>
  </UploadPage>;
}

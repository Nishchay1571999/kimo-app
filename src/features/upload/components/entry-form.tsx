import { useCallback, useEffect, useState } from 'react';
import { Text, View, type TextInputProps } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Controller, useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, InputError, InputField, InputLabel } from '@/components/ui/TextInput';
import { Button, ButtonText } from '@/components/ui/Button';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { entryFormSchema, formValuesSchema, emptyFood, type EntryCategory, type EntryFormValues } from '../schema';
import { uploadStore, useUploadStore } from '../store/upload-store';
import type { UploadDraft } from '../store/create-upload-store';
import { Action, closeTo, draftRoute, Photos, StorageNotice, styles, UploadPage, useDraft } from './shared';
import { FoodPicker } from '@/features/nutrition/components/food-picker';
import { foodSelectionSchema, providerLabel, type FoodSelection } from '@/features/nutrition/schema';

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
  const [lookup, setLookup] = useState<{ selection: FoodSelection; targetId: string; expectedFood: EntryFormValues['items'][number] } | null>(null);
  const { control, handleSubmit, subscribe, reset, getFieldState, formState } = useForm<EntryFormValues>({ defaultValues: draft.values, resolver: zodResolver(entryFormSchema), mode: 'onBlur' });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
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
  const choices = (name: 'mealCategory' | 'intensity', label: string, options: readonly string[]) => <Controller control={control} name={name} render={({ field: input }) => <View style={{ gap: 8 }}>
    <InputLabel>{label}</InputLabel><View style={styles.row}>{options.map(option => <Button key={option} disabled={locked} variant={input.value === option ? 'default' : 'outline'} accessibilityState={{ selected: input.value === option, disabled: locked }} onPress={() => { input.onChange(option); input.onBlur(); }}><ButtonText>{option[0].toUpperCase() + option.slice(1)}</ButtonText></Button>)}</View>
  </View>} />;
  const category = draft.values.category;
  const title = category === 'nutrition' ? 'Log a meal' : category === 'exercise' ? 'Log exercise' : 'Write a note';
  return <UploadPage title={title} subtitle="Your work stays in a draft. Review the facts before saving." onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />
    <View style={styles.card}>{field('title', 'Entry title', { maxLength: 100, placeholder: category === 'nutrition' ? 'e.g. Lunch' : category === 'exercise' ? 'e.g. Evening walk' : 'e.g. How I felt today' })}
      {field('entryDate', 'Reporting date (YYYY-MM-DD)', { autoCapitalize: 'none' })}
      <Text style={styles.muted}>This is the day where the entry will appear.</Text>
      {field('occurredAt', 'Occurred at (ISO timestamp)', { autoCapitalize: 'none', autoCorrect: false, placeholder: '2026-10-06T12:30:00+05:30' })}
      <Text style={styles.muted}>Starts at the current time in UTC (Z). Change it for past entries; include Z or a timezone offset.</Text>
    </View>
    {category === 'nutrition' && <>
      <View style={styles.card}>{choices('mealCategory', 'Meal', ['breakfast', 'lunch', 'dinner', 'snack', 'other'])}
        <Text style={styles.muted}>Enter nutrition for the full quantity of each food. Leave unknown macros blank.</Text></View>
      <FoodPicker key={lookup?.targetId ?? 'search'} disabled={locked} initialSelection={lookup?.selection} onAdd={item => {
        const values = uploadStore.getState().addNutritionFood(draft.ownerId, draft.id, item, lookup?.targetId, lookup?.expectedFood);
        reset(values, { keepDirty: true }); setLookup(null);
      }} />
      {lookup && <Action secondary disabled={locked} onPress={() => setLookup(null)}>Cancel portion change</Action>}
      {lookup && <Text style={styles.muted}>Enter the new quantity in the food picker above.</Text>}
      {fields.map((food, i) => <View key={food.id} style={styles.card}>
        <Text style={styles.section}>Food {i + 1}</Text>
        {(() => {
          const itemId = draft.values.items[i]?.id;
          const source = draft.nutritionItems?.find(item => item.id === itemId) ?? draft.edit?.originalItems.find(item => item.id === itemId);
          const selection = foodSelectionSchema.safeParse(source?.reference);
          return source?.reference && <View style={{ gap: 8 }}><Text style={styles.muted}>Reference available: {providerLabel(source.reference.provider)}. Changing values manually uses your input.</Text>
            {selection.success && itemId && <Action secondary disabled={locked} onPress={() => setLookup({ selection: selection.data, targetId: itemId, expectedFood: { ...draft.values.items[i] } })}>Change portion from reference</Action>}
          </View>;
        })()}
        {field(`items.${i}.name`, 'Food name')}
        {field(`items.${i}.quantity`, 'Quantity', { keyboardType: 'decimal-pad', placeholder: 'e.g. 150' })}
        {field(`items.${i}.unit`, 'Unit', { placeholder: 'e.g. g, cup, serving', maxLength: 30 })}
        {field(`items.${i}.caloriesKcal`, 'Calories for this quantity (kcal)', { keyboardType: 'decimal-pad' })}
        {field(`items.${i}.proteinG`, 'Protein (g, optional)', { keyboardType: 'decimal-pad' })}
        {field(`items.${i}.carbohydratesG`, 'Carbohydrates (g, optional)', { keyboardType: 'decimal-pad' })}
        {field(`items.${i}.fatG`, 'Fat (g, optional)', { keyboardType: 'decimal-pad' })}
        <Button variant="ghost" disabled={locked || fields.length === 1} onPress={() => remove(i)} accessibilityLabel={`Remove food ${i + 1}`}><ButtonText>Remove food</ButtonText></Button>
      </View>)}
      {formState.errors.items?.root?.message && <InputError>{formState.errors.items.root.message}</InputError>}
      <Action secondary disabled={locked || fields.length >= 100} onPress={() => append(emptyFood())}>Add another food</Action>
    </>}
    {category === 'exercise' && <View style={styles.card}>
      {field('activityName', 'Activity', { placeholder: 'e.g. Walking' })}
      {field('durationMinutes', 'Duration (minutes)', { keyboardType: 'decimal-pad' })}
      {choices('intensity', 'Intensity', ['light', 'moderate', 'vigorous'])}
      {field('estimatedCaloriesBurnedKcal', 'Calories burned (kcal, optional)', { keyboardType: 'decimal-pad' })}
      {field('calorieEstimationSource', 'Source of calorie estimate', { placeholder: 'e.g. Fitness watch' })}
      <Text style={styles.muted}>Leave calories blank if unknown. If you enter an estimate, include its source.</Text>
    </View>}
    <View style={styles.card}>{field('note', category === 'note' ? 'Note' : 'Notes (optional)', { multiline: true, maxLength: 10000, style: { minHeight: 110, textAlignVertical: 'top' } })}</View>
    <Photos draft={draft} />
    <Action disabled={!!saving} onPress={handleSubmit(values => {
      uploadStore.getState().update(draft.id, values); uploadStore.getState().flush();
      router.push(draftRoute({ ...draft, values }, true));
    })}>Review draft</Action>
  </UploadPage>;
}

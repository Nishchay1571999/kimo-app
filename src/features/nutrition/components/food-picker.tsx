import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, InputError, InputLabel } from '@/components/ui/TextInput';
import { Button, ButtonText } from '@/components/ui/Button';
import { styles } from '@/features/upload/components/shared';
import type { FoodItem } from '@/features/entries/schema';
import { nutritionService, useCalculateFood, useFoodDetail, useFoodSearch } from '../hooks';
import { portionSchema, providerLabel, searchInputSchema, unitsFor, type Food, type FoodSearchInput, type FoodSelection, type NutritionProvider, type PortionValues } from '../schema';

const searchFormSchema = z.object({ q: searchInputSchema.shape.q });
export function FoodPicker({ disabled, initialSelection, onAdd }: { disabled: boolean; initialSelection?: FoodSelection; onAdd: (food: FoodItem) => void }) {
  const [provider, setProvider] = useState<NutritionProvider>(initialSelection?.provider ?? 'usda-fdc');
  const [submitted, setSubmitted] = useState<FoodSearchInput | null>(null);
  const [selection, setSelection] = useState<FoodSelection | null>(initialSelection ?? null);
  const search = useFoodSearch(submitted);
  const detail = useFoodDetail(selection);
  const { control, handleSubmit, formState } = useForm<{ q: string }>({ defaultValues: { q: '' }, resolver: zodResolver(searchFormSchema) });
  return <View style={styles.card}>
    <Text style={styles.section}>Find nutrition</Text>
    <Text style={styles.muted}>Search a food reference, choose how much you ate, then check the values in your meal.</Text>
    <View style={styles.row}>{(['usda-fdc', 'open-food-facts'] as const).map(value => <Button key={value} disabled={disabled} variant={provider === value ? 'default' : 'outline'} accessibilityState={{ selected: provider === value, disabled }} onPress={() => { if (provider !== value) { setProvider(value); setSubmitted(null); setSelection(null); } }}><ButtonText>{providerLabel(value)}</ButtonText></Button>)}</View>
    <Controller control={control} name="q" render={({ field }) => <View style={{ gap: 6 }}><InputLabel>Food name</InputLabel>
      <Input ref={field.ref} accessibilityLabel="Search food name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!disabled} maxLength={200} placeholder="e.g. cooked rice" returnKeyType="search" invalid={!!formState.errors.q} />
      {formState.errors.q && <InputError>{formState.errors.q.message}</InputError>}
    </View>} />
    <Button disabled={disabled} loading={search.isFetching} onPress={handleSubmit(({ q }) => {
      setSelection(null);
      const next = { q, provider, page: 1 };
      if (submitted?.q === q && submitted.provider === provider && submitted.page === 1) void search.refetch();
      else setSubmitted(next);
    })}><ButtonText>Search foods</ButtonText></Button>
    {selection ? <>
      <Button variant="ghost" disabled={disabled} onPress={() => setSelection(null)}><ButtonText>Back to search results</ButtonText></Button>
      {detail.isPending ? <ActivityIndicator accessibilityLabel="Loading food reference" /> : detail.isError ? <>
        <Text accessibilityRole="alert" style={styles.error}>{detail.error.message} You can enter nutrition manually below.</Text>
        <Button variant="outline" disabled={disabled || detail.isFetching} onPress={() => { void detail.refetch(); }}><ButtonText>Retry food details</ButtonText></Button>
      </> : detail.data && <Portion key={`${detail.data.provider}:${detail.data.providerFoodId}`} food={detail.data} disabled={disabled} onAdd={onAdd} />}
    </> : submitted && <>
      {search.isPending ? <ActivityIndicator accessibilityLabel="Searching foods" /> : search.isError ? <>
        <Text accessibilityRole="alert" style={styles.error}>{search.error.message} Try another source or enter nutrition manually below.</Text>
        <Button variant="outline" disabled={disabled || search.isFetching} onPress={() => { void search.refetch(); }}><ButtonText>Retry search</ButtonText></Button>
      </> : search.data && <>
        <Text style={styles.muted}>{search.data.totalHits} results · Page {search.data.page}{search.data.totalPages ? ` of ${search.data.totalPages}` : ''}</Text>
        {search.data.foods.length === 0 && <Text style={styles.muted}>No usable foods on this page. Try another search or enter nutrition manually.</Text>}
        {search.data.foods.map(food => <Button key={food.providerFoodId} variant="outline" disabled={disabled} style={{ justifyContent: 'flex-start' }} onPress={() => setSelection({ provider: food.provider, providerFoodId: food.providerFoodId })}>
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.text}>{food.name}</Text><Text style={styles.muted}>{food.nutrition.caloriesKcal ?? 'Unknown'} kcal per {food.reference.quantity} {food.reference.unit}</Text></View>
        </Button>)}
        <View style={styles.row}><Button variant="outline" disabled={disabled || search.isFetching || submitted.page <= 1} onPress={() => setSubmitted({ ...submitted, page: submitted.page - 1 })}><ButtonText>Previous</ButtonText></Button>
          <Button variant="outline" disabled={disabled || search.isFetching || submitted.page >= Math.min(search.data.totalPages, 1000)} onPress={() => setSubmitted({ ...submitted, page: submitted.page + 1 })}><ButtonText>Next</ButtonText></Button></View>
      </>}
    </>}
  </View>;
}
function Portion({ food, disabled, onAdd }: { food: Food; disabled: boolean; onAdd: (food: FoodItem) => void }) {
  const units = unitsFor(food.reference.unit);
  const resolverSchema = portionSchema.refine(value => units.includes(value.unit), { path: ['unit'], message: 'Choose a unit supported by this food' });
  const { control, handleSubmit, formState } = useForm<PortionValues>({ defaultValues: { quantity: '', unit: food.reference.unit }, resolver: zodResolver(resolverSchema) });
  const calculation = useCalculateFood();
  const inFlight = useRef(false);
  const focused = useRef(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const busy = disabled || calculation.isPending;
  const unknown = (value: number | null) => value === null ? 'unknown' : String(value);
  return <View style={{ gap: 12 }}>
    <Text style={styles.section}>{food.name}</Text>
    <Text style={styles.muted}>{providerLabel(food.provider)} · Reference per {food.reference.quantity} {food.reference.unit}</Text>
    <Text style={styles.text}>{unknown(food.nutrition.caloriesKcal)} kcal · Protein {unknown(food.nutrition.proteinG)} g · Carbs {unknown(food.nutrition.carbohydratesG)} g · Fat {unknown(food.nutrition.fatG)} g</Text>
    {food.nutrition.caloriesKcal === null ? <Text style={styles.muted}>This food has no calorie reference. Enter confirmed nutrition manually below.</Text> : <>
      <Controller control={control} name="quantity" render={({ field }) => <View style={{ gap: 6 }}><InputLabel>Quantity you ate</InputLabel>
        <Input ref={field.ref} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} keyboardType="decimal-pad" accessibilityLabel="Quantity you ate" invalid={!!formState.errors.quantity} />
        {formState.errors.quantity && <InputError>{formState.errors.quantity.message}</InputError>}
      </View>} />
      <Controller control={control} name="unit" render={({ field }) => <View style={styles.row}>{units.map(unit => <Button key={unit} disabled={busy} variant={field.value === unit ? 'default' : 'outline'} accessibilityLabel={`Quantity unit ${unit}`} accessibilityState={{ selected: field.value === unit, disabled: busy }} onPress={() => field.onChange(unit)}><ButtonText>{unit}</ButtonText></Button>)}</View>} />
      {formState.errors.unit && <InputError>{formState.errors.unit.message}</InputError>}
      {(calculation.error || applyError) && <Text accessibilityRole="alert" style={styles.error}>{applyError ?? calculation.error?.message} Your existing meal details are kept.</Text>}
      <Button loading={calculation.isPending} disabled={disabled} style={styles.primary} onPress={() => { void handleSubmit(values => {
        if (inFlight.current || disabled) return;
        inFlight.current = true; setApplyError(null);
        calculation.mutate({ provider: food.provider, providerFoodId: food.providerFoodId, quantity: Number(values.quantity), unit: values.unit }, {
          onSuccess: result => {
            if (!focused.current || !nutritionService.isCurrent(result.owner)) return;
            try { onAdd(result.item); } catch (error) { setApplyError(error instanceof Error ? error.message : 'Could not add this food. Please try again.'); }
          }, onSettled: () => { inFlight.current = false; },
        });
      })(); }}><ButtonText>Calculate and use this portion</ButtonText></Button>
    </>}
  </View>;
}

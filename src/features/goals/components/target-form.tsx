import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Button, ButtonText } from '@/components/ui/Button';
import { InputError } from '@/components/ui/TextInput';
import { useConfirmTarget, useGoalTarget } from '../hooks';
import { CALORIE_RANGE, PROTEIN_RANGE, type GoalTarget } from '../schema';

function Stepper({ label, unit, value, step, range, onChange }: {
  label: string; unit: string; value: number; step: number; range: { min: number; max: number }; onChange: (value: number) => void;
}) {
  const set = (next: number) => onChange(Math.min(range.max, Math.max(range.min, next)));
  return <View style={styles.stepper}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperRow}>
      <Pressable style={styles.stepButton} onPress={() => set(value - step)} disabled={value <= range.min} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`}>
        <Minus size={18} color="#4D4BD8" />
      </Pressable>
      <Text style={styles.stepperValue} accessibilityLiveRegion="polite">{value.toLocaleString('en-US')}<Text style={styles.stepperUnit}> {unit}</Text></Text>
      <Pressable style={styles.stepButton} onPress={() => set(value + step)} disabled={value >= range.max} accessibilityRole="button" accessibilityLabel={`Increase ${label}`}>
        <Plus size={18} color="#4D4BD8" />
      </Pressable>
    </View>
  </View>;
}

/** Shows the server's suggestion, lets the user adjust, and stores only what they confirm. */
export function TargetForm({ confirmLabel = 'Confirm target', onConfirmed }: { confirmLabel?: string; onConfirmed: (target: GoalTarget) => void }) {
  const query = useGoalTarget();
  const confirm = useConfirmTarget();
  const initial = query.data?.target ?? query.data?.suggestion ?? null;
  const [values, setValues] = useState<{ caloriesKcal: number; proteinG: number } | null>(null);

  if (query.isPending) return <ActivityIndicator style={styles.loading} accessibilityLabel="Loading your target" />;
  if (query.isError) return <View style={styles.gap}>
    <InputError>{query.error instanceof Error ? query.error.message : 'Could not load your target.'}</InputError>
    <Button variant="outline" onPress={() => { void query.refetch(); }}><ButtonText>Try again</ButtonText></Button>
  </View>;
  const suggestion = query.data.suggestion;
  // Until the user adjusts anything, show their confirmed target or the suggestion.
  const current = values ?? (initial ? { caloriesKcal: initial.caloriesKcal, proteinG: initial.proteinG } : { caloriesKcal: 2000, proteinG: 90 });
  const matchesSuggestion = !!suggestion && suggestion.caloriesKcal === current.caloriesKcal && suggestion.proteinG === current.proteinG;
  return <View style={styles.gap}>
    {suggestion && <Text style={styles.explanation}>{suggestion.explanation} You can adjust it any time.</Text>}
    <Stepper label="Daily calories" unit="kcal" value={current.caloriesKcal} step={50} range={CALORIE_RANGE} onChange={caloriesKcal => setValues({ ...current, caloriesKcal })} />
    <Stepper label="Daily protein" unit="g" value={current.proteinG} step={5} range={PROTEIN_RANGE} onChange={proteinG => setValues({ ...current, proteinG })} />
    {suggestion && !matchesSuggestion && <Button variant="link" onPress={() => setValues({ caloriesKcal: suggestion.caloriesKcal, proteinG: suggestion.proteinG })}>
      <ButtonText>Use suggested ({suggestion.caloriesKcal.toLocaleString('en-US')} kcal · {suggestion.proteinG} g)</ButtonText>
    </Button>}
    {confirm.isError && <InputError>{confirm.error instanceof Error ? confirm.error.message : 'Could not save your target.'}</InputError>}
    <Button size="lg" disabled={confirm.isPending} onPress={() => confirm.mutate({ ...current, method: matchesSuggestion ? 'suggested' : 'custom' }, { onSuccess: onConfirmed })}>
      <ButtonText>{confirm.isPending ? 'Saving…' : confirmLabel}</ButtonText>
    </Button>
  </View>;
}
const styles = StyleSheet.create({
  loading: { paddingVertical: 32 }, gap: { gap: 16 },
  explanation: { fontSize: 14, lineHeight: 21, color: '#52525B' },
  stepper: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6E7E2', backgroundColor: '#FFFFFF', gap: 10 },
  stepperLabel: { fontSize: 13, color: '#777983', fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F0FF', alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 28, fontWeight: '700', color: '#17171A' }, stepperUnit: { fontSize: 15, fontWeight: '500', color: '#777983' },
});

import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Button, ButtonText } from '@/components/ui/Button';
import { providerLabel } from '@/features/nutrition/schema';
import type { Estimate, ExerciseEstimate, NutritionEstimate } from '../schema';

export type EstimateSheetState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'result'; estimate: Estimate };

type Props = {
  state: EstimateSheetState | null;
  category: 'nutrition' | 'exercise';
  saving: boolean;
  saveError: string | null;
  onConfirm: () => void;
  onRetry: () => void;
  onClose: () => void;
};

const kcal = (value: number) => `${Math.round(value).toLocaleString('en-US')} kcal`;
const grams = (value: number | null) => value === null ? '–' : `${Math.round(value)} g`;

/** Shows Kimo's calorie calculation and asks for approval before anything is logged. */
export function EstimateSheet({ state, category, saving, saveError, onConfirm, onRetry, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const close = () => { if (!saving) onClose(); };
  return <Modal visible={!!state} transparent animationType="slide" onRequestClose={close} supportedOrientations={['portrait', 'landscape']}>
    <View style={[styles.overlay, { paddingTop: insets.top }]}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Dismiss calorie result" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} accessibilityViewIsModal onAccessibilityEscape={close}>
        <View style={styles.handle} />
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">{state?.status === 'result' ? 'Confirm and log' : category === 'nutrition' ? 'Calculating calories' : 'Calculating calories burned'}</Text>
          <Pressable onPress={close} disabled={saving} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <X size={22} color="#71717A" strokeWidth={1.75} />
          </Pressable>
        </View>
        {state?.status === 'loading' && <View style={styles.center}>
          <ActivityIndicator size="large" color="#5856E8" accessibilityLabel="Calculating" />
          <Text style={styles.muted} accessibilityLiveRegion="polite">{category === 'nutrition'
            ? 'Kimo is reading your note and looking up each food in USDA and Open Food Facts…'
            : 'Kimo is reading your note and working out each activity…'}</Text>
        </View>}
        {state?.status === 'error' && <View style={styles.body}>
          <Text accessibilityRole="alert" style={styles.error}>{state.message}</Text>
          <View style={styles.actions}>
            <Button size="lg" onPress={onClose} style={styles.primary}><ButtonText>Edit note</ButtonText></Button>
            <Button size="lg" variant="outline" onPress={onRetry}><ButtonText>Try again</ButtonText></Button>
          </View>
        </View>}
        {state?.status === 'result' && <>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {state.estimate.category === 'nutrition' ? <NutritionResult estimate={state.estimate} /> : <ExerciseResult estimate={state.estimate} />}
          </ScrollView>
          <View style={[styles.body, styles.footer]}>
            {saveError && <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text>}
            <Button size="lg" loading={saving} onPress={onConfirm} style={styles.primary}><ButtonText>Confirm & log</ButtonText></Button>
            <Button size="lg" variant="outline" disabled={saving} onPress={onClose}><ButtonText>Edit</ButtonText></Button>
          </View>
        </>}
      </View>
    </View>
  </Modal>;
}

function NutritionResult({ estimate }: { estimate: NutritionEstimate }) {
  return <>
    {estimate.items.map(item => <View key={item.id} style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.name}>{item.name} <Text style={styles.muted}>· {item.quantity} {item.unit}</Text></Text>
        <Text style={styles.muted}>{item.matchedName} · {Math.round(item.amount)} {item.amountUnit}</Text>
        <Text style={styles.muted}>P {grams(item.proteinG)} · C {grams(item.carbohydratesG)} · F {grams(item.fatG)}</Text>
        {item.reference && <Text style={styles.badge}>{providerLabel(item.reference.provider)}</Text>}
      </View>
      <Text style={styles.kcal}>{kcal(item.caloriesKcal)}</Text>
    </View>)}
    {estimate.unmatched.length > 0 && <View style={styles.warning} accessibilityRole="alert">
      <Text style={styles.warningTitle}>Not included</Text>
      {estimate.unmatched.map(food => <Text key={food.name} style={styles.warningText}>{food.name}: {food.reason}</Text>)}
      <Text style={styles.warningText}>Edit your note to rename these foods, or log without them.</Text>
    </View>}
    <View style={styles.total}>
      <Text style={styles.totalLabel}>Total</Text>
      <Text style={styles.totalValue}>{kcal(estimate.totals.caloriesKcal)}</Text>
    </View>
    <Text style={styles.muted}>Protein {grams(estimate.totals.proteinG)} · Carbs {grams(estimate.totals.carbohydratesG)} · Fat {grams(estimate.totals.fatG)}. Portions are estimated from your note and photo.</Text>
  </>;
}

function ExerciseResult({ estimate }: { estimate: ExerciseEstimate }) {
  return <>
    {estimate.activities.map((activity, i) => <View key={`${activity.activityName}-${i}`} style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.name}>{activity.activityName}</Text>
        <Text style={styles.muted}>{activity.durationMinutes} min · {activity.intensity} · MET {activity.met}</Text>
      </View>
      <Text style={styles.kcal}>{kcal(activity.caloriesBurnedKcal)}</Text>
    </View>)}
    <View style={styles.total}>
      <Text style={styles.totalLabel}>Burned · {estimate.totals.durationMinutes} min</Text>
      <Text style={styles.totalValue}>{kcal(estimate.totals.caloriesBurnedKcal)}</Text>
    </View>
    <Text style={styles.muted}>Estimated as MET × {estimate.weightKg} kg × hours.</Text>
  </>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  backdrop: { flex: 1 },
  sheet: { width: '100%', maxWidth: 640, maxHeight: '85%', alignSelf: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, backgroundColor: '#FFFFFF' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#E4E4E7' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 12, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '600', color: '#18181B' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 16, paddingHorizontal: 32, paddingVertical: 40 },
  body: { paddingHorizontal: 24, gap: 12 },
  footer: { paddingTop: 12 },
  actions: { gap: 10, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F2' },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  kcal: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  badge: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', backgroundColor: '#EEF0FF', color: '#4D4BD8', fontSize: 11, fontWeight: '700' },
  muted: { color: '#71717A', fontSize: 13, lineHeight: 19 },
  warning: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, gap: 4 },
  warningTitle: { color: '#9A3412', fontWeight: '700', fontSize: 14 },
  warningText: { color: '#9A3412', fontSize: 13, lineHeight: 19 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 6 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  totalValue: { fontSize: 24, fontWeight: '700', color: '#4D4BD8' },
  error: { color: '#B91C1C', fontSize: 15, lineHeight: 22 },
  primary: { backgroundColor: '#5856E8', minHeight: 48 },
});

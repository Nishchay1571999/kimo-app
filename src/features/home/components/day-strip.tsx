import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DayData } from '../types';

const tones = {
  good: { backgroundColor: '#DDF5E5', color: '#1F7A43' },
  over: { backgroundColor: '#FCEFD9', color: '#A15C07' },
  quiet: { backgroundColor: '#F0F0F2', color: '#71717A' },
};
/** What the day meant relative to the goal, not just whether something was logged. */
export function dayBadge({ status, deltaKcal }: Pick<DayData, 'status' | 'deltaKcal'>) {
  const delta = deltaKcal === null ? '' : `${deltaKcal > 0 ? '+' : '−'}${Math.abs(deltaKcal).toLocaleString('en-US')}`;
  switch (status) {
    case 'on_track': return { label: 'On track', tone: tones.good, a11y: 'on track' };
    case 'over': return { label: delta, tone: tones.over, a11y: `${Math.abs(deltaKcal ?? 0)} kcal over target` };
    case 'under': return { label: delta, tone: tones.quiet, a11y: `${Math.abs(deltaKcal ?? 0)} kcal under target` };
    case 'in_progress': return { label: 'So far', tone: tones.good, a11y: 'in progress' };
    case 'logged': return { label: 'Logged', tone: tones.quiet, a11y: 'entries logged' };
    case 'not_logged': return { label: '—', tone: tones.quiet, a11y: 'nothing logged' };
    case 'future': return { label: '', tone: null, a11y: '' };
    default: return { label: '…', tone: tones.quiet, a11y: '' };
  }
}

export function DayStrip({ days, onSelect }: { days: readonly DayData[]; onSelect: (date: string) => void }) {
  // The wrapper must not shrink: in Home's column layout the strip would otherwise be clipped.
  return <View style={styles.wrapper}>
    <ScrollView style={{ flexGrow: 0 }} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
      {days.map(day => <DayCard key={day.dateKey} {...day} onSelect={onSelect} />)}
    </ScrollView>
  </View>;
}

function DayCard({ day, date, status, deltaKcal, active, dateKey, onSelect }: DayData & { onSelect: (date: string) => void }) {
  const badge = dayBadge({ status, deltaKcal });
  return <Pressable onPress={() => onSelect(dateKey)} accessibilityRole="button"
    accessibilityLabel={`${dateKey}${badge.a11y ? `, ${badge.a11y}` : ''}`} accessibilityState={{ selected: !!active }}
    style={[styles.dayCard, active && styles.dayCardActive]}>
    <Text style={[styles.dayName, active && styles.dayNameActive]}>{day}</Text>
    <Text style={[styles.dayDate, active && styles.dayDateActive]}>{date}</Text>
    <View style={[styles.badge, badge.tone && { backgroundColor: badge.tone.backgroundColor }]}>
      <Text numberOfLines={1} style={[styles.badgeText, badge.tone && { color: badge.tone.color }]}>{badge.label}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  wrapper: { flexShrink: 0 },
  dayStrip: { paddingHorizontal: 20, gap: 8, paddingBottom: 18 },
  dayCard: { width: 76, minHeight: 100, paddingVertical: 12, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECECEA', alignItems: 'center', justifyContent: 'center' },
  dayCardActive: { borderWidth: 1.5, borderColor: '#5856E8', backgroundColor: '#F9F8FF' },
  dayName: { fontSize: 13, color: '#797B84' }, dayNameActive: { color: '#29283B', fontWeight: '600' },
  dayDate: { marginTop: 4, fontSize: 19, fontWeight: '700', color: '#27282D' }, dayDateActive: { color: '#4D4BD8' },
  badge: { marginTop: 8, minHeight: 22, paddingHorizontal: 8, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

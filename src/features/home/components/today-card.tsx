import { router } from 'expo-router';
import { Dumbbell, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/Button';
import { askKimo, dayQuestion } from '@/features/kimo/ask';
import type { DayGoal, Home } from '../schema/home-schema';

const n = (value: number) => Math.round(value).toLocaleString('en-US');
export function statusHeadline(goal: DayGoal, isToday: boolean, weekday: string) {
  const prefix = isToday ? '' : `${weekday} · `;
  switch (goal.status) {
    case 'over': return `${prefix}${n(goal.deltaKcal)} kcal over target`;
    case 'under': return `${prefix}${n(-goal.deltaKcal)} kcal under target`;
    case 'on_track': return isToday ? "You're on track" : `${prefix}On track`;
    case 'in_progress': return "You're on track so far";
    case 'not_logged': return isToday ? 'Nothing logged yet' : `${prefix}Nothing logged`;
  }
}
function Progress({ value, max, over }: { value: number; max: number; over?: boolean }) {
  return <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: Math.min(value, max) }}>
    <View style={[styles.fill, { width: `${Math.min(100, (value / max) * 100)}%` }, over && styles.fillOver]} />
  </View>;
}

function ExerciseRow({ minutes, burnedKcal, incomplete }: { minutes: number; burnedKcal: number | null; incomplete: boolean }) {
  return <View style={styles.exercise} accessibilityLabel={`Exercise: ${n(minutes)} minutes${burnedKcal === null ? '' : `, about ${n(burnedKcal)} kilocalories burned`}`}>
    <View style={styles.exerciseIcon}><Dumbbell size={16} color="#1F7A43" /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>Exercise</Text>
      <Text style={styles.muted}>{minutes > 0 ? `${n(minutes)} min${incomplete ? ' · some without an estimate' : ''}` : 'No exercise logged'}</Text>
    </View>
    <Text style={styles.burned}>{burnedKcal ? `−${n(burnedKcal)} kcal` : '—'}</Text>
  </View>;
}

/** Answers "Where am I? → Why? → What next?" for the selected day. */
export function TodayCard({ home }: { home: Home }) {
  const { goal, day, summary } = home;
  const isToday = day.isToday;
  const minutes = summary.exercise.durationMinutes;
  if (!goal) return <View style={styles.card}>
    <Text style={styles.eyebrow}>{isToday ? 'TODAY' : day.weekday.toUpperCase()}</Text>
    <Text style={styles.headline}>{n(summary.nutrition.caloriesConsumedKcal)} kcal logged</Text>
    <ExerciseRow minutes={minutes} burnedKcal={summary.exercise.caloriesBurnedKcal} incomplete={minutes > 0 && summary.exercise.caloriesBurnedKcal === null} />
    <Text style={styles.body}>Set a daily target so Kimo can tell you how each day is going and what to do next.</Text>
    <Button onPress={() => router.push({ pathname: '/goals/current', params: { origin: 'home' } })}><ButtonText>Set your daily target</ButtonText></Button>
  </View>;
  const over = goal.remainingKcal < 0;
  const burned = goal.burned?.caloriesKcal ?? 0;
  const net = goal.netKcal ?? goal.consumed.caloriesKcal;
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>{isToday ? 'TODAY' : day.weekday.toUpperCase()}</Text>
    <Text style={[styles.headline, goal.status === 'over' && styles.headlineOver]}>{statusHeadline(goal, isToday, day.weekday)}</Text>
    <View style={styles.metric}>
      <View style={styles.metricRow}>
        <Text style={styles.metricValue}>{n(net)} <Text style={styles.metricOf}>/ {n(goal.target.caloriesKcal)} kcal{burned > 0 ? ' net' : ''}</Text></Text>
        {isToday && <Text style={[styles.remaining, over && styles.remainingOver]}>{over ? `${n(-goal.remainingKcal)} over` : `${n(goal.remainingKcal)} left`}</Text>}
      </View>
      <Progress value={Math.max(0, net)} max={goal.target.caloriesKcal} over={over} />
      {burned > 0 && <Text style={styles.muted}>Eaten {n(goal.consumed.caloriesKcal)} − Burned {n(burned)} = Net {n(net)} kcal</Text>}
    </View>
    <View style={styles.metric}>
      <View style={styles.metricRow}>
        <Text style={styles.label}>Protein</Text>
        <Text style={styles.label}>{n(goal.consumed.proteinG)} / {n(goal.target.proteinG)} g</Text>
      </View>
      <Progress value={goal.consumed.proteinG} max={goal.target.proteinG} />
    </View>
    <ExerciseRow minutes={goal.burned?.durationMinutes ?? minutes} burnedKcal={goal.burned ? burned : summary.exercise.caloriesBurnedKcal} incomplete={goal.burned?.incomplete ?? false} />
    <View style={styles.insight}>
      <View style={styles.insightTitle}><Sparkles size={14} color="#4D4BD8" /><Text style={styles.insightLabel}>Kimo noticed</Text></View>
      <Text style={styles.body}>{goal.insight.headline}</Text>
      {goal.insight.nextStep && <>
        <Text style={[styles.insightLabel, { marginTop: 6 }]}>{isToday ? 'Next step' : 'What to change'}</Text>
        <Text style={styles.body}>{goal.insight.nextStep}</Text>
      </>}
    </View>
    {(goal.status !== 'not_logged' || burned > 0) && <Button variant="outline" onPress={() => askKimo(dayQuestion(home.date, isToday, goal))}>
      <ButtonText>{isToday ? 'Ask Kimo about today' : goal.status === 'over' ? 'Ask Kimo why' : 'Ask Kimo about this day'}</ButtonText>
    </Button>}
  </View>;
}
const styles = StyleSheet.create({
  card: { marginHorizontal: 20, padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E7E2', gap: 14 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700', color: '#71717A' },
  headline: { fontSize: 26, fontWeight: '700', color: '#17171A', marginTop: -6, letterSpacing: -0.4 }, headlineOver: { color: '#A15C07' },
  metric: { gap: 8 }, metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#17171A' }, metricOf: { fontSize: 14, fontWeight: '500', color: '#777983' },
  remaining: { fontSize: 15, fontWeight: '700', color: '#1F7A43' }, remainingOver: { color: '#A15C07' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#EFEFF2', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#5856E8' }, fillOver: { backgroundColor: '#E39A2D' },
  label: { fontSize: 13, color: '#52525B', fontWeight: '600' }, muted: { fontSize: 13, color: '#777983' },
  insight: { padding: 14, borderRadius: 16, backgroundColor: '#F6F5FF', gap: 4 },
  insightTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightLabel: { fontSize: 12, fontWeight: '700', color: '#4D4BD8', letterSpacing: 0.3 },
  body: { fontSize: 15, lineHeight: 22, color: '#27282D' },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#F3FAF5' },
  exerciseIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#DDF5E5', alignItems: 'center', justifyContent: 'center' },
  burned: { fontSize: 15, fontWeight: '700', color: '#1F7A43' },
});

import { router } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { useEntry } from '@/features/entries/hooks';
import { useHome } from '@/features/home/hooks/use-home';
import { statusHeadline } from '@/features/home/components/today-card';
import { askKimo, mealQuestion } from '@/features/kimo/ask';
import { Action, styles, UploadPage } from '@/features/upload/components/shared';

const n = (value: number) => Math.round(value).toLocaleString('en-US');
const MEAL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', other: 'Meal' } as const;

/** Every log ends with its consequence for the day, not just "saved". */
export default function SavedScreen() {
  const nav = useDemoNavigation();
  const { query: entryQuery } = useEntry(nav.entryId ?? '');
  const { query: dayQuery } = useHome(nav.date);
  const entry = entryQuery.data;
  const day = dayQuery.data;
  const goal = day?.goal;
  const meal = entry?.category === 'nutrition' ? entry : null;
  const protein = meal ? meal.data.items.reduce((sum, item) => sum + (item.proteinG ?? 0), 0) : 0;
  const done = () => router.replace(nav.backToOrigin);
  return <UploadPage eyebrow="LOGGED" title={meal ? `${MEAL[meal.data.mealCategory]} added` : 'Entry saved'} subtitle={entry?.title ?? ''} onClose={done}>
    {meal && <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <CircleCheck size={28} color="#1F7A43" />
      <Text style={styles.section}>{n(meal.summary.caloriesKcal ?? 0)} kcal{protein > 0 ? ` · ${n(protein)} g protein` : ''}</Text>
    </View>}
    {dayQuery.isPending || entryQuery.isPending ? <ActivityIndicator accessibilityLabel="Updating your day" />
      : goal ? <View style={styles.card}>
        <Text style={styles.muted}>{day.day.isToday ? "Today's progress" : `${day.day.weekday}'s progress`}</Text>
        <Text style={styles.title}>{n(goal.consumed.caloriesKcal)} <Text style={styles.muted}>/ {n(goal.target.caloriesKcal)} kcal</Text></Text>
        <Text style={styles.section}>{statusHeadline(goal, day.day.isToday, day.day.weekday)}</Text>
        {day.day.isToday && <Text style={styles.text}>{goal.remainingKcal >= 0 ? `${n(goal.remainingKcal)} kcal remaining` : `${n(-goal.remainingKcal)} kcal over today's target`} · {n(Math.max(0, goal.remainingProteinG))} g protein to go</Text>}
        {goal.insight.nextStep && <Text style={styles.muted}>{goal.insight.nextStep}</Text>}
      </View>
      : day ? <View style={styles.card}>
        <Text style={styles.text}>{n(day.summary.nutrition.caloriesConsumedKcal)} kcal logged {day.day.isToday ? 'today' : `on ${day.day.weekday}`}.</Text>
        <Text style={styles.muted}>Set a daily target to see what this means for your goal.</Text>
        <Action secondary onPress={() => router.replace({ pathname: '/goals/current', params: { origin: nav.origin, date: nav.date } })}>Set your daily target</Action>
      </View> : null}
    <Action onPress={done}>Done</Action>
    {entry && <Action secondary onPress={() => askKimo(mealQuestion(entry.title, entry.entryDate, entry.id))}>Ask Kimo about this meal</Action>}
  </UploadPage>;
}

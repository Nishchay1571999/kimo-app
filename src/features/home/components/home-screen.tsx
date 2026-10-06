import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/Button';
import { InputError } from '@/components/ui/TextInput';
import { AddEntryButton } from './add-entry-button';
import { DaySectionHeader } from './day-section-header';
import { DayStrip } from './day-strip';
import { HomeHeader } from './home-header';
import { DailyTotals } from './daily-totals';
import { SleepWakeCard } from './sleep-wake-card';
import { Timeline } from './timeline';
import { useHome } from '../hooks/use-home';
import { dateLabel, formatTime, shiftDate } from '../calendar';
import { toTimeline } from '../home-view';
import { homeHasPendingAnalysis } from '../queries';

export function HomeScreen({ history = false }: { history?: boolean }) {
  const params = useLocalSearchParams<{ date?: string }>();
  const { query, account, date, today, days, validDate } = useHome(params.date);
  const data = query.data;
  const selectDate = (next: string) => router.setParams({ date: !history && next === today ? undefined : next });
  const origin = history ? 'day' : 'home';
  return <View style={styles.container}>
    {history && <Button variant="link" onPress={() => router.replace({ pathname: '/(tabs)', params: { date: date === today ? undefined : date } })}><ButtonText>Back to Home</ButtonText></Button>}
    <HomeHeader title={account?.accountStatus === 'guest' ? 'Welcome to Kimo' : account?.name ? `Welcome back, ${account.name.split(' ')[0]}` : 'Welcome back'}
      subtitle="How are you feeling today?" avatarLabel={account?.name?.[0]?.toUpperCase() ?? 'G'} />
    <View style={styles.controls}>
      <Button variant="ghost" onPress={() => selectDate(shiftDate(date, -7))} accessibilityLabel="Previous week"><ButtonText>‹ Week</ButtonText></Button>
      <Button variant="link" onPress={() => selectDate(today)}><ButtonText>Today</ButtonText></Button>
      <Button variant="ghost" onPress={() => selectDate(shiftDate(date, 7))} accessibilityLabel="Next week"><ButtonText>Week ›</ButtonText></Button>
    </View>
    <DayStrip days={days} onSelect={selectDate} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={query.isFetching && !!data} onRefresh={() => { if (validDate) void query.refetch(); }} />}>
      <DaySectionHeader eyebrow="YOUR DAY" title={date === today ? 'Today' : dateLabel(date)}
        onHistory={history ? undefined : () => router.push({ pathname: '/history/day/[date]', params: { date } })} />
      <Text style={styles.timezone}>{date} · {data?.timezone ?? account?.timezone}</Text>
      {!validDate ? <View style={styles.message}><InputError>Choose a valid date.</InputError></View>
        : query.isPending ? <View style={styles.message}><ActivityIndicator accessibilityLabel="Loading your day" /></View>
        : !data ? <View style={styles.message}>
          <InputError>{query.error instanceof Error ? query.error.message : 'Could not load your day. Please try again.'}</InputError>
          <Button onPress={() => { void query.refetch(); }}><ButtonText>Try again</ButtonText></Button>
        </View> : <>
          {query.isError && <View style={styles.message}>
            <InputError>Could not refresh this day. Showing previously loaded entries.</InputError>
            <Button variant="link" onPress={() => { void query.refetch(); }}><ButtonText>Try again</ButtonText></Button>
          </View>}
          <SleepWakeCard wakeTime={data.schedule.wakeTime ? formatTime(data.schedule.wakeTime) : 'Not set'}
            sleepTime={data.schedule.sleepTime ? formatTime(data.schedule.sleepTime) : 'Not set'} crossesMidnight={data.schedule.crossesMidnight} />
          <DailyTotals summary={data.summary} />
          {homeHasPendingAnalysis(data) && <Text style={styles.analysisNotice}>AI summaries refresh briefly while you view this day. Pull down to check again.</Text>}
          {!data.timeline.some(item => item.type === 'entry') && <View style={styles.message}><Text style={styles.empty}>No entries for this day yet.</Text></View>}
          <Timeline items={toTimeline(data)} onOpenEntry={entryId => router.push({ pathname: '/entries/[entryId]', params: { entryId, date, origin } })} />
        </>}
    </ScrollView>
    {validDate && <AddEntryButton onPress={() => router.push({ pathname: '/capture', params: { date, origin } })} />}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' }, controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 150 }, timezone: { paddingHorizontal: 20, marginTop: 6, color: '#777983', fontSize: 12 },
  message: { marginHorizontal: 20, paddingVertical: 24, gap: 12 }, empty: { color: '#777983', fontSize: 14 },
  analysisNotice: { marginHorizontal: 20, marginTop: 14, color: '#777983', fontSize: 12, lineHeight: 18 },
});

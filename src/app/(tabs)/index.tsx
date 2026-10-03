import { ScrollView, StyleSheet, View } from 'react-native';

import { AddEntryButton } from '@/features/home/components/add-entry-button';
import { DaySectionHeader } from '@/features/home/components/day-section-header';
import { DayStrip } from '@/features/home/components/day-strip';
import { HomeHeader } from '@/features/home/components/home-header';
import { SleepWakeCard } from '@/features/home/components/sleep-wake-card';
import { Timeline } from '@/features/home/components/timeline';
import { days, entries } from '@/features/home/data';

export default function HomeScreen() {
  return (
      <View style={styles.container}>
        <HomeHeader
          title="Welcome back"
          subtitle="How are you feeling today?"
          avatarUri="https://picsum.photos/seed/kimbo-profile/120/120"
        />

        <DayStrip days={days} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <DaySectionHeader eyebrow="YOUR DAY" title="Today" />

          <SleepWakeCard
            wakeTime="7:00 AM"
            sleepTime="11:45 PM"
          />

          <Timeline
            startTime="12 PM"
            endTime="12 PM"
            entries={entries}
          />
        </ScrollView>

        <AddEntryButton />
      </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },

  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },

  scrollContent: {
    paddingBottom: 150,
  },
});

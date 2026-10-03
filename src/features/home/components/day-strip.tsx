import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Check, X } from 'lucide-react-native';
import type { DayData } from '../types';

export function DayStrip({ days }: { days: readonly DayData[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayStrip}
    >
      {[...days].reverse().map(day => (
        <DayCard
          key={`${day.day}-${day.date}`}
          {...day}
        />
      ))}
    </ScrollView>
  );
}

function DayCard({
  day,
  date,
  recorded,
  active,
}: DayData) {
  return (
    <Pressable
      style={[
        styles.dayCard,
        active && styles.dayCardActive,
      ]}
    >
      <Text
        style={[
          styles.dayName,
          active && styles.dayNameActive,
        ]}
      >
        {day}
      </Text>

      <Text
        style={[
          styles.dayDate,
          active && styles.dayDateActive,
        ]}
      >
        {date}
      </Text>

      <View
        style={[
          styles.dayStatus,
          recorded
            ? styles.dayStatusRecorded
            : styles.dayStatusEmpty,
        ]}
      >
        {recorded ?<Check size={17} color="#2E9857"/>: <X size={17} color="#D06060"/>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayStrip: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 40,
  },

  dayCard: {
    width: 72,
    minHeight: 106,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayCardActive: {
    borderWidth: 1.5,
    borderColor: '#5856E8',
    backgroundColor: '#F9F8FF',
  },

  dayName: {
    fontSize: 13,
    color: '#797B84',
  },

  dayNameActive: {
    color: '#29283B',
    fontWeight: '600',
  },

  dayDate: {
    marginTop: 5,
    fontSize: 19,
    fontWeight: '700',
    color: '#27282D',
  },

  dayDateActive: {
    color: '#4D4BD8',
  },

  dayStatus: {
    marginTop: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayStatusRecorded: {
    backgroundColor: '#DDF5E5',
  },

  dayStatusEmpty: {
    backgroundColor: '#F7E6E6',
  },

  dayStatusText: {
    fontSize: 17,
    fontWeight: '700',
  },

  dayStatusTextRecorded: {
    color: '#2E9857',
  },

  dayStatusTextEmpty: {
    color: '#D06060',
  },
});

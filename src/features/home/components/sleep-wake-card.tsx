import { StyleSheet, Text, View } from 'react-native';

export function SleepWakeCard({
  wakeTime,
  sleepTime,
  crossesMidnight = false,
}: {
  wakeTime: string;
  sleepTime: string;
  crossesMidnight?: boolean;
}) {
  return (
    <View style={styles.sleepWakeCard}>
      <SleepWakeItem icon="☀" label="Wake up" time={wakeTime} />
      <View style={styles.sleepWakeDivider} />
      <SleepWakeItem icon="☾" label={crossesMidnight ? 'Sleep · next day' : 'Sleep'} time={sleepTime} />
    </View>
  );
}

function SleepWakeItem({
  icon,
  label,
  time,
}: {
  icon: string;
  label: string;
  time: string;
}) {
  return (
    <View style={styles.sleepWakeItem}>
      <View style={styles.sleepWakeIcon}>
        <Text style={styles.sleepWakeEmoji}>{icon}</Text>
      </View>

      <View>
        <Text style={styles.sleepWakeLabel}>{label}</Text>
        <Text style={styles.sleepWakeTime}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sleepWakeCard: {
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECE8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  sleepWakeItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  sleepWakeIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#F3F2EA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sleepWakeEmoji: {
    fontSize: 19,
  },

  sleepWakeLabel: {
    fontSize: 11,
    color: '#8E9098',
  },

  sleepWakeTime: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#25262B',
  },

  sleepWakeDivider: {
    width: 1,
    height: 35,
    marginHorizontal: 12,
    backgroundColor: '#EBEBE8',
  },

  editSleepButton: {
    marginLeft: 8,
    padding: 6,
  },

  editSleepButtonText: {
    color: '#5755D9',
    fontWeight: '600',
    fontSize: 12,
  },
});

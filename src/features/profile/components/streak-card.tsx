import { Flame } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type StreakCardProps = {
  maxStreak: number;
};

export function StreakCard({ maxStreak }: StreakCardProps) {
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakLeft}>
        <View style={styles.streakIcon}>
          <Flame
            size={26}
            color="#F36A21"
          />
        </View>

        <View style={styles.streakCopy}>
          <Text style={styles.streakTitle}>Longest streak</Text>

          <Text style={styles.streakSubtitle}>
            Your personal best
          </Text>
        </View>
      </View>

      <View style={styles.streakNumberContainer}>
        <Text style={styles.streakNumber}>
          {maxStreak}
        </Text>
        <Text style={styles.streakUnit}>days</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    backgroundColor: '#FFF5EC',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFE7D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakCopy: { flex: 1 },
  streakTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#17171A',
  },
  streakSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7C6251',
    marginTop: 3,
  },
  streakNumberContainer: { alignItems: 'center' },
  streakNumber: {
    color: '#B94D13',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    color: '#7C6251',
    fontSize: 12,
    lineHeight: 16,
  },
});

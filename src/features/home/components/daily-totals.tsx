import { StyleSheet, Text, View } from 'react-native';
import type { Home } from '../schema/home-schema';
import { dailySummary } from '../daily-summary';

export function DailyTotals({ summary }: { summary: Home['summary'] }) {
  return <View style={styles.card}>
    <Text style={styles.heading}>Daily totals</Text>
    <View style={styles.grid}>{dailySummary(summary).map(metric => <View key={metric.label} style={styles.metric}>
      <Text style={styles.label}>{metric.label}</Text><Text style={styles.value}>{metric.value}</Text>
    </View>)}</View>
  </View>;
}
const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E7E2', gap: 14 },
  heading: { fontSize: 15, fontWeight: '700', color: '#222329' }, grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  metric: { width: '50%', gap: 5, paddingRight: 8 }, label: { fontSize: 12, color: '#777983' }, value: { fontSize: 18, fontWeight: '600', color: '#222329' },
});

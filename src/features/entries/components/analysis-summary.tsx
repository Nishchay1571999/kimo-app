import { StyleSheet, Text, View } from 'react-native';
import { analysisView, type EntryAnalysis } from '../analysis';

export function AnalysisSummary({ ai, compact = false }: { ai: EntryAnalysis; compact?: boolean }) {
  const { label, text } = analysisView(ai);
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.text} numberOfLines={compact ? 2 : undefined}>{text}</Text>
    {!compact && <Text style={styles.caption}>AI observations are separate from your confirmed facts and nutrition totals.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 5, marginTop: 10 }, label: { color: '#555D8B', fontWeight: '700', fontSize: 12 },
  text: { color: '#676871', fontSize: 13, lineHeight: 19 }, caption: { color: '#777983', fontSize: 12, lineHeight: 18 },
});

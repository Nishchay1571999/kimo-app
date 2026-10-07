import { StyleSheet, Text, View } from 'react-native';
import { analysisPending, type EntryAnalysis } from '../analysis';

/** Shows Kimo's reading of an entry; raw pipeline states live under the entry's details. */
export function AnalysisSummary({ ai, compact = false }: { ai: EntryAnalysis; compact?: boolean }) {
  const synopsis = ai.status === 'completed' ? ai.synopsis?.trim() : null;
  if (!synopsis && !analysisPending(ai)) return null;
  return <View style={styles.container}>
    {!compact && <Text style={styles.label}>Kimo&apos;s analysis</Text>}
    <Text style={[styles.text, !synopsis && styles.pending]} numberOfLines={compact ? 2 : undefined}>{synopsis ?? 'Kimo is reading this entry…'}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 5, marginTop: 10 }, label: { color: '#4D4BD8', fontWeight: '700', fontSize: 12 },
  text: { color: '#52525B', fontSize: 14, lineHeight: 20 }, pending: { fontStyle: 'italic', color: '#777983' },
});

import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DetailsDisclosure, detailStyles } from '@/components/details-disclosure';
import { useTheme } from '@/hooks/use-theme';
import type { ChatSource } from '../schema';

export function ChatSources({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const theme = useTheme();
  if (!sources.length) return null;
  return <View style={styles.sources}><Text style={detailStyles.row}>Based on:</Text>
    {sources.map(source => <View key={source.id}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === source.id }} onPress={() => setExpanded(expanded === source.id ? null : source.id)}>
        <Text style={[styles.sourceTitle, { color: theme.text }]}>{source.title} · {source.origin === 'context' ? 'Included context' : 'Retrieved for this reply'}</Text>
      </Pressable>
      {expanded === source.id && <Text selectable style={[styles.snapshot, { color: theme.textSecondary }]}>{JSON.stringify(source.snapshot, null, 2)}</Text>}
    </View>)}
  </View>;
}
const working = (status: string) => !['completed', 'failed', 'cancelled', 'interrupted'].includes(status);
export function ChatBubble({ role, text, status, sources = [], model, activity }: {
  role: 'user' | 'assistant'; text: string; status: string; sources?: ChatSource[]; model?: string; activity?: string;
}) {
  const theme = useTheme();
  const user = role === 'user';
  const hasDetails = !user && (!!model || sources.length > 0);
  return <View style={[styles.bubble, user ? [styles.user, { backgroundColor: theme.backgroundElement }] : styles.assistant]}>
    {!user && <Text style={[styles.role, { color: theme.textSecondary }]}>Kimo</Text>}
    {text ? <Text selectable style={[styles.text, { color: theme.text }]}>{text}</Text>
      : working(status) ? <View style={styles.typing}><ActivityIndicator size="small" /><Text style={{ color: theme.textSecondary }}>{activity ?? 'Kimo is thinking…'}</Text></View>
      : <Text style={[styles.text, { color: theme.textSecondary }]}>No reply was returned.</Text>}
    {status === 'failed' && <Text style={styles.problem}>This reply did not finish.</Text>}
    {status === 'cancelled' && <Text style={styles.problem}>Reply stopped.</Text>}
    {hasDetails && status === 'completed' && <DetailsDisclosure>
      {model && <Text style={detailStyles.row}>Answered by: {model}</Text>}
      <ChatSources sources={sources} />
    </DetailsDisclosure>}
  </View>;
}
const styles = StyleSheet.create({
  bubble: { borderRadius: 18, padding: 14, gap: 8 },
  user: { alignSelf: 'flex-end', maxWidth: '85%' }, assistant: { alignSelf: 'stretch', paddingHorizontal: 4 },
  role: { fontSize: 12, fontWeight: '600' }, text: { fontSize: 16, lineHeight: 24 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 }, problem: { fontSize: 13, color: '#B91C1C' },
  sources: { gap: 6 }, sourceTitle: { fontSize: 13, paddingVertical: 4 }, snapshot: { fontSize: 12, lineHeight: 18 },
});

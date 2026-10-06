import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { ChatSource } from '../schema';

export function ChatSources({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const theme = useTheme();
  if (!sources.length) return null;
  return <View style={styles.sources}><Text style={{ color: theme.textSecondary }}>Sources saved with this response</Text>
    {sources.map(source => <View key={source.id}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === source.id }} onPress={() => setExpanded(expanded === source.id ? null : source.id)}>
        <Text style={[styles.sourceTitle, { color: theme.text }]}>{source.title} · {source.origin === 'context' ? 'Included context' : 'Retrieved for this reply'}</Text>
      </Pressable>
      {expanded === source.id && <Text selectable style={[styles.snapshot, { color: theme.textSecondary }]}>{JSON.stringify(source.snapshot, null, 2)}</Text>}
    </View>)}
  </View>;
}
export function ChatBubble({ role, text, status, sources = [], model }: { role: 'user' | 'assistant'; text: string; status: string; sources?: ChatSource[]; model?: string }) {
  const theme = useTheme();
  return <View style={[styles.bubble, { backgroundColor: role === 'user' ? theme.backgroundElement : theme.background, borderColor: theme.backgroundSelected }]}>
    <Text style={[styles.role, { color: theme.textSecondary }]}>{role === 'user' ? 'You' : 'Kimo'}</Text>
    <Text selectable style={[styles.text, { color: theme.text }]}>{text || (status === 'completed' ? 'No text returned.' : 'Waiting for a response…')}</Text>
    {status !== 'completed' && <Text style={{ color: theme.textSecondary }}>{status === 'failed' ? 'Response failed' : status === 'cancelled' ? 'Response cancelled' : status}</Text>}
    {model && <Text style={{ color: theme.textSecondary }}>Response model: {model}</Text>}
    <ChatSources sources={sources} />
  </View>;
}
const styles = StyleSheet.create({
  bubble: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 }, role: { fontSize: 12, fontWeight: '600' },
  text: { fontSize: 16, lineHeight: 24 }, sources: { gap: 8, marginTop: 8 }, sourceTitle: { fontSize: 13, paddingVertical: 6 }, snapshot: { fontSize: 12, lineHeight: 18 },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSessionStore } from '@/features/auth/store/session-store';
import { useHome } from '@/features/home/hooks/use-home';
import { chatService, useCreateThread } from '../hooks';
import { useModelPreference } from '../model-preference';
import { ChatScreen } from './chat-screen';
import type { DayGoal } from '@/features/home/schema/home-schema';

const SUGGESTIONS = ['How am I doing today?', 'What should I eat tonight?', 'Why was yesterday high?', 'What should I change this week?'];
function greeting(goal: DayGoal | null | undefined) {
  if (!goal) return { title: 'Ask about your health', body: 'Kimo answers from the meals and exercise you have logged.' };
  const proteinLow = goal.consumed.proteinG < goal.target.proteinG * 0.6 && goal.status !== 'not_logged';
  switch (goal.status) {
    case 'over': return { title: "Today's a little over.", body: `You're ${Math.round(goal.deltaKcal)} kcal above your target. Ask what to do next.` };
    case 'not_logged': return { title: 'Nothing logged yet today.', body: 'Ask for ideas, or log a meal and Kimo will tell you how it fits.' };
    default: return { title: "You're doing well today.", body: proteinLow ? 'You are within your calorie target, although protein is low.' : 'You are within your calorie target so far.' };
  }
}

/** Kimo opens straight into a question: no title, model or Start step. */
export function NewConversation({ prompt }: { prompt?: string }) {
  const creation = useCreateThread();
  const { query } = useHome();
  const accountId = useSessionStore(state => state.account?.id ?? '');
  const preferredModel = useModelPreference(state => state.byAccount[accountId]);
  const [draft, setDraft] = useState('');
  const pending = useRef(false);
  const autoAsked = useRef(false);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const ask = useCallback((text: string) => {
    const question = text.trim();
    if (!question || pending.current) return;
    pending.current = true;
    creation.mutate({ title: question.length > 80 ? `${question.slice(0, 77)}…` : question, ...(preferredModel ? { aiModelId: preferredModel } : {}) }, {
      onSuccess: result => {
        if (focused.current && chatService.isCurrent(result.owner)) router.replace({ pathname: '/chat/[threadId]', params: { threadId: result.thread.id, ask: question } });
      },
      onSettled: () => { pending.current = false; },
    });
  }, [creation, preferredModel]);
  useEffect(() => {
    if (!prompt || autoAsked.current) return;
    autoAsked.current = true;
    ask(prompt);
  }, [prompt, ask]);
  const { title, body } = greeting(query.data?.goal);
  return <ChatScreen value={draft} onChangeText={setDraft} disabled={creation.isPending} onSend={text => { setDraft(''); ask(text); }}>
    {prompt && creation.isPending ? <View style={styles.hero}><Text style={styles.question}>{prompt}</Text><Text style={styles.body}>Kimo is looking at your records…</Text></View> : <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>KIMO</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Text style={styles.section}>Ask about your health</Text>
      <View style={styles.chips}>
        {SUGGESTIONS.map(suggestion => <Pressable key={suggestion} disabled={creation.isPending} onPress={() => ask(suggestion)} accessibilityRole="button"
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}>
          <Text style={styles.chipText}>{suggestion}</Text>
        </Pressable>)}
      </View>
    </>}
    {creation.error && <Text accessibilityRole="alert" style={styles.error}>{creation.error.message} Try again in a moment.</Text>}
  </ChatScreen>;
}
const styles = StyleSheet.create({
  hero: { gap: 8, paddingTop: 12, paddingBottom: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: '#71717A' },
  title: { fontSize: 28, fontWeight: '700', color: '#17171A', letterSpacing: -0.5 },
  question: { fontSize: 20, fontWeight: '600', color: '#17171A' },
  body: { fontSize: 16, lineHeight: 24, color: '#52525B' },
  section: { fontSize: 13, fontWeight: '700', color: '#71717A', marginTop: 8 },
  chips: { gap: 10 },
  chip: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E4E4E7', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 15, color: '#27282D', fontWeight: '500' },
  error: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
});

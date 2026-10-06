import { Redirect, useLocalSearchParams } from 'expo-router';
import { useDemoSession } from '@/context/demo-session';
import { Conversation } from '@/features/chat/components/conversation';
import { useSessionStore } from '@/features/auth/store/session-store';
import { z } from 'zod';
import { DummyScreen } from '@/components/dummy-screen';

export default function Screen() {
  const { session } = useDemoSession();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const epoch = useSessionStore(state => state.epoch);
  if (session.mode !== 'account') return <Redirect href="/(tabs)/ai" />;
  if (!z.uuid().safeParse(threadId).success) return <DummyScreen title="Invalid conversation" description="Open a conversation from History." actions={[{ label: 'New chat', href: '/chat/new' }]} />;
  return <Conversation key={`${epoch}:${threadId}`} id={threadId} />;
}

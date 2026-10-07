import { Redirect, useLocalSearchParams } from 'expo-router';
import { useDemoSession } from '@/context/demo-session';
import { NewConversation } from '@/features/chat/components/new-conversation';
import { useSessionStore } from '@/features/auth/store/session-store';

export default function AskKimoScreen() {
  const { session } = useDemoSession();
  const epoch = useSessionStore(state => state.epoch);
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();

  if (session.mode !== 'account') return <Redirect href="/(tabs)" />;

  return <NewConversation key={`${epoch}:${prompt ?? ''}`} prompt={prompt} />;
}

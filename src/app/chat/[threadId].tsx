import { Redirect, useLocalSearchParams } from 'expo-router';
import { useDemoSession } from '@/context/demo-session';
import { ChatScreen } from '@/features/chat/components/chat-screen';

export default function Screen() {
  const { session } = useDemoSession();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  if (session.mode !== 'account') return <Redirect href="/(tabs)/ai" />;
  return <ChatScreen key={threadId} />;
}

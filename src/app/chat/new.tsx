import { Redirect } from 'expo-router';
import { useDemoSession } from '@/context/demo-session';
import { ChatScreen } from '@/features/chat/components/chat-screen';

export default function NewChatScreen() {
  const { session } = useDemoSession();

  if (session.mode !== 'account') return <Redirect href="/(tabs)" />;

  return <ChatScreen />;
}

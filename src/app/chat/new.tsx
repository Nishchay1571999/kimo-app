import { Redirect } from 'expo-router';
import { useDemoSession } from '@/context/demo-session';
import { NewConversation } from '@/features/chat/components/new-conversation';
import { useSessionStore } from '@/features/auth/store/session-store';

export default function NewChatScreen() {
  const { session } = useDemoSession();
  const epoch = useSessionStore(state => state.epoch);

  if (session.mode !== 'account') return <Redirect href="/(tabs)" />;

  return <NewConversation key={epoch} />;
}

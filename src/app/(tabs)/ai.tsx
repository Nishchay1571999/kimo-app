import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { session } = useDemoSession();
  return (
    <DummyScreen
      bottomSafeArea={false}
      title="AI assistant"
      description="Account gate or conversation list."
      details={[session.mode === 'account' ? 'Sample thread: My monthly progress' : 'Create an account or sign in to use AI.']}
      actions={session.mode === 'account' ? [
  { label: 'Open sample thread', href: { pathname: '/chat/[threadId]', params: { threadId: 'demo-thread' } } },
  { label: 'New conversation', href: { pathname: '/chat/[threadId]', params: { threadId: 'new' } } },
] : [
  { label: 'Create account', href: { pathname: '/(auth)/register', params: { returnTo: 'ai' } } },
  { label: 'Sign in', href: { pathname: '/(auth)/login', params: { returnTo: 'ai' } } },
]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';
import { Redirect } from 'expo-router';

export default function Screen() {
  const { session } = useDemoSession();
  if (session.mode === 'account') return <Redirect href="/chat/new" />;
  return (
    <DummyScreen
      bottomSafeArea={false}
      title="AI assistant"
      description="Start a conversation with Kimo."
      details={['Create an account or sign in to use AI.']}
      actions={[
  { label: 'Create account', href: { pathname: '/(auth)/register', params: { returnTo: 'ai' } } },
  { label: 'Sign in', href: { pathname: '/(auth)/login', params: { returnTo: 'ai' } } },
]}
    />
  );
}

import { router } from 'expo-router';
import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { destinationFor, useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { session, update } = useDemoSession();
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Create account"
      description="Create a demo account or promote your guest session."
      details={['No email or password required for this placeholder.']}
      actions={[
  { label: 'Create / promote account (demo)', onPress: () => {
    const next = { ...session, mode: 'account' as const };
    update(next);
    router.replace(session.onboarded && session.hasGoal && nav.returnTo === 'ai' ? '/(tabs)/ai' : destinationFor(next));
  } },
  { label: 'Sign in instead', href: { pathname: '/(auth)/login', params: { returnTo: nav.returnTo } } },
]}
    />
  );
}

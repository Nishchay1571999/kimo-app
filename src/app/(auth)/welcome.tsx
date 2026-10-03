import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { update } = useDemoSession();
  return (
    <DummyScreen
      title="Welcome to Kimo"
      description="Choose a guest session or a demo account."
      details={['Track meals, activity, and monthly progress.']}
      actions={[
  { label: 'Continue as guest', href: '/(onboarding)/about-you', replace: true, onPress: () => update({ mode: 'guest' }) },
  { label: 'Sign in', href: '/(auth)/login' },
  { label: 'Create account', href: '/(auth)/register' },
]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const nav = useDemoNavigation();
  const { session, reset } = useDemoSession();
  return (
    <DummyScreen
      title="Profile"
      description="Facts, progress, preferences, and account actions."
      details={[`Session: ${session.mode}`, 'Alex · 170 cm · 72 kg', 'Preferences: metric units · system appearance']}
      actions={[
  { label: 'Progress history', href: '/history' },
  { label: 'Current goal', href: nav.withOrigin('/goals/current', 'profile') },
  { label: 'Log weight', href: nav.withOrigin('/weight/new', 'profile') },
  ...(session.mode !== 'account' ? [
    { label: 'Create account', href: '/(auth)/register' as const },
    { label: 'Sign in', href: '/(auth)/login' as const },
  ] : []),
  { label: 'Reset demo / sign out', href: '/(auth)/welcome', replace: true, onPress: reset },
]}
    />
  );
}

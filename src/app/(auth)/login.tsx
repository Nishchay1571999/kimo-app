import { router } from 'expo-router';
import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { update } = useDemoSession();
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Sign in"
      description="Sign in to an existing demo account."
      details={['This demo account already has an onboarded profile and a goal.']}
      actions={[
  { label: 'Sign in (demo)', onPress: () => {
    update({ mode: 'account', onboarded: true, hasGoal: true });
    router.replace(nav.returnTo === 'ai' ? '/(tabs)/ai' : '/(tabs)');
  } },
  { label: 'Create account', href: { pathname: '/(auth)/register', params: { returnTo: nav.returnTo } } },
]}
    />
  );
}

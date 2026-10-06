import { Redirect } from 'expo-router';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { appDestination } from '@/features/auth/store/signup-destination';
import { signupStore, useSignupHydration, useSignupStore } from '@/features/auth/store/signup-store';
import { DummyScreen } from '@/components/dummy-screen';
import { useSessionStore } from '@/features/auth/store/session-store';
import { hasRemoteSuccess } from '@/features/onboarding/store/onboarding-destination';

export default function IndexScreen() {
  const account = useSessionStore((state) => state.account);
  const state = useOnboardingStore((state) => state);
  const hydrated = useOnboardingHydration();
  const signup = useSignupStore((state) => state);
  const signupHydrated = useSignupHydration();
  if (!hydrated || !signupHydrated) return null;
  if (account?.accountStatus === 'guest' && signup.pending) return <Redirect href={appDestination(signup, state)} />;
  if (account) return <Redirect href={account.onboardingCompleted
    ? hasRemoteSuccess(state) ? '/(onboarding)/target' : '/(tabs)'
    : state.hasStarted ? state.step === 'target' ? '/(onboarding)/lifestyle' : `/(onboarding)/${state.step}` : '/(onboarding)/about-you'} />;
  if (signup.storageError) return <DummyScreen
    title="Your signup progress"
    description={signup.storageError}
    actions={[{ label: 'Try again', onPress: () => { void signupStore.persist.rehydrate(); } }]}
  />;
  if (signup.pending) return <Redirect href={appDestination(signup, state)} />;
  if (state.storageError) return <DummyScreen
    title="Your saved progress"
    description={state.storageError}
    actions={[{ label: 'Try again', onPress: () => { void onboardingStore.persist.rehydrate(); } }]}
  />;
  return <Redirect href="/(auth)/welcome" />;
}

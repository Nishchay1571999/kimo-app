import { Redirect } from 'expo-router';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { onboardingDestination } from '@/features/onboarding/store/onboarding-destination';
import { DummyScreen } from '@/components/dummy-screen';

export default function IndexScreen() {
  const state = useOnboardingStore((state) => state);
  const hydrated = useOnboardingHydration();
  if (!hydrated) return null;
  if (state.storageError) return <DummyScreen
    title="Your saved progress"
    description={state.storageError}
    actions={[{ label: 'Try again', onPress: () => { void onboardingStore.persist.rehydrate(); } }]}
  />;
  return <Redirect href={onboardingDestination(state)} />;
}

import { useEffect } from 'react';
import { useStore } from 'zustand';

import { onboardingStorage } from '@/storage/onboarding-storage';
import { createOnboardingTransport } from '../services/onboarding-service';
import { createOnboardingStore, type OnboardingState } from './create-onboarding-store';
import { sessionStore } from '@/features/auth/store/session-store';

export const onboardingStore = createOnboardingStore(
  onboardingStorage,
  createOnboardingTransport(undefined, async () => sessionStore.getState().token),
);

export function useOnboardingStore<T>(selector: (state: OnboardingState) => T) {
  return useStore(onboardingStore, selector);
}

let hydration: Promise<void> | undefined;
export function useOnboardingHydration() {
  const hydrated = useOnboardingStore((state) => state.hydrated);
  useEffect(() => {
    hydration ??= Promise.resolve(onboardingStore.persist.rehydrate());
  }, []);
  return hydrated;
}

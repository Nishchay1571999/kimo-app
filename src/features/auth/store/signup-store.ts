import { useEffect } from 'react';
import { useStore } from 'zustand';

import { authStorage } from '@/storage/auth-storage';
import { createSignupStore, type SignupState } from './create-signup-store';

export const signupStore = createSignupStore(authStorage);

export function useSignupStore<T>(selector: (state: SignupState) => T) {
  return useStore(signupStore, selector);
}

let hydration: Promise<void> | undefined;
export function useSignupHydration() {
  const hydrated = useSignupStore((state) => state.hydrated);
  useEffect(() => {
    hydration ??= Promise.resolve(signupStore.persist.rehydrate());
  }, []);
  return hydrated;
}

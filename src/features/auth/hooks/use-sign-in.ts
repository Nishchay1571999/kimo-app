import { router } from 'expo-router';

import { destinationFor, useDemoSession } from '@/context/demo-session';
import { signupStore } from '@/features/auth/store/signup-store';

export function useSignIn(returnTo?: string, onSuccess?: () => void) {
  const { session, update } = useDemoSession();
  return async () => {
    // Navigation scaffolding until authentication is connected to a service.
    const next = { ...session, mode: 'account' as const };
    if (!await signupStore.getState().finish()) return;
    update(next);
    onSuccess?.();
    router.replace(next.onboarded && next.hasGoal && returnTo === 'ai' ? '/chat/new' : destinationFor(next));
  };
}

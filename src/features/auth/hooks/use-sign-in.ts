import { router } from 'expo-router';

import { useAuthentication } from './use-authentication';
import type { LoginForm } from '../schema/login-schema';

export function useSignIn(returnTo?: string, onSuccess?: () => void) {
  const { signIn } = useAuthentication();
  return async (values: LoginForm) => {
    try {
      const account = await signIn.mutateAsync(values);
      onSuccess?.();
      router.replace(account.onboardingCompleted ? returnTo === 'ai' ? '/chat/new' : '/(tabs)' : '/(onboarding)/about-you');
    } finally { signIn.reset(); }
  };
}

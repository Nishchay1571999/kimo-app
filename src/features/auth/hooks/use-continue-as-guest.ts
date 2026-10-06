import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthentication } from './use-authentication';
import { signupStore } from '../store/signup-store';
import { useIsMutating } from '@tanstack/react-query';

export function useContinueAsGuest() {
  const { guest } = useAuthentication();
  const busy = useIsMutating({ mutationKey: ['auth'] }) > 0 || guest.isPending;
  const [error, setError] = useState<string | null>(null);
  const continueAsGuest = async () => {
    setError(null);
    try {
      await guest.mutateAsync();
      signupStore.getState().cancel();
      router.replace('/');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not continue as guest. Please try again.');
    } finally { guest.reset(); }
  };
  return { continueAsGuest, error, loading: guest.isPending, busy };
}

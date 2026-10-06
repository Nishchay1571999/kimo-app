import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DummyScreen } from '@/components/dummy-screen';
import { queryClient } from '@/lib/query-client';
import { authService } from '../services/auth-service';
import { sessionStore, useSessionStore } from '../store/session-store';
import { onboardingStore } from '@/features/onboarding/store/onboarding-store';
import { signupStore } from '../store/signup-store';

// Remove account-scoped query data without dropping in-flight authentication mutations.
sessionStore.subscribe((state, previous) => {
  if (state.epoch !== previous.epoch) { void queryClient.cancelQueries(); queryClient.removeQueries(); }
});
let hydration: Promise<void> | undefined;

export function SessionProvider({ children }: { children: ReactNode }) {
  const { hydrated, token, account, storageError, epoch } = useSessionStore((state) => state);
  useEffect(() => { hydration ??= sessionStore.getState().hydrate(); }, []);
  const session = useQuery({
    queryKey: ['account', epoch, 'me'], queryFn: ({ signal }) => authService.me(signal),
    enabled: hydrated && !!token && !account && !storageError,
  });
  useEffect(() => { if (token && session.data) sessionStore.getState().confirm(token, session.data); }, [token, session.data]);
  if (!hydrated) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Restoring session" /></View>;
  if (storageError) return <DummyScreen title="Your session" description={storageError} actions={[
    { label: 'Try again', onPress: () => { const state = sessionStore.getState();
      void (state.storageRecovery === 'save' ? state.retrySave() : state.storageRecovery === 'clear' ? state.clear() : state.hydrate()).catch(() => {});
    } },
    { label: 'Sign in again', onPress: () => { void sessionStore.getState().clear(); } },
  ]} />;
  if (token && !account) {
    if (session.isError) return <DummyScreen title="Could not restore your session" description="Check your connection and try again." actions={[
      { label: 'Try again', onPress: () => { void session.refetch(); } },
      { label: 'Sign in again', onPress: () => { void sessionStore.getState().clear(); } },
    ]} />;
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Checking account" /></View>;
  }
  return children;
}

export async function signOut() {
  await sessionStore.getState().clear();
  onboardingStore.getState().reset();
  await signupStore.getState().finish();
}

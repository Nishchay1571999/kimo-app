import { signupStore } from '@/features/auth/store/signup-store';
import { signupDestination } from '@/features/auth/store/signup-destination';
import type { Href } from 'expo-router';
import { onboardingStore } from '@/features/onboarding/store/onboarding-store';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { sessionStore, useSessionStore } from '@/features/auth/store/session-store';

type DemoSession = {
  mode: 'visitor' | 'guest' | 'account';
  step: 'about-you' | 'goal' | 'lifestyle' | 'target';
  onboarded: boolean;
  hasGoal: boolean;
};
const initialSession: DemoSession = {
  mode: 'visitor', step: 'about-you', onboarded: false, hasGoal: false,
};
// Compatibility state for unfinished screens. Identity and completion come from the real session.
const DemoSessionContext = createContext<{
  session: DemoSession;
  update: (changes: Partial<DemoSession>) => void;
  reset: () => void;
} | null>(null);

export function destinationFor(_session: DemoSession): Href {
  const account = sessionStore.getState().account;
  if (account) return account.onboardingCompleted ? '/(tabs)' : '/(onboarding)/about-you';
  const signup = signupDestination(signupStore.getState());
  if (signup) return signup;
  return '/(auth)/welcome';
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const account = useSessionStore((state) => state.account);
  const [session, setSession] = useState(initialSession);
  const restoredSession = {
    ...session,
    mode: account ? account.accountStatus === 'member' ? 'account' as const : 'guest' as const
      : 'visitor' as const,
    onboarded: account?.onboardingCompleted ?? false,
    hasGoal: account?.onboardingCompleted ?? false,
  };
  return (
    <DemoSessionContext.Provider value={{
      session: restoredSession,
      update: (changes) => {
        if (changes.mode && changes.mode !== 'visitor') onboardingStore.getState().setAccessMode(changes.mode);
        setSession((current) => ({ ...current, ...changes }));
      },
      reset: () => {
        void signupStore.getState().finish();
        onboardingStore.getState().reset();
        setSession(initialSession);
      },
    }}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) throw new Error('DemoSessionProvider is required.');
  return context;
}

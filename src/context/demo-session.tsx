import type { Href } from 'expo-router';
import { onboardingStore, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { createContext, useContext, useState, type ReactNode } from 'react';

type DemoSession = {
  mode: 'visitor' | 'guest' | 'account';
  step: 'about-you' | 'goal' | 'lifestyle' | 'target';
  onboarded: boolean;
  hasGoal: boolean;
};
const initialSession: DemoSession = {
  mode: 'visitor', step: 'about-you', onboarded: false, hasGoal: false,
};
// Navigation scaffolding only. Reloading resets demo state; storage/auth comes later.
const DemoSessionContext = createContext<{
  session: DemoSession;
  update: (changes: Partial<DemoSession>) => void;
  reset: () => void;
} | null>(null);

export function destinationFor(session: DemoSession): Href {
  if (onboardingStore.getState().completed) return '/(tabs)';
  if (session.mode === 'visitor') return '/(auth)/welcome';
  if (!session.onboarded) {
    const savedStep = onboardingStore.getState().step;
    return `/(onboarding)/${savedStep === 'about-you' ? session.step : savedStep}`;
  }
  if (!session.hasGoal) return '/goals/edit';
  return '/(tabs)';
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(initialSession);
  const completed = useOnboardingStore((state) => state.completed);
  const started = useOnboardingStore((state) => state.hasStarted);
  const accessMode = useOnboardingStore((state) => state.accessMode);
  const restoredSession = {
    ...session,
    mode: session.mode === 'visitor' && (started || completed) ? accessMode : session.mode,
    onboarded: completed || session.onboarded,
    hasGoal: completed || session.hasGoal,
  };
  return (
    <DemoSessionContext.Provider value={{
      session: restoredSession,
      update: (changes) => {
        if (changes.mode && changes.mode !== 'visitor') onboardingStore.getState().setAccessMode(changes.mode);
        setSession((current) => ({ ...current, ...changes }));
      },
      reset: () => {
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

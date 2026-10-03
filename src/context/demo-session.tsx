import type { Href } from 'expo-router';
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
  if (session.mode === 'visitor') return '/(auth)/welcome';
  if (!session.onboarded) return `/(onboarding)/${session.step}`;
  if (!session.hasGoal) return '/goals/edit';
  return '/(tabs)';
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(initialSession);
  return (
    <DemoSessionContext.Provider value={{
      session,
      update: (changes) => setSession((current) => ({ ...current, ...changes })),
      reset: () => setSession(initialSession),
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

import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Poll only while this route is focused and the app is in the foreground. */
export function useActiveScreen(scope: string) {
  const [activation, setActivation] = useState<{ scope: string; since: number } | null>(null);
  useFocusEffect(useCallback(() => {
    const update = () => setActivation(AppState.currentState === 'active' ? { scope, since: Date.now() } : null);
    update();
    const subscription = AppState.addEventListener('change', update);
    return () => { subscription.remove(); setActivation(null); };
  }, [scope]));
  return activation?.scope === scope ? activation.since : null;
}

import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputError } from '@/components/ui/TextInput';
import { useDemoSession } from '@/context/demo-session';
import { TargetForm } from '@/features/goals/components/target-form';
import { onboardingDestination } from '@/features/onboarding/store/onboarding-destination';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useSessionStore } from '@/features/auth/store/session-store';

export default function Screen() {
  const account = useSessionStore((state) => state.account);
  const hydrated = useOnboardingHydration();
  const state = useOnboardingStore((state) => state);
  const { update } = useDemoSession();
  const destination = onboardingDestination(state);
  const finish = useCallback(() => {
    if (!onboardingStore.getState().complete()) return;
    update({ onboarded: true, hasGoal: true });
    router.replace('/(tabs)');
  }, [update]);

  if (!hydrated) return null;
  if (account && !account.onboardingCompleted) return <Redirect href="/(onboarding)/lifestyle" />;
  if (!state.storageError && destination !== '/(onboarding)/target') return <Redirect href={destination} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.brand}>Kimo</Text>
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.title}>Your daily target</CardTitle>
            <CardDescription style={styles.description}>
              Kimo uses this to tell you how each day is going and what to do next.
            </CardDescription>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {state.storageError
              ? <InputError>{state.storageError}</InputError>
              : <TargetForm confirmLabel="Confirm and continue" onConfirmed={finish} />}
            <Button variant="link" onPress={finish}><ButtonText>Skip for now</ButtonText></Button>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  page: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32, gap: 24 },
  brand: { fontSize: 20, lineHeight: 26, fontWeight: '600', color: '#18181B', textAlign: 'center' },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingVertical: 32, gap: 24 },
  cardHeader: { alignItems: 'center', gap: 12 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', color: '#18181B' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#52525B' },
  cardContent: { gap: 24 },
});

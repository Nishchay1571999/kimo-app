import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputError } from '@/components/ui/TextInput';
import { useDemoSession } from '@/context/demo-session';
import { onboardingDestination } from '@/features/onboarding/store/onboarding-destination';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';

function SuccessCheck() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(150, withTiming(1, { duration: 500, reduceMotion: ReduceMotion.System }), ReduceMotion.System);
  }, [progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));
  return (
    <Animated.View style={[styles.checkCircle, animatedStyle]} accessible accessibilityLabel="Setup successful">
      <View style={styles.checkmark} />
    </Animated.View>
  );
}

export default function Screen() {
  const hydrated = useOnboardingHydration();
  const state = useOnboardingStore((state) => state);
  const { update } = useDemoSession();
  const destination = onboardingDestination(state);

  useFocusEffect(useCallback(() => {
    if (!hydrated || state.storageError || destination !== '/(onboarding)/target') return;
    const timer = setTimeout(() => {
      if (!onboardingStore.getState().complete()) return;
      update({ onboarded: true, hasGoal: true });
      router.replace('/(tabs)');
    }, 4500);
    return () => clearTimeout(timer);
  }, [hydrated, state.storageError, destination, update]));

  if (!hydrated) return null;
  if (!state.storageError && destination !== '/(onboarding)/target') return <Redirect href={destination} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.page}>
        <Text style={styles.brand}>Kimo</Text>
        <Card style={styles.card}>
          <CardContent style={styles.iconArea}><SuccessCheck /></CardContent>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.title}>Welcome to Kimo</CardTitle>
            <CardDescription style={styles.description}>
              Hey, you’re one step closer to managing your health better.
            </CardDescription>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <Text style={styles.body}>
              Your starting point is set. Let’s take this month one meal, one move, and one small win at a time.
            </Text>
            {state.storageError
              ? <InputError>{state.storageError}</InputError>
              : <Text style={styles.nextStep}>Taking you to Home in a moment…</Text>}
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  page: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32, gap: 24 },
  brand: { fontSize: 20, lineHeight: 26, fontWeight: '600', color: '#18181B', textAlign: 'center' },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingVertical: 32, gap: 24 },
  iconArea: { alignItems: 'center' },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  checkmark: { width: 18, height: 32, borderRightWidth: 3, borderBottomWidth: 3, borderColor: '#15803D', transform: [{ rotate: '45deg' }], marginTop: -8 },
  cardHeader: { alignItems: 'center', gap: 12 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', color: '#18181B' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#52525B' },
  cardContent: { gap: 24 },
  body: { fontSize: 14, lineHeight: 22, textAlign: 'center', color: '#71717A' },
  nextStep: { fontSize: 13, lineHeight: 19, textAlign: 'center', color: '#71717A' },
});

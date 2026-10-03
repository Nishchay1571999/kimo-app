import { Stack } from 'expo-router';
import { goalSchema } from '@/features/onboarding/schema/goal-schema';
import { lifestyleSchema } from '@/features/onboarding/schema/lifestyle-schema';
import { hasOnboardingDraft } from '@/features/onboarding/store/onboarding-destination';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';

export default function OnboardingLayout() {
  const state = useOnboardingStore((state) => state);
  const goalReady = goalSchema.safeParse(state.goal).success;
  const lifestyleReady = lifestyleSchema.safeParse(state.lifestyle).success;
  return (
    <Stack>
      <Stack.Protected guard={!hasOnboardingDraft(state)}>
        <Stack.Screen name="about-you" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="goal" options={{ headerShown: false }} />
      <Stack.Protected guard={goalReady}>
        <Stack.Screen name="lifestyle" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={goalReady && lifestyleReady && state.step === 'target'}>
        <Stack.Screen name="target" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { goalSchema } from '@/features/onboarding/schema/goal-schema';
import { lifestyleSchema } from '@/features/onboarding/schema/lifestyle-schema';
import { hasOnboardingDraft } from '@/features/onboarding/store/onboarding-destination';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/Button';
import { useSessionStore } from '@/features/auth/store/session-store';
import { signOut } from '@/features/auth/components/session-provider';

export default function OnboardingLayout() {
  const account = useSessionStore((state) => state.account);
  const state = useOnboardingStore((state) => state);
  const goalReady = goalSchema.safeParse(state.goal).success;
  const lifestyleReady = lifestyleSchema.safeParse(state.lifestyle).success;
  return (
    <View style={{ flex: 1 }}>
      {account && <View style={{ alignItems: 'flex-end', paddingHorizontal: 20 }}>
        <Button variant="link" onPress={() => { void signOut(); }}><ButtonText>Sign out</ButtonText></Button>
      </View>}
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
    </View>
  );
}

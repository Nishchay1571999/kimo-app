import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="about-you" options={{ headerShown: false }} />
      <Stack.Screen name="goal" options={{ headerShown: false }} />
      <Stack.Screen name="lifestyle" options={{ headerShown: false }} />
      <Stack.Screen name="target" options={{ headerShown: false }} />
    </Stack>
  );
}

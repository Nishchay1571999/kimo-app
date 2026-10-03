import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="about-you" options={{ title: 'About you' }} />
      <Stack.Screen name="goal" options={{ title: 'Your intention' }} />
      <Stack.Screen name="lifestyle" options={{ title: 'Lifestyle' }} />
      <Stack.Screen name="target" options={{ title: 'Monthly target' }} />
    </Stack>
  );
}

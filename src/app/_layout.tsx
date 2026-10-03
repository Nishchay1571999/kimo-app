import { useSignupHydration, useSignupStore } from '@/features/auth/store/signup-store';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DemoSessionProvider } from '@/context/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrated = useOnboardingHydration();
  const signupHydrated = useSignupHydration();
  const signupPending = useSignupStore((state) => state.pending);
  const completed = useOnboardingStore((state) => state.completed);
  const accessMode = useOnboardingStore((state) => state.accessMode);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DemoSessionProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
        <AnimatedSplashOverlay />
        {hydrated && signupHydrated && <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Protected guard={signupPending || !completed || accessMode === 'guest'}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!completed}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={completed}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="capture/index" options={{ title: 'Capture' }} />
            <Stack.Screen name="capture/review" options={{ title: 'Review' }} />
            <Stack.Screen name="entries/new-meal" options={{ title: 'New meal' }} />
            <Stack.Screen name="entries/new-exercise" options={{ title: 'New exercise' }} />
            <Stack.Screen name="entries/[entryId]" options={{ title: 'Entry' }} />
            <Stack.Screen name="history/index" options={{ title: 'History' }} />
            <Stack.Screen name="history/day/[date]" options={{ title: 'Day details' }} />
            <Stack.Screen name="goals/current" options={{ title: 'Current goal' }} />
            <Stack.Screen name="goals/edit" options={{ title: 'Edit goal' }} />
            <Stack.Screen name="weight/new" options={{ title: 'Log weight' }} />
            <Stack.Screen name="chat/[threadId]" options={{ title: 'Conversation' }} />
            <Stack.Screen name="chat/new" options={{ title: 'New chat' }} />
          </Stack.Protected>
        </Stack>}
        </SafeAreaView>
      </DemoSessionProvider>
    </ThemeProvider>
  );
}

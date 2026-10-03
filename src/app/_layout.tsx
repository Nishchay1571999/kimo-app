import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DemoSessionProvider } from '@/context/demo-session';
import { useSignupHydration, useSignupStore } from '@/features/auth/store/signup-store';
import { useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
            <Stack.Screen name="capture/index" options={{ headerShown: false }} />
            <Stack.Screen name="capture/review" options={{ headerShown: false }} />
            <Stack.Screen name="entries/new-meal" options={{ headerShown: false }} />
            <Stack.Screen name="entries/new-exercise" options={{ headerShown: false }} />
            <Stack.Screen name="entries/[entryId]" options={{ headerShown: false }} />
            <Stack.Screen name="history/index" options={{ headerShown: false }} />
            <Stack.Screen name="history/day/[date]" options={{ headerShown: false }} />
            <Stack.Screen name="goals/current" options={{ headerShown: false }} />
            <Stack.Screen name="goals/edit" options={{ headerShown: false }} />
            <Stack.Screen name="weight/new" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>}
        </SafeAreaView>
      </DemoSessionProvider>
    </ThemeProvider>
  );
}

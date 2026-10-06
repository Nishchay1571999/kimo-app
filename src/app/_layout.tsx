import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DemoSessionProvider } from '@/context/demo-session';
import { useSignupHydration } from '@/features/auth/store/signup-store';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { SessionProvider } from '@/features/auth/components/session-provider';
import { useSessionStore } from '@/features/auth/store/session-store';
import { hasRemoteSuccess } from '@/features/onboarding/store/onboarding-destination';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return <QueryClientProvider client={queryClient}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SessionProvider><DemoSessionProvider><RootNavigator /></DemoSessionProvider></SessionProvider>
    </ThemeProvider>
  </QueryClientProvider>;
}

function RootNavigator() {
  const hydrated = useOnboardingHydration();
  const signupHydrated = useSignupHydration();
  const account = useSessionStore((state) => state.account);
  const locallyCompleted = useOnboardingStore((state) => state.completed);
  const pendingSuccess = useOnboardingStore(hasRemoteSuccess);
  const showingSuccess = !!account?.onboardingCompleted && pendingSuccess;
  useEffect(() => {
    if (hydrated && account && !account.onboardingCompleted && locallyCompleted) {
      // Retain legacy answers, but a local completion cannot complete a real account.
      onboardingStore.setState({ completed: false, syncMode: 'local', step: 'lifestyle' });
    }
  }, [hydrated, account, locallyCompleted]);
  const completed = !!account?.onboardingCompleted;
  return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
        {hydrated && signupHydrated && <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Protected guard={!account || account.accountStatus === 'guest'}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!!account && (!completed || showingSuccess)}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={completed}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="capture/index" options={{ headerShown: false }} />
            <Stack.Screen name="capture/review" options={{ headerShown: false }} />
            <Stack.Screen name="entries/new-meal" options={{ headerShown: false }} />
            <Stack.Screen name="entries/new-exercise" options={{ headerShown: false }} />
            <Stack.Screen name="entries/new-note" options={{ headerShown: false }} />
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
  );
}

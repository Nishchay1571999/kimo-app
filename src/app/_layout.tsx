import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DemoSessionProvider } from '@/context/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DemoSessionProvider>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
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
        </Stack>
      </DemoSessionProvider>
    </ThemeProvider>
  );
}

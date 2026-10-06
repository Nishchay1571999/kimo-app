import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputError } from '@/components/ui/TextInput';
import { useContinueAsGuest } from '../hooks/use-continue-as-guest';
import { useSignIn } from '@/features/auth/hooks/use-sign-in';
import { signupStore, useSignupStore } from '@/features/auth/store/signup-store';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { SignInForm } from './sign-in-form';

export function SignInScreen({ allowGuest = false }: { allowGuest?: boolean }) {
  const guest = useContinueAsGuest();
  const nav = useDemoNavigation();
  const signIn = useSignIn(nav.returnTo);
  const storageError = useSignupStore((state) => state.storageError);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.brandTitle}>Kimo</Text>
            <Text style={styles.description}>Understand your health, one day at a time.</Text>
          </View>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.title}>Welcome back</CardTitle>
              <CardDescription>Sign in to continue tracking your health.</CardDescription>
            </CardHeader>
            <CardContent>
              {storageError && <InputError>{storageError}</InputError>}
              <SignInForm disabled={guest.busy} onSubmit={signIn} onCreateAccount={() => {
                signupStore.getState().begin(nav.returnTo ?? 'home');
                router.push({ pathname: '/(auth)/register', params: { returnTo: nav.returnTo } });
              }} />
            </CardContent>
          </Card>
        </ScrollView>
        {allowGuest && <View style={styles.bottomArea}>
          {guest.error && <InputError>{guest.error}</InputError>}
          <Button variant="link" loading={guest.loading} disabled={guest.busy} onPress={guest.continueAsGuest}>
            <ButtonText>Continue as guest</ButtonText>
          </Button>
        </View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  page: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 32 },
  brandTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, color: '#18181B' },
  description: { marginTop: 8, fontSize: 15, lineHeight: 22, textAlign: 'center', color: '#71717A' },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { fontSize: 22, lineHeight: 28 },
  bottomArea: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
});

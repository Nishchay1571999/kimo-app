import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/Button';
import { SignInForm } from './sign-in-form';
import { useSignIn } from '@/features/auth/hooks/use-sign-in';
import { signupStore, useSignupStore } from '@/features/auth/store/signup-store';
import { InputError } from '@/components/ui/TextInput';

// Rendered above the tabs in JS; no native modal or action-sheet presentation.
export function AISignInSheet({ onClose }: { onClose: () => void }) {
  const storageError = useSignupStore((state) => state.storageError);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss();
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const signIn = useSignIn('ai', close);

  return (
    <View style={styles.overlay} onAccessibilityEscape={close}>
      <Pressable style={styles.backdrop} onPress={close}
        accessibilityRole="button" accessibilityLabel="Dismiss sign in" />
      <KeyboardAvoidingView style={styles.keyboardView} pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          accessibilityViewIsModal>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <View style={styles.heading}>
              <Text style={styles.title} accessibilityRole="header">Sign in to Kimo</Text>
              <Button variant="ghost" onPress={close} accessibilityLabel="Close sign in">
                <ButtonText>Close</ButtonText>
              </Button>
            </View>
            <Text style={styles.description}>Sign in to start a new chat with your AI assistant.</Text>
            {storageError && <InputError>{storageError}</InputError>}
            <SignInForm onSubmit={signIn} onCreateAccount={() => {
              close();
              signupStore.getState().begin('ai');
              router.push({ pathname: '/(auth)/register', params: { returnTo: 'ai' } });
            }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%', maxWidth: 480, maxHeight: '90%', alignSelf: 'center',
    backgroundColor: '#FAFAFA', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D4D4D8', alignSelf: 'center' },
  content: { padding: 20, gap: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#18181B' },
  description: { fontSize: 15, lineHeight: 22, color: '#71717A' },
});

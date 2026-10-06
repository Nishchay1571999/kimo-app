import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { InputError } from '@/components/ui/TextInput';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/Button';
import { loginSchema, type LoginForm } from '@/features/auth/schema/login-schema';
import { AuthInputField } from './auth-input-field';

export function SignInForm({ onSubmit, onCreateAccount, disabled = false }: {
  onSubmit: (values: LoginForm) => void | Promise<void>;
  onCreateAccount: () => void;
  disabled?: boolean;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submit = async (values: LoginForm) => {
    if (disabled) return;
    setSubmitError(null);
    try { await onSubmit(values); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : 'Could not sign in. Try again.'); }
  };
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  });
  return (
    <View style={styles.form}>
      <AuthInputField control={control} name="email" label="Email" placeholder="you@example.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!isSubmitting && !disabled} />
      <AuthInputField control={control} name="password" label="Password" placeholder="Enter your password"
        secureTextEntry autoCapitalize="none" autoComplete="password" editable={!isSubmitting && !disabled}
        returnKeyType="done" onSubmitEditing={handleSubmit(submit)} />
      {submitError && <InputError>{submitError}</InputError>}
      <Button size="lg" loading={isSubmitting} disabled={isSubmitting || disabled} onPress={handleSubmit(submit)}>
        <ButtonText>{isSubmitting ? 'Signing in...' : 'Sign in'}</ButtonText>
      </Button>
      <Button variant="link" disabled={isSubmitting || disabled} onPress={onCreateAccount}>
        <ButtonText>Create account</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({ form: { gap: 20 } });

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/Button';
import { loginSchema, type LoginForm } from '@/features/auth/schema/login-schema';
import { AuthInputField } from './auth-input-field';

export function SignInForm({ onSubmit, onCreateAccount }: {
  onSubmit: (values: LoginForm) => void | Promise<void>;
  onCreateAccount: () => void;
}) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  });
  return (
    <View style={styles.form}>
      <AuthInputField control={control} name="email" label="Email" placeholder="you@example.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!isSubmitting} />
      <AuthInputField control={control} name="password" label="Password" placeholder="Enter your password"
        secureTextEntry autoCapitalize="none" autoComplete="password" editable={!isSubmitting}
        returnKeyType="done" onSubmitEditing={handleSubmit(onSubmit)} />
      <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        <ButtonText>{isSubmitting ? 'Signing in...' : 'Sign in'}</ButtonText>
      </Button>
      <Button variant="link" disabled={isSubmitting} onPress={onCreateAccount}>
        <ButtonText>Create account</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({ form: { gap: 20 } });

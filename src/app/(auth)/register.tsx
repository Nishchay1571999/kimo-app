import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, ButtonText } from "@/components/ui/Button";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/Card";
import { InputError } from "@/components/ui/TextInput";
import { AuthInputField } from "@/features/auth/components/auth-input-field";
import { signupStore, useSignupStore } from "@/features/auth/store/signup-store";
import { useContinueAsGuest } from '@/features/auth/hooks/use-continue-as-guest';
import {
    registerSchema, type RegisterForm,
} from "@/features/auth/schema/register-schema";
import { useDemoNavigation } from "@/hooks/use-demo-navigation";
import { useAuthentication } from '@/features/auth/hooks/use-authentication';

const fields: {
  name: keyof RegisterForm;
  label: string;
  input: TextInputProps;
}[] = [
  {
    name: "displayName",
    label: "Name",
    input: { placeholder: "Your name", autoCapitalize: "words", autoComplete: "name" },
  },
  {
    name: "email",
    label: "Email",
    input: {
      placeholder: "you@example.com", keyboardType: "email-address",
      autoCapitalize: "none", autoComplete: "email",
    },
  },
  {
    name: "password",
    label: "Password",
    input: {
      placeholder: "At least 7 characters", secureTextEntry: true,
      autoCapitalize: "none", autoComplete: "new-password",
    },
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    input: {
      placeholder: "Re-enter your password", secureTextEntry: true,
      autoCapitalize: "none", autoComplete: "new-password", returnKeyType: "done",
    },
  },
];

export default function Screen() {
  const guest = useContinueAsGuest();
  const { register } = useAuthentication();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nav = useDemoNavigation();
  const draft = useSignupStore((state) => state);
  const returnTo = nav.returnTo ?? draft.returnTo;
  const {
    control,
    handleSubmit,
    subscribe,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: draft.displayName, email: draft.email, password: "", confirmPassword: "" },
  });

  useEffect(() => {
    signupStore.getState().begin(nav.returnTo);
  }, [nav.returnTo]);

  useEffect(() => subscribe({
    name: ["displayName", "email"],
    formState: { values: true },
    callback: ({ values }) => signupStore.getState().saveDraft({
      displayName: values.displayName, email: values.email,
    }),
  }), [subscribe]);

  const onSubmit = async (values: RegisterForm) => {
    if (guest.busy) return;
    setSubmitError(null);
    try {
      const account = await register.mutateAsync(values);
      router.replace(account.onboardingCompleted ? returnTo === 'ai' ? '/chat/new' : '/(tabs)' : '/(onboarding)/about-you');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create your account. Try again.');
    } finally { register.reset(); }
  };

  const signIn = () => {
    signupStore.getState().cancel();
    router.replace({
      pathname: "/(auth)/login",
      params: { returnTo },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.brand}>
                <Text style={styles.brandTitle}>Kimo</Text>
                <Text style={styles.brandDescription}>
                  Understand your health, one day at a time.
                </Text>
              </View>

              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle style={styles.cardTitle}>Create a new account</CardTitle>
                  <CardDescription>
                    Create an account to start tracking your health.
                  </CardDescription>
                </CardHeader>
                <CardContent style={styles.cardContent}>
                  {fields.map(({ name, label, input }) => (
                    <AuthInputField
                      key={name} control={control} name={name} label={label} {...input}
                      editable={!isSubmitting && !guest.busy}
                      onSubmitEditing={name === "confirmPassword" ? handleSubmit(onSubmit) : undefined}
                    />
                  ))}
                  {draft.storageError && <InputError>{draft.storageError}</InputError>}
                  {submitError && <InputError>{submitError}</InputError>}
                  <Button
                    disabled={!!draft.storageError || isSubmitting || guest.busy}
                    size="lg"
                    loading={isSubmitting}
                    onPress={handleSubmit(onSubmit)}
                    style={styles.primaryButton}
                  >
                    <ButtonText>Create Account</ButtonText>
                  </Button>
                </CardContent>
              </Card>
            </View>
          </ScrollView>

          <View style={styles.bottomArea}>
            <Text style={styles.bottomText}>Already have an Account ?</Text>
            <Button variant="link" onPress={signIn} disabled={isSubmitting || guest.busy}>
              <ButtonText>Sign In</ButtonText>
            </Button>
          </View>
          <View style={styles.guestArea}>
            {guest.error && <InputError>{guest.error}</InputError>}
            <Button variant="link" onPress={guest.continueAsGuest} loading={guest.loading} disabled={isSubmitting || guest.busy}>
              <ButtonText>Continue as guest</ButtonText>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  keyboardView: {
    flex: 1,
  },

  page: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  brand: {
    alignItems: "center",
    marginBottom: 32,
  },

  brandTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: "#18181B",
  },

  brandDescription: {
    marginTop: 8,

    fontSize: 15,
    lineHeight: 22,

    textAlign: "center",
    color: "#71717A",
  },

  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },

  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
  },

  cardContent: {
    gap: 20,
  },

  primaryButton: {
    width: "100%",
    marginTop: 4,
  },

  bottomText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#71717A",
  },

  bottomArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  guestArea: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

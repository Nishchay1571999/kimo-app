import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
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
import {
    Input, InputError, InputField, InputLabel,
} from "@/components/ui/TextInput";
import { destinationFor, useDemoSession } from "@/context/demo-session";
import {
    registerSchema, type RegisterForm,
} from "@/features/auth/schema/register-schema";
import { useDemoNavigation } from "@/hooks/use-demo-navigation";

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
      placeholder: "At least 6 characters", secureTextEntry: true,
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
  const { session, update } = useDemoSession();
  const nav = useDemoNavigation();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async () => {
    // Navigation scaffolding until account creation is connected to a service.
    const next = { ...session, mode: "account" as const };
    update(next);
    router.replace(
      next.onboarded && next.hasGoal && nav.returnTo === "ai"
        ? "/(tabs)/ai"
        : destinationFor(next),
    );
  };

  const signIn = () => {
    router.replace({
      pathname: "/(auth)/welcome",
      params: { returnTo: nav.returnTo },
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
                    <Controller
                      key={name}
                      control={control}
                      name={name}
                      render={({ field: { value, onChange, onBlur, ref } }) => (
                        <InputField>
                          <InputLabel>{label}</InputLabel>
                          <Input
                            {...input}
                            ref={ref}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            invalid={!!errors[name]}
                            autoCorrect={false}
                            onSubmitEditing={name === "confirmPassword" ? handleSubmit(onSubmit) : undefined}
                          />
                          {errors[name] && <InputError>{errors[name].message}</InputError>}
                        </InputField>
                      )}
                    />
                  ))}
                  <Button
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
            <Button variant="link" onPress={signIn} disabled={isSubmitting}>
              <ButtonText>Sign In</ButtonText>
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
});

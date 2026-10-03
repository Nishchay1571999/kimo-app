import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";

import { destinationFor, useDemoSession } from "@/context/demo-session";
import { useDemoNavigation } from "@/hooks/use-demo-navigation";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";

import {
    Button,
    ButtonText,
} from "@/components/ui/Button";

import {
    Input,
    InputError,
    InputField,
    InputLabel,
} from "@/components/ui/TextInput";

import {
    loginSchema,
    type LoginForm,
} from "@/features/auth/schema/login-schema";

export default function Screen() {
  const { session, update } = useDemoSession();
  const nav = useDemoNavigation();
  const {
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async () => {
    const next = { ...session, mode: "account" as const };
    update(next);
    router.replace(
      next.onboarded && next.hasGoal && nav.returnTo === "ai"
        ? "/(tabs)/ai"
        : destinationFor(next),
    );
  };

  const createAccount = () => {
    router.push({
      pathname: "/(auth)/register",
      params: { returnTo: nav.returnTo },
    });
  };

  const continueAsGuest = () => {
    update({ mode: "guest", step: "about-you" });
    router.replace("/(onboarding)/about-you");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
                <Text style={styles.brandTitle}>
                  Kimo
                </Text>

                <Text style={styles.brandDescription}>
                  Understand your health, one day at a time.
                </Text>
              </View>

              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle style={styles.cardTitle}>
                    Welcome back
                  </CardTitle>

                  <CardDescription>
                    Sign in to continue tracking your health.
                  </CardDescription>
                </CardHeader>

                <CardContent style={styles.cardContent}>
                  <Controller
                    control={control}
                    name="email"
                    render={({
                      field: {
                        value,
                        onChange,
                        onBlur,
                        ref,
                      },
                    }) => (
                      <InputField>
                        <InputLabel>
                          Email
                        </InputLabel>

                        <Input
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          invalid={!!errors.email}
                          placeholder="you@example.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="email"
                        />

                        {errors.email && (
                          <InputError>
                            {errors.email.message}
                          </InputError>
                        )}
                      </InputField>
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({
                      field: {
                        value,
                        onChange,
                        onBlur,
                        ref,
                      },
                    }) => (
                      <InputField>
                        <InputLabel>
                          Password
                        </InputLabel>

                        <Input
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          invalid={!!errors.password}
                          placeholder="Enter your password"
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="password"
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(onSubmit)}
                        />

                        {errors.password && (
                          <InputError>
                            {errors.password.message}
                          </InputError>
                        )}
                      </InputField>
                    )}
                  />

                  <Button
                    size="lg"
                    loading={isSubmitting}
                    onPress={handleSubmit(onSubmit)}
                    style={styles.primaryButton}
                  >
                    <ButtonText>
                      {isSubmitting
                        ? "Signing in..."
                        : "Sign in"}
                    </ButtonText>
                  </Button>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />

                    <Text style={styles.dividerText}>
                      or
                    </Text>

                    <View style={styles.dividerLine} />
                  </View>

                  <Button
                    variant="outline"
                    size="lg"
                    onPress={createAccount}
                    style={styles.secondaryButton}
                  >
                    <ButtonText>
                      Create a new account
                    </ButtonText>
                  </Button>
                </CardContent>
              </Card>
            </View>
          </ScrollView>

          <View style={styles.bottomArea}>
            <Button
              variant="link"
              onPress={continueAsGuest}
            >
              <ButtonText>
                Continue as guest
              </ButtonText>
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
    paddingVertical: 32,
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

  secondaryButton: {
    width: "100%",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E4E4E7",
  },

  dividerText: {
    fontSize: 13,
    color: "#A1A1AA",
  },

  bottomArea: {
    alignItems: "center",

    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

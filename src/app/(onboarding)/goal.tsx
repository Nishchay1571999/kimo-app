import { Controller } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Slider } from '@/components/ui/Slider';
import { Input, InputDescription, InputError, InputField, InputLabel } from '@/components/ui/TextInput';
import { useGoalForm } from '@/features/onboarding/hooks/use-goal-form';

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unspecified', label: 'Prefer not to say' },
];
const intentions = [
  { value: 'lose', label: 'Lose weight', description: 'Track a decrease from your starting weight.' },
  { value: 'maintain', label: 'Maintain weight', description: 'Focus on keeping your weight steady.' },
  { value: 'gain', label: 'Gain weight', description: 'Track an increase from your starting weight.' },
];

export default function Screen() {
  const { control, errors, onSubmit, error, loading } = useGoalForm();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.step}>Step 2 of 4</Text>
            <Text style={styles.title}>Make this month yours</Text>
            <Text style={styles.description}>
              Start with where you are today, then choose the direction you want to take.
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>Your starting point</CardTitle>
              <CardDescription>
                These details give your monthly progress a baseline. You can review your target before confirming it.
              </CardDescription>
            </CardHeader>
            <CardContent style={styles.fields}>
              <Controller control={control} name="age" render={({ field: { value, onChange, onBlur } }) => (
                <InputField>
                  <View style={styles.labelRow}>
                    <InputLabel>Age</InputLabel>
                    <Text style={styles.ageValue}>{value} years</Text>
                  </View>
                  <Slider min={18} max={72} step={1} value={value} disabled={loading} onValueChange={onChange} onValueCommit={onBlur} accessibilityLabel="Age in years" />
                  <View style={styles.labelRow}>
                    <Text style={styles.rangeLabel}>18 years</Text>
                    <Text style={styles.rangeLabel}>72 years</Text>
                  </View>
                  <InputDescription>Slide to your age. Goal setup is designed for adults.</InputDescription>
                  {errors.age && <InputError>{errors.age.message}</InputError>}
                </InputField>
              )} />

              <Controller control={control} name="gender" render={({ field: { value, onChange, onBlur } }) => (
                <InputField>
                  <InputLabel>Gender</InputLabel>
                  <InputDescription>Choose what describes you, or prefer not to say.</InputDescription>
                  <RadioGroup value={value} disabled={loading} onValueChange={onChange} onBlur={onBlur} accessibilityLabel="Gender">
                    {genders.map((option) => <RadioGroupItem key={option.value} {...option} />)}
                  </RadioGroup>
                  {errors.gender && <InputError>{errors.gender.message}</InputError>}
                </InputField>
              )} />

              <View style={styles.measurements}>
                <Text style={styles.measurementsTitle}>How tall are you?</Text>
                <Text style={styles.description}>Enter feet and any extra inches. Whole feet are fine too.</Text>
                <View style={styles.heightRow}>
                  <View style={styles.heightField}>
                    <Controller control={control} name="feet" render={({ field: { value, onChange, onBlur, ref } }) => (
                      <InputField>
                        <InputLabel>Feet</InputLabel>
                        <Input ref={ref} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="e.g. 5" keyboardType="number-pad" autoCorrect={false} editable={!loading} invalid={!!errors.feet} accessibilityLabel="Height in feet" />
                        {errors.feet && <InputError>{errors.feet.message}</InputError>}
                      </InputField>
                    )} />
                  </View>
                  <View style={styles.heightField}>
                    <Controller control={control} name="inches" render={({ field: { value, onChange, onBlur, ref } }) => (
                      <InputField>
                        <InputLabel>Inches (optional)</InputLabel>
                        <Input ref={ref} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="00" keyboardType="number-pad" autoCorrect={false} editable={!loading} invalid={!!errors.inches} accessibilityLabel="Additional height in inches, optional" />
                        {errors.inches && <InputError>{errors.inches.message}</InputError>}
                      </InputField>
                    )} />
                  </View>
                </View>
                <InputDescription>Leave inches as 00 or blank, or enter 1–11.</InputDescription>
              </View>

              <Controller control={control} name="weight" render={({ field: { value, onChange, onBlur, ref } }) => (
                <InputField>
                  <InputLabel>Current weight (kg)</InputLabel>
                  <Input ref={ref} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="e.g. 72.5" keyboardType="decimal-pad" autoCorrect={false} editable={!loading} invalid={!!errors.weight} accessibilityLabel="Current weight in kilograms" />
                  <InputDescription>This is the weight your monthly progress will start from.</InputDescription>
                  {errors.weight && <InputError>{errors.weight.message}</InputError>}
                </InputField>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>What would you like to work toward?</CardTitle>
              <CardDescription>
                Pick a direction for this month. Maintaining your weight is a goal too.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller control={control} name="intention" render={({ field: { value, onChange, onBlur } }) => (
                <InputField>
                  <RadioGroup value={value} disabled={loading} onValueChange={onChange} onBlur={onBlur} accessibilityLabel="Monthly weight goal">
                    {intentions.map((option) => <RadioGroupItem key={option.value} {...option} />)}
                  </RadioGroup>
                  {errors.intention && <InputError>{errors.intention.message}</InputError>}
                </InputField>
              )} />
            </CardContent>
          </Card>

          <View style={styles.footer}>
            {error && <InputError>{error}</InputError>}
            <Button size="lg" loading={loading} onPress={onSubmit}>
              <ButtonText>Continue</ButtonText>
            </Button>
            <Text style={styles.nextStep}>Next: your activity level and lifestyle</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  page: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 32, gap: 24 },
  header: { gap: 8 },
  step: { fontSize: 14, lineHeight: 20, color: '#71717A' },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8, color: '#18181B' },
  description: { fontSize: 14, lineHeight: 21, color: '#71717A' },
  cardTitle: { fontSize: 20, lineHeight: 26 },
  fields: { gap: 28 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ageValue: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#18181B' },
  rangeLabel: { fontSize: 12, lineHeight: 18, color: '#71717A' },
  measurements: { gap: 10 },
  measurementsTitle: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: '#111827' },
  heightRow: { flexDirection: 'row', gap: 12 },
  heightField: { flex: 1 },
  footer: { gap: 12 },
  nextStep: { textAlign: 'center', fontSize: 13, lineHeight: 19, color: '#71717A' },
});

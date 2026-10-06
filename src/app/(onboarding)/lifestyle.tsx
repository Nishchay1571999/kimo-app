import { Controller } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Input, InputLabel, InputError, InputField } from '@/components/ui/TextInput';
import { useLifestyleForm } from '@/features/onboarding/hooks/use-lifestyle-form';

const questions: {
  name: 'healthyEating' | 'exerciseFrequency';
  title: string;
  description: string;
  options: { value: string; label: string; description: string }[];
}[] = [
  {
    name: 'healthyEating',
    title: 'How regularly do you eat healthy?',
    description: 'Think about a typical week. Your snack drawer won’t be called as a witness.',
    options: [
      {
        value: 'not-so-much', label: 'Not so much',
        description: 'I’m trying to change. The vegetables and I are still getting acquainted.',
      },
      {
        value: 'most-of-the-time', label: 'Most of the time',
        description: 'Sometimes I cheat, and I find it fun. Pizza has excellent negotiation skills.',
      },
      {
        value: 'every-time', label: 'Every time',
        description: 'I’m insanely cautious about what I put into my body. My grocery cart has a dress code.',
      },
    ],
  },
  {
    name: 'exerciseFrequency',
    title: 'How regularly do you exercise?',
    description: 'Choose your usual routine. Chasing the delivery driver is a memorable exception.',
    options: [
      {
        value: 'never', label: 'Never',
        description: 'My running shoes are enjoying a very long vacation.',
      },
      {
        value: 'once-or-twice', label: 'Once or twice a week',
        description: 'I show up, break a sweat, and give my sofa time to miss me.',
      },
      {
        value: 'four-to-five-plus', label: 'At least 4–5 times a week',
        description: 'My gym bag gets out of the house more than my fancy clothes.',
      },
    ],
  },
];

export default function Screen() {
  const { control, errors, onSubmit, error, loading } = useLifestyleForm();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 4</Text>
          <Text style={styles.title}>Your everyday rhythm</Text>
          <Text style={styles.description}>
            Tell us about your habits and usual wake and sleep times.
          </Text>
        </View>

        {questions.map(({ name, title, description, options }) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name={name}
                render={({ field: { value, onChange, onBlur } }) => (
                  <InputField>
                    <RadioGroup
                      value={value}
                      onValueChange={onChange}
                      onBlur={onBlur}
                      disabled={loading}
                      accessibilityLabel={title}
                    >
                      {options.map((option) => <RadioGroupItem key={option.value} {...option} />)}
                    </RadioGroup>
                    {errors[name] && <InputError>{errors[name].message}</InputError>}
                  </InputField>
                )}
              />
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>Your daily schedule</CardTitle>
            <CardDescription>Use 24-hour times in your account’s timezone. These times are fixed after setup.</CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 16 }}>
            {(['wakeTime', 'sleepTime'] as const).map((name) => <Controller key={name} control={control} name={name}
              render={({ field: { value, onChange, onBlur } }) => <InputField>
                <InputLabel>{name === 'wakeTime' ? 'Wake time' : 'Sleep time'}</InputLabel>
                <Input value={value ?? ''} onChangeText={onChange} onBlur={onBlur}
                  placeholder={name === 'wakeTime' ? '07:00' : '23:00'} maxLength={5}
                  autoCapitalize="none" editable={!loading} invalid={!!errors[name]}
                  accessibilityLabel={name === 'wakeTime' ? 'Wake time in 24-hour format' : 'Sleep time in 24-hour format'} />
                {errors[name] && <InputError>{errors[name].message}</InputError>}
              </InputField>} />)}
          </CardContent>
        </Card>

        <Text style={styles.note}>
          Choose what fits you today. Small changes still deserve a spot on the calendar.
        </Text>
        <View style={styles.footer}>
            {error && <InputError>{error}</InputError>}
          <Button size="lg" loading={loading} disabled={loading} onPress={onSubmit}>
            <ButtonText>Continue</ButtonText>
          </Button>
          <Text style={styles.nextStep}>Next: finish setup</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  content: {
    flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 32, gap: 24,
  },
  header: { gap: 8 },
  step: { fontSize: 14, lineHeight: 20, color: '#71717A' },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8, color: '#18181B' },
  description: { fontSize: 14, lineHeight: 21, color: '#71717A' },
  cardTitle: { fontSize: 20, lineHeight: 26 },
  note: { fontSize: 14, lineHeight: 21, color: '#52525B', paddingHorizontal: 4 },
  footer: { gap: 12, marginTop: 'auto', paddingTop: 8 },
  nextStep: { fontSize: 13, lineHeight: 19, color: '#71717A', textAlign: 'center' },
});

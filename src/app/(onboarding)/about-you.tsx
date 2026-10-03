import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Button, ButtonText } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDemoSession } from '@/context/demo-session';
import { cn } from '@/utils/lib';

export default function Screen() {
  const { update } = useDemoSession();

  const continueToGoal = () => {
    update({ step: 'goal' });
    router.push('/(onboarding)/goal');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Kimo</Text>
          <Text style={styles.title}>About you</Text>
          <Text style={styles.description}>
            Every monthly goal needs a starting point. Let’s get to know yours.
          </Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>A few details, a clearer goal</CardTitle>
            <CardDescription>
              On the next pages, we’ll ask for your name, age, height, and current weight.
              Here’s why each detail matters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion defaultValue="profile">
              <AccordionItem value="profile">
                <AccordionTrigger>Your name and age</AccordionTrigger>
                <AccordionContent>
                  <Text style={styles.body}>
                    Your name makes your profile and progress updates personal. Your age
                    confirms that you can use our goal setup for adults.
                  </Text>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="measurements">
                <AccordionTrigger>Your height and current weight</AccordionTrigger>
                <AccordionContent>
                  <Text style={styles.body}>
                    We’ll ask for height in centimeters and weight in kilograms. Height
                    adds context to your measurements. Your current weight becomes the
                    starting point for tracking changes during the month.
                  </Text>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="goal" style={styles.lastItem}>
                <AccordionTrigger>Your monthly goal</AccordionTrigger>
                <AccordionContent>
                  <Text style={styles.body}>
                    After your details, you’ll choose whether to lose, maintain, or gain
                    weight and tell us about your activity level. You’ll review your
                    monthly target before confirming it.
                  </Text>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card style={cn<ViewStyle>(styles.card, styles.progressCard)}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>See your month take shape</CardTitle>
            <CardDescription>
              Your starting weight gives you a baseline. As you log weight, meals, and
              exercise, your progress shows what changes over the month.
            </CardDescription>
          </CardHeader>
          <CardContent style={styles.progressContent}>
            <Text style={styles.body}>Compare your latest weight with where you started.</Text>
            <Text style={styles.body}>Follow days logged, average logged calories, and activity totals.</Text>
            <Text style={styles.note}>
              Days without a meal log are left out of your calorie average.
            </Text>
          </CardContent>
        </Card>

        <View style={styles.footer}>
          <Button size="lg" style={styles.continueButton} onPress={continueToGoal}>
            <ButtonText>Continue</ButtonText>
          </Button>
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
  header: { gap: 10 },
  brand: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: '#18181B', marginBottom: 8 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, color: '#18181B' },
  description: { fontSize: 15, lineHeight: 22, color: '#71717A' },
  card: { width: '100%', shadowOpacity: 0, elevation: 0 },
  cardTitle: { fontSize: 20, lineHeight: 26 },
  lastItem: { borderBottomWidth: 0 },
  body: { fontSize: 14, lineHeight: 21, color: '#52525B' },
  progressCard: { backgroundColor: '#F4F4F5', gap: 16 },
  progressContent: { gap: 12 },
  note: { fontSize: 13, lineHeight: 19, color: '#71717A' },
  footer: { gap: 12, marginTop: 'auto', paddingTop: 8 },
  continueButton: { width: '100%' },
  nextStep: { fontSize: 13, lineHeight: 18, color: '#71717A', textAlign: 'center' },
});

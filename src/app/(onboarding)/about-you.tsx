import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { update } = useDemoSession();
  return (
    <DummyScreen
      title="About you"
      description="Personal facts and measurements will go here."
      details={["Step 1 of 4 \u00b7 Alex \u00b7 28 years \u00b7 170 cm \u00b7 72 kg"]}
      actions={[{ label: "Continue", href: '/(onboarding)/goal', onPress: () => update({ step: 'goal' }) }]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { update } = useDemoSession();
  return (
    <DummyScreen
      title="Lifestyle"
      description="Activity level and dietary context will go here."
      details={["Step 3 of 4 \u00b7 Moderately active \u00b7 No dietary restrictions"]}
      actions={[{ label: "Continue", href: '/(onboarding)/target', onPress: () => update({ step: 'target' }) }]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { update } = useDemoSession();
  return (
    <DummyScreen
      title="Your intention"
      description="Choose lose, maintain, or gain."
      details={["Step 2 of 4"]}
      actions={[{ label: "Lose", href: '/(onboarding)/lifestyle', onPress: () => update({ step: 'lifestyle' }) },
{ label: "Maintain", href: '/(onboarding)/lifestyle', onPress: () => update({ step: 'lifestyle' }) },
{ label: "Gain", href: '/(onboarding)/lifestyle', onPress: () => update({ step: 'lifestyle' }) }]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const { update } = useDemoSession();
  return (
    <DummyScreen
      title="Monthly target"
      description="Review and confirm your proposed monthly target."
      details={['Step 4 of 4 · Example: maintain 72 kg this month']}
      actions={[
  { label: 'Confirm target', href: '/(tabs)', replace: true, onPress: () => update({ onboarded: true, hasGoal: true }) },
  { label: 'Review intention', href: '/(onboarding)/goal' },
]}
    />
  );
}

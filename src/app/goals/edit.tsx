import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const nav = useDemoNavigation();
  const { update } = useDemoSession();
  return (
    <DummyScreen
      title="Edit goal"
      description="Create or revise the current goal."
      details={['Intention and monthly target fields will go here.']}
      actions={[
  { label: 'Save sample goal', href: nav.backToOrigin, replace: true, onPress: () => update({ hasGoal: true }) },
  { label: 'Cancel', href: nav.backToOrigin, replace: true },
]}
    />
  );
}

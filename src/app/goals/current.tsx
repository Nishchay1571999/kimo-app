import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Current monthly goal"
      description="Inspect the current month\u2019s target."
      details={['Example: maintain 72 kg this month']}
      actions={[
  { label: 'Edit goal', href: nav.withOrigin('/goals/edit') },
  { label: 'Return', href: nav.backToOrigin, replace: true },
  { label: 'Home', href: '/(tabs)', replace: true },
  { label: 'Profile', href: '/(tabs)/profile', replace: true },
]}
    />
  );
}

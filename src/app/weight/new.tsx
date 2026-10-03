import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Log weight"
      description="Add a dated weight record."
      details={['Sample weight: 72 kg', `Date: ${nav.date}`]}
      actions={[
  { label: 'Save sample weight', href: nav.backToOrigin, replace: true },
  { label: 'Cancel', href: nav.backToOrigin, replace: true },
]}
    />
  );
}

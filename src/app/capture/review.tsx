import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Review analysis"
      description="Confirm an analysis draft."
      details={['Sample analysis: rice bowl · 520 kcal', `Date: ${nav.date}`]}
      actions={[
  { label: 'Confirm sample entry', href: nav.entry, replace: true },
  { label: 'Correct manually', href: nav.withOrigin('/entries/new-meal') },
  { label: 'Discard', href: nav.backToOrigin, replace: true },
]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="New meal"
      description="Manual meal draft fields will go here."
      details={["Rice bowl \u00b7 520 kcal", `Date: ${nav.date}`]}
      actions={[
  { label: 'Save sample entry', href: { pathname: '/entries/[entryId]', params: { entryId: 'demo-meal', date: nav.date, origin: nav.origin } }, replace: true },
  { label: 'Cancel', href: nav.backToOrigin, replace: true },
]}
    />
  );
}

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="New exercise"
      description="Manual exercise draft fields will go here."
      details={["Walking \u00b7 30 minutes", `Date: ${nav.date}`]}
      actions={[
  { label: 'Save sample entry', href: { pathname: '/entries/[entryId]', params: { entryId: 'demo-exercise', date: nav.date, origin: nav.origin } }, replace: true },
  { label: 'Cancel', href: nav.backToOrigin, replace: true },
]}
    />
  );
}

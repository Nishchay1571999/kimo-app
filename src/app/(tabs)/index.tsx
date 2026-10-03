import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      bottomSafeArea={false}
      title="Today"
      description="Your daily summary and logged entries."
      details={[nav.date, 'Sample totals: 1,240 kcal · 30 minutes activity', 'Sample meal: rice bowl · 520 kcal']}
      actions={[
  { label: 'Capture a meal', href: nav.withOrigin('/capture', 'home') },
  { label: 'Manual meal', href: nav.withOrigin('/entries/new-meal', 'home') },
  { label: 'Manual exercise', href: nav.withOrigin('/entries/new-exercise', 'home') },
  { label: 'Open sample entry', href: nav.entry },
  { label: 'Current goal', href: nav.withOrigin('/goals/current', 'home') },
  { label: 'View today', href: nav.day },
  { label: 'Select another date', href: '/history' },
]}
    />
  );
}

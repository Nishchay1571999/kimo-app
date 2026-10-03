import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Day details"
      description="Records and totals for the selected date."
      details={[`Date: ${nav.date}`, 'Sample totals: 1,240 kcal · 30 minutes activity']}
      actions={[
  { label: 'Open sample entry', href: { pathname: '/entries/[entryId]', params: { entryId: 'demo-meal', date: nav.date, origin: 'day' } } },
  { label: 'Capture', href: nav.withOrigin('/capture', 'day') },
  { label: 'Manual meal', href: nav.withOrigin('/entries/new-meal', 'day') },
  { label: 'Manual exercise', href: nav.withOrigin('/entries/new-exercise', 'day') },
  { label: 'Back to history', href: '/history', replace: true },
]}
    />
  );
}

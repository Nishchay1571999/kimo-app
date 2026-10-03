import { useState } from 'react';
import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  const [period, setPeriod] = useState('weekly');
  return (
    <DummyScreen
      title="History"
      description="Select a weekly or monthly period."
      details={[`Period: ${period}`]}
      actions={[
  { label: 'Weekly', onPress: () => setPeriod('weekly') },
  { label: 'Monthly', onPress: () => setPeriod('monthly') },
  { label: 'Open today', href: nav.day },
  { label: 'Open sample date', href: { pathname: '/history/day/[date]', params: { date: '2026-10-01' } } },
  { label: 'Goal details', href: nav.withOrigin('/goals/current', 'history') },
]}
    />
  );
}

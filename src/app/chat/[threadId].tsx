import { useState } from 'react';
import { Redirect } from 'expo-router';
import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { useDemoSession } from '@/context/demo-session';

export default function Screen() {
  const nav = useDemoNavigation();
  const { session } = useDemoSession();
  const [model, setModel] = useState('Fast');
  if (session.mode !== 'account') return <Redirect href="/(tabs)/ai" />;
  return (
    <DummyScreen
      title="Conversation"
      description="Messages and model preference will go here."
      details={[`Thread: ${nav.threadId}`, `Model: ${model}`, 'Sample assistant: How can I help with your progress?']}
      actions={[
  { label: 'Fast model (demo)', onPress: () => setModel('Fast') },
  { label: 'Reasoning model (demo)', onPress: () => setModel('Reasoning') },
  { label: 'Back to AI threads', href: '/(tabs)/ai', replace: true },
]}
    />
  );
}

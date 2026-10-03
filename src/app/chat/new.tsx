import { Redirect } from 'expo-router';
import { useState } from 'react';

import { DummyScreen } from '@/components/dummy-screen';
import { useDemoSession } from '@/context/demo-session';

export default function NewChatScreen() {
  const { session } = useDemoSession();
  const [model, setModel] = useState('Fast');

  if (session.mode !== 'account') return <Redirect href="/(tabs)" />;

  return (
    <DummyScreen
      title="New chat"
      description="Start a new conversation with Kimo."
      details={[`Model: ${model}`, 'How can I help with your progress?']}
      actions={[
        { label: 'Fast model (demo)', onPress: () => setModel('Fast') },
        { label: 'Reasoning model (demo)', onPress: () => setModel('Reasoning') },
        { label: 'View threads', href: '/(tabs)/ai', replace: true },
      ]}
    />
  );
}

import { useState } from 'react';
import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  const [editing, setEditing] = useState(false);
  return (
    <DummyScreen
      title="Entry details"
      description="Read, edit, or delete an owned entry."
      details={[`Entry: ${nav.entryId}`, `Date: ${nav.date}`, editing ? 'Editing fields will go here.' : 'Viewing sample entry.']}
      actions={[
  { label: editing ? 'Save edits (demo)' : 'Edit (demo)', onPress: () => setEditing(!editing) },
  { label: 'Delete (demo)', href: nav.origin === 'home' ? '/(tabs)' : nav.day, replace: true },
  { label: 'Back to originating day', href: nav.origin === 'home' ? '/(tabs)' : nav.day, replace: true },
]}
    />
  );
}

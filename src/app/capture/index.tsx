import { DummyScreen } from '@/components/dummy-screen';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

export default function Screen() {
  const nav = useDemoNavigation();
  return (
    <DummyScreen
      title="Capture"
      description="Choose camera, gallery, or manual logging."
      details={['Camera and gallery open a sample analysis draft.']}
      actions={[
  { label: 'Camera (demo)', href: nav.withOrigin('/capture/review') },
  { label: 'Gallery (demo)', href: nav.withOrigin('/capture/review') },
  { label: 'Manual meal', href: nav.withOrigin('/entries/new-meal') },
  { label: 'Manual exercise', href: nav.withOrigin('/entries/new-exercise') },
  { label: 'Cancel', href: nav.backToOrigin, replace: true },
]}
    />
  );
}

import { router } from 'expo-router';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { TargetForm } from '@/features/goals/components/target-form';
import { UploadPage } from '@/features/upload/components/shared';

export default function Screen() {
  const nav = useDemoNavigation();
  const close = () => router.replace(nav.backToOrigin);
  return <UploadPage eyebrow="YOUR GOAL" title="Daily target" subtitle="Kimo compares each day with this target to tell you how you're doing and what to change." onClose={close}>
    <TargetForm confirmLabel="Save target" onConfirmed={close} />
  </UploadPage>;
}

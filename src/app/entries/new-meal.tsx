import { Redirect } from 'expo-router';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';

/** Meals and workouts are entered on the capture screen; this keeps old links working. */
export default function NewMealRedirect() {
  const nav = useDemoNavigation();
  return <Redirect href={nav.withOrigin('/capture')} />;
}

import { Redirect } from 'expo-router';
import { destinationFor, useDemoSession } from '@/context/demo-session';

export default function IndexScreen() {
  const { session } = useDemoSession();
  return <Redirect href={destinationFor(session)} />;
}

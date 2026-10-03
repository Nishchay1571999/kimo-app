import type { GoalForm } from '../schema/goal-schema';
import type { LifestyleForm } from '../schema/lifestyle-schema';

export type OnboardingPayload = { goal: GoalForm; lifestyle: LifestyleForm };
export type OnboardingTransport = (payload: OnboardingPayload) => Promise<'local' | 'remote'>;

export function createOnboardingTransport(endpoint?: string, getToken?: () => Promise<string | null>): OnboardingTransport {
  return async (payload) => {
    // Local development remains usable until the backend endpoint is supplied.
    if (!endpoint) return 'local';
    const token = await getToken?.();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Could not save your onboarding. Your answers are kept on this device. Try again.');
      return 'remote';
    } finally {
      clearTimeout(timeout);
    }
  };
}

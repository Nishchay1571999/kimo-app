import type { GoalForm } from '../schema/goal-schema';
import type { LifestyleForm } from '../schema/lifestyle-schema';
import { createApiClient } from '../../../lib/api/client';
import type { AxiosAdapter } from 'axios';

export type OnboardingPayload = { goal: GoalForm; lifestyle: LifestyleForm };
export type OnboardingTransport = (payload: OnboardingPayload) => Promise<'local' | 'remote'>;

export function createOnboardingTransport(endpoint?: string, getToken?: () => Promise<string | null>, adapter?: AxiosAdapter): OnboardingTransport {
  return async (payload) => {
    const token = await getToken?.();
    // Local development remains usable until the backend endpoint is supplied.
    // Authenticated members must never receive a local-only completion.
    if (!endpoint && token) throw new Error('Onboarding is unavailable. Please try again later.');
    if (!endpoint) return 'local';
    const client = createApiClient(endpoint, {
      getIdentity: () => ({ token: token ?? null, epoch: 0 }),
      unauthorized: () => {}, onboardingRequired: () => {},
    }, adapter);
    await client.request('', { method: 'POST', body: payload, authenticated: !!token });
    return 'remote';
  };
}

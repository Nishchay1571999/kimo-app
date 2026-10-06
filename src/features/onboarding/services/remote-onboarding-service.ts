import { ApiError } from '../../../lib/api/client';
import type { createApiClient } from '../../../lib/api/client';
import { accountSchema, type Account } from '../../auth/schema/account-schema';
import { toOnboardingRequest } from './onboarding-payload';
import type { OnboardingPayload } from './onboarding-service';

type Identity = { token: string | null; epoch: number; account: Account | null };
export function createRemoteOnboardingService(client: ReturnType<typeof createApiClient>, getIdentity: () => Identity) {
  return {
    async submit(payload: OnboardingPayload) {
      const { token, epoch, account } = getIdentity();
      if (!token || !account) throw new ApiError('Please sign in or continue as guest first.', 401, 'SESSION_REQUIRED');
      const parsed = accountSchema.safeParse(await client.request('/v1/accounts/onboarding', { method: 'POST', body: toOnboardingRequest(payload) }));
      if (!parsed.success) throw new ApiError('Could not finish setup. Please try again.', 0, 'INVALID_ONBOARDING_RESPONSE');
      const result = parsed.data;
      const current = getIdentity();
      if (current.token !== token || current.epoch !== epoch || result.id !== account.id || result.accountStatus !== account.accountStatus)
        throw new ApiError('Your session changed. Please sign in again.', 0, 'SESSION_CHANGED');
      if (!result.onboardingCompleted) throw new ApiError('Could not finish setup. Please try again.', 0, 'ONBOARDING_INCOMPLETE');
      return result;
    },
  };
}

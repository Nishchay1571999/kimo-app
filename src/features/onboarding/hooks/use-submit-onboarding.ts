import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { sessionStore } from '@/features/auth/store/session-store';
import { createRemoteOnboardingService } from '../services/remote-onboarding-service';

const service = createRemoteOnboardingService(api, () => sessionStore.getState());

export function useSubmitOnboarding() {
  return useMutation({ mutationKey: ['account', 'onboarding'], mutationFn: service.submit });
}

import { sessionStore } from '@/features/auth/store/session-store';
import { createApiClient } from './client';

export const api = createApiClient(process.env.EXPO_PUBLIC_API_URL ?? 'https://kimbo-backend.fly.dev', {
  getIdentity: () => sessionStore.getState(),
  unauthorized: () => { void sessionStore.getState().clear(); },
  onboardingRequired: () => sessionStore.getState().requireOnboarding(),
});

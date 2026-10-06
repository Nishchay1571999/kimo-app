import { useMutation } from '@tanstack/react-query';
import { onboardingStore } from '@/features/onboarding/store/onboarding-store';
import { signupStore } from '../store/signup-store';
import { sessionStore } from '../store/session-store';
import type { Session } from '../schema/account-schema';
import { authService } from '../services/auth-service';
import { ApiError } from '@/lib/api/client';
import type { LoginForm } from '../schema/login-schema';
import type { RegisterForm } from '../schema/register-schema';
import { createGuestSession } from '../services/create-guest-session';

async function accept(session: Session) {
  const previous = sessionStore.getState().account;
  // Drafts belong to an identity. Same-user guest conversion keeps its progress.
  if (previous?.id !== session.id) onboardingStore.getState().reset();
  await sessionStore.getState().accept(session);
  if (sessionStore.getState().token !== session.token) throw new ApiError('Your session changed. Please try again.', 0, 'SESSION_CHANGED');
  onboardingStore.getState().setAccessMode(session.accountStatus === 'member' ? 'account' : 'guest');
  await signupStore.getState().finish();
}

const continueAsGuest = createGuestSession({
  getIdentity: () => sessionStore.getState(), requestGuest: () => authService.continueAsGuest(), accept,
});

export function useAuthentication() {
  const authenticate = async (request: () => Promise<Session>) => {
    const epoch = sessionStore.getState().epoch;
    const session = await request();
    if (epoch !== sessionStore.getState().epoch) throw new ApiError('Your session changed. Please try again.', 0, 'SESSION_CHANGED');
    await accept(session);
    return session;
  };
  const signIn = useMutation({ mutationKey: ['auth', 'signIn'], mutationFn: (values: LoginForm) => authenticate(() => authService.signIn(values)) });
  const register = useMutation({ mutationKey: ['auth', 'register'], mutationFn: (values: RegisterForm) => authenticate(() => authService.register(values)) });
  const guest = useMutation({ mutationKey: ['auth', 'guest'], mutationFn: continueAsGuest, retry: false });
  return { signIn, register, guest };
}

import { onboardingDestination } from '../../onboarding/store/onboarding-destination';
import type { OnboardingState } from '../../onboarding/store/create-onboarding-store';
import type { SignupState } from './create-signup-store';

export function signupDestination(signup: Pick<SignupState, 'pending' | 'returnTo'>) {
  return signup.pending ? {
    pathname: '/(auth)/register' as const,
    params: { returnTo: signup.returnTo },
  } : null;
}

export function appDestination(signup: Pick<SignupState, 'pending' | 'returnTo'>, onboarding: OnboardingState) {
  return signupDestination(signup) ?? onboardingDestination(onboarding);
}

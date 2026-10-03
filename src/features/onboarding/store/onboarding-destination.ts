import { goalSchema } from '../schema/goal-schema';
import { lifestyleSchema } from '../schema/lifestyle-schema';
import type { OnboardingState } from './create-onboarding-store';

export function hasOnboardingDraft(state: OnboardingState) {
  // Also recognize drafts saved before hasStarted was introduced.
  return state.hasStarted || state.goal.age !== 18 || state.goal.feet !== ''
    || state.goal.weight !== '' || !['', '00'].includes(state.goal.inches)
    || !!state.goal.gender || !!state.goal.intention || Object.keys(state.lifestyle).length > 0;
}

export function onboardingDestination(state: OnboardingState) {
  if (state.completed) return '/(tabs)' as const;
  if (!hasOnboardingDraft(state)) return '/(auth)/welcome' as const;
  if (!goalSchema.safeParse(state.goal).success || ['about-you', 'goal'].includes(state.step)) {
    return '/(onboarding)/goal' as const;
  }
  if (!lifestyleSchema.safeParse(state.lifestyle).success || state.step === 'lifestyle') {
    return '/(onboarding)/lifestyle' as const;
  }
  return '/(onboarding)/target' as const;
}

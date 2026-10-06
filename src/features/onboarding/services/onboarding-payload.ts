import { goalSchema } from '../schema/goal-schema';
import { lifestyleSchema } from '../schema/lifestyle-schema';
import type { OnboardingPayload } from './onboarding-service';

export function toOnboardingRequest(payload: OnboardingPayload) {
  const goal = goalSchema.parse(payload.goal);
  const lifestyle = lifestyleSchema.parse(payload.lifestyle);
  return {
    age: goal.age, heightCm: Math.round((Number(goal.feet) * 12 + Number(goal.inches)) * 2.54 * 100) / 100,
    weightKg: Number(goal.weight), gender: goal.gender, goalIntention: goal.intention,
    healthyEatingFrequency: lifestyle.healthyEating.replaceAll('-', '_'),
    exerciseFrequency: lifestyle.exerciseFrequency.replaceAll('-', '_'),
    wakeTime: lifestyle.wakeTime, sleepTime: lifestyle.sleepTime,
  };
}

import { useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useDemoSession } from '@/context/demo-session';
import { goalSchema, type GoalForm } from '../schema/goal-schema';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '../store/onboarding-store';

export function useGoalForm() {
  const hydrated = useOnboardingHydration();
  const { update } = useDemoSession();
  const storageError = useOnboardingStore((state) => state.storageError);
  const submitting = useOnboardingStore((state) => state.submitting);
  const form = useForm<GoalForm>({
    defaultValues: onboardingStore.getState().goal,
    resolver: zodResolver(goalSchema),
  });
  const { reset, subscribe } = form;
  useEffect(() => {
    if (!hydrated || onboardingStore.getState().storageError) return;
    reset(onboardingStore.getState().goal);
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => onboardingStore.getState().setGoal(values),
    });
  }, [hydrated, reset, subscribe]);

  useFocusEffect(useCallback(() => {
    if (hydrated) onboardingStore.getState().visitStep('goal');
  }, [hydrated]));

  const onSubmit = form.handleSubmit(() => {
    if (!onboardingStore.getState().saveGoal()) return;
    update({ step: 'lifestyle' });
    router.push('/(onboarding)/lifestyle');
  });

  return { control: form.control, errors: form.formState.errors, onSubmit, error: storageError, loading: !hydrated || submitting };
}

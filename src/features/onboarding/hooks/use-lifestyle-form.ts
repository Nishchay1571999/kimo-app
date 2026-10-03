import { useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useForm } from 'react-hook-form';

import { useDemoSession } from '@/context/demo-session';
import type { LifestyleForm } from '../schema/lifestyle-schema';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '../store/onboarding-store';

export function useLifestyleForm() {
  const hydrated = useOnboardingHydration();
  const { update } = useDemoSession();
  const errors = useOnboardingStore((state) => state.lifestyleErrors);
  const storageError = useOnboardingStore((state) => state.storageError);
  const submitError = useOnboardingStore((state) => state.submitError);
  const submitting = useOnboardingStore((state) => state.submitting);
  const form = useForm<LifestyleForm>({
    defaultValues: onboardingStore.getState().lifestyle,
    resolver: (values) => {
      const result = onboardingStore.getState().validateLifestyle(values);
      return result.success
        ? { values: result.data, errors: {} }
        : { values: {}, errors: onboardingStore.getState().lifestyleErrors };
    },
  });
  const { reset, subscribe } = form;
  useEffect(() => {
    if (!hydrated || onboardingStore.getState().storageError) return;
    reset(onboardingStore.getState().lifestyle);
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => onboardingStore.getState().setLifestyle(values),
    });
  }, [hydrated, reset, subscribe]);

  useFocusEffect(useCallback(() => {
    if (hydrated) onboardingStore.getState().visitStep('lifestyle');
  }, [hydrated]));

  const onSubmit = form.handleSubmit(async () => {
    if (!await onboardingStore.getState().submitLifestyle()) return;
    update({ step: 'target' });
    router.push('/(onboarding)/target');
  });

  return { control: form.control, errors, onSubmit, error: storageError ?? submitError, loading: !hydrated || submitting };
}

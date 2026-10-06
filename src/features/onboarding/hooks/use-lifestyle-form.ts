import { useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSubmitOnboarding } from './use-submit-onboarding';
import { sessionStore } from '@/features/auth/store/session-store';
import type { Account } from '@/features/auth/schema/account-schema';
import { queryClient } from '@/lib/query-client';

import { useDemoSession } from '@/context/demo-session';
import { lifestyleSchema, type LifestyleForm } from '../schema/lifestyle-schema';
import { onboardingStore, useOnboardingHydration, useOnboardingStore } from '../store/onboarding-store';

export function useLifestyleForm() {
  const hydrated = useOnboardingHydration();
  const { update } = useDemoSession();
  const mutation = useSubmitOnboarding();
  const storageError = useOnboardingStore((state) => state.storageError);
  const submitError = useOnboardingStore((state) => state.submitError);
  const submitting = useOnboardingStore((state) => state.submitting);
  const form = useForm<LifestyleForm>({
    defaultValues: onboardingStore.getState().lifestyle,
    resolver: zodResolver(lifestyleSchema),
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

  const onSubmit = form.handleSubmit(async (values) => {
    const identity = sessionStore.getState();
    onboardingStore.getState().setLifestyle(values);
    let result: Account | undefined;
    try {
      const saved = await onboardingStore.getState().submitLifestyle(async (payload) => {
        result = await mutation.mutateAsync(payload);
        return 'remote';
      });
      if (!saved) return;
      if (identity.token && result) {
        sessionStore.getState().confirm(identity.token, result);
        queryClient.setQueryData(['account', identity.epoch, 'me'], result);
        void queryClient.invalidateQueries({ queryKey: ['account', identity.epoch, 'home'] });
      }
      update({ step: 'target' });
      router.replace('/(onboarding)/target');
    } finally { mutation.reset(); }
  });

  return { control: form.control, errors: form.formState.errors, onSubmit, error: storageError ?? submitError, loading: !hydrated || submitting || form.formState.isSubmitting };
}

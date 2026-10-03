import { z } from 'zod';
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { goalSchema, type GoalForm } from '../schema/goal-schema';
import { lifestyleSchema, type LifestyleForm } from '../schema/lifestyle-schema';
import type { OnboardingTransport } from '../services/onboarding-service';

export type GoalDraft = Omit<GoalForm, 'gender' | 'intention'> & Partial<Pick<GoalForm, 'gender' | 'intention'>>;
export type LifestyleDraft = Partial<LifestyleForm>;
export type ValidationErrors<T> = Partial<Record<keyof T, { type: string; message: string }>>;
type Step = 'about-you' | 'goal' | 'lifestyle' | 'target';

const persistedSchema = z.object({
  goal: z.object({
    age: z.number(), feet: z.string(), inches: z.string(), weight: z.string(),
    gender: goalSchema.shape.gender.optional(), intention: goalSchema.shape.intention.optional(),
  }),
  lifestyle: lifestyleSchema.partial(),
  step: z.enum(['about-you', 'goal', 'lifestyle', 'target']),
  syncMode: z.enum(['local', 'remote']),
  hasStarted: z.boolean().default(false),
  completed: z.boolean().default(false),
  accessMode: z.enum(['guest', 'account']).default('guest'),
});

function initialData() {
  return {
    goal: { age: 18, feet: '', inches: '00', weight: '' } satisfies GoalDraft,
    lifestyle: {} as LifestyleDraft,
    step: 'about-you' as Step,
    syncMode: 'local' as 'local' | 'remote',
    hasStarted: false, completed: false,
    accessMode: 'guest' as 'guest' | 'account',
  };
}

function fieldErrors<T>(error: z.ZodError): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    if (!errors[field]) errors[field] = { type: issue.code, message: issue.message };
  }
  return errors;
}

export type OnboardingState = {
  goal: GoalDraft;
  lifestyle: LifestyleDraft;
  step: Step;
  syncMode: 'local' | 'remote';
  hasStarted: boolean;
  completed: boolean;
  accessMode: 'guest' | 'account';
  hydrated: boolean;
  storageError: string | null;
  submitError: string | null;
  submitting: boolean;
  goalErrors: ValidationErrors<GoalForm>;
  lifestyleErrors: ValidationErrors<LifestyleForm>;
  setGoal: (draft: GoalDraft) => void;
  setLifestyle: (draft: LifestyleDraft) => void;
  validateGoal: (draft: unknown) => ReturnType<typeof goalSchema.safeParse>;
  validateLifestyle: (draft: unknown) => ReturnType<typeof lifestyleSchema.safeParse>;
  saveGoal: () => boolean;
  submitLifestyle: () => Promise<boolean>;
  finishHydration: (error?: unknown) => void;
  reset: () => void;
  visitStep: (step: Step) => void;
  setAccessMode: (mode: 'guest' | 'account') => void;
  complete: () => boolean;
};

export function createOnboardingStore(storage: StateStorage, post: OnboardingTransport) {
  let storageFailed = false;
  let lastSaved: string | undefined;
  let requestGeneration = 0;
  // Errors/status changes do not rewrite an unchanged draft. Stop writing after
  // a disk failure so reporting the error cannot trigger another failing write.
  const guardedStorage: StateStorage = {
    getItem: (name) => storage.getItem(name),
    setItem: (name, value) => {
      if (storageFailed || value === lastSaved) return;
      try {
        storage.setItem(name, value);
        lastSaved = value;
      } catch (error) {
        storageFailed = true;
        throw error;
      }
    },
    removeItem: (name) => storage.removeItem(name),
  };
  return createStore<OnboardingState>()(persist((set, get) => ({
    ...initialData(),
    hydrated: false, storageError: null, submitError: null, submitting: false,
    goalErrors: {}, lifestyleErrors: {},
    setGoal: (goal) => {
      if (get().submitting || !get().hydrated || get().completed) return;
      try { set({ goal, step: 'goal', hasStarted: true, submitError: null }); }
      catch { set({ storageError: 'Could not save your answers on this device. Please try again.' }); }
    },
    setLifestyle: (lifestyle) => {
      if (get().submitting || !get().hydrated || get().completed) return;
      try { set({ lifestyle, step: 'lifestyle', hasStarted: true, submitError: null }); }
      catch { set({ storageError: 'Could not save your answers on this device. Please try again.' }); }
    },
    validateGoal: (draft) => {
      const result = goalSchema.safeParse(draft);
      set({ goalErrors: result.success ? {} : fieldErrors<GoalForm>(result.error) });
      return result;
    },
    validateLifestyle: (draft) => {
      const result = lifestyleSchema.safeParse(draft);
      set({ lifestyleErrors: result.success ? {} : fieldErrors<LifestyleForm>(result.error) });
      return result;
    },
    saveGoal: () => {
      if (!get().hydrated || get().submitting || get().storageError || get().completed) return false;
      const result = get().validateGoal(get().goal);
      if (!result.success) return false;
      const previousStep = get().step;
      try {
        set({ goal: result.data, step: 'lifestyle' });
        return true;
      } catch {
        set({ step: previousStep, storageError: 'Could not save your answers on this device. Reopen the app to try again.' });
        return false;
      }
    },
    submitLifestyle: async () => {
      if (!get().hydrated || get().submitting || get().storageError || get().completed) return false;
      const goal = get().validateGoal(get().goal);
      const lifestyle = get().validateLifestyle(get().lifestyle);
      if (!goal.success || !lifestyle.success) {
        set({ submitError: !goal.success ? 'Complete your goal details before continuing.' : null });
        return false;
      }
      const request = ++requestGeneration;
      const previousStep = get().step;
      try {
        set({ goal: goal.data, lifestyle: lifestyle.data, submitting: true, submitError: null });
        const syncMode = await post({ goal: goal.data, lifestyle: lifestyle.data });
        if (request !== requestGeneration) return false;
        set({ step: 'target', syncMode, submitting: false });
        return true;
      } catch {
        if (request !== requestGeneration) return false;
        set({
          step: previousStep, submitting: false,
          storageError: storageFailed ? 'Could not save your answers on this device. Reopen the app to try again.' : null,
          submitError: 'Could not save your onboarding. Your answers are kept on this device. Try again.',
        });
        return false;
      }
    },
    finishHydration: (error) => set({
      hydrated: true,
      storageError: error ? 'Could not restore your saved answers. Please reopen the app to try again.' : null,
    }),
    visitStep: (step) => {
      if (!get().hydrated || get().completed || get().storageError || get().submitting) return;
      try { set({ step }); }
      catch { set({ storageError: 'Could not save your progress. Reopen the app to try again.' }); }
    },
    setAccessMode: (accessMode) => {
      try { set({ accessMode }); }
      catch { set({ storageError: 'Could not save your progress. Reopen the app to try again.' }); }
    },
    complete: () => {
      if (!get().hydrated || get().storageError || get().submitting) return false;
      if (get().completed) return true;
      if (get().step !== 'target' || !goalSchema.safeParse(get().goal).success
        || !lifestyleSchema.safeParse(get().lifestyle).success) return false;
      try {
        set({ completed: true });
        return true;
      } catch {
        set({ completed: false, storageError: 'Could not save your progress. Reopen the app to try again.' });
        return false;
      }
    },
    reset: () => {
      requestGeneration++;
      set({ ...initialData(), goalErrors: {}, lifestyleErrors: {}, submitError: null, submitting: false });
    },
  }), {
    name: 'kimo-onboarding', version: 1,
    storage: createJSONStorage(() => guardedStorage),
    partialize: ({ goal, lifestyle, step, syncMode, hasStarted, completed, accessMode }) => ({
      goal, lifestyle, step, syncMode, hasStarted, completed, accessMode,
    }),
    merge: (saved, current) => saved === undefined
      ? current
      : { ...current, ...persistedSchema.parse(saved) },
    skipHydration: true,
    onRehydrateStorage: (state) => (_restored, error) => {
      storageFailed = !!error;
      state.finishHydration(error);
    },
  }));
}

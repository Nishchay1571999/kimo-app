import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { onboardingStorage } from '@/storage/onboarding-storage';

/** Advanced setting: a model for new conversations. Absent means Auto (server default with fallback). */
export const useModelPreference = create<{ byAccount: Record<string, string>; set: (accountId: string, modelId: string | null) => void }>()(persist(
  set => ({
    byAccount: {},
    set: (accountId, modelId) => set(state => {
      const byAccount = { ...state.byAccount };
      if (modelId) byAccount[accountId] = modelId; else delete byAccount[accountId];
      return { byAccount };
    }),
  }),
  { name: 'kimo-model-preference', storage: createJSONStorage(() => onboardingStorage), partialize: state => ({ byAccount: state.byAccount }) },
));

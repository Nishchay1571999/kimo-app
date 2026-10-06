import { useStore } from 'zustand';
import { onboardingStorage } from '@/storage/onboarding-storage';
import { sessionStore } from '@/features/auth/store/session-store';
import { createUploadStore, type UploadState } from './create-upload-store';

// Draft images live in local SQLite/browser storage, never in token storage.
export const uploadStore = createUploadStore({
  getItem: key => onboardingStorage.getItem(key) as string | null,
  setItem: (key, value) => { onboardingStorage.setItem(key, value); },
  removeItem: key => { onboardingStorage.removeItem(key); },
});
sessionStore.subscribe(state => {
  // Persisting a guest conversion briefly clears account while retaining the same identity.
  if (state.account) uploadStore.getState().activate(state.account.id);
  else if (!state.token && state.storageRecovery !== 'save') uploadStore.getState().activate(null);
});
export const useUploadStore = <T,>(selector: (state: UploadState) => T) => useStore(uploadStore, selector);

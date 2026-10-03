import { z } from 'zod';
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

const draftSchema = z.object({
  pending: z.boolean(), displayName: z.string(), email: z.string(),
  returnTo: z.enum(['ai', 'home']),
});
const emptyDraft = { pending: false, displayName: '', email: '', returnTo: 'home' as const };

export type SignupState = z.infer<typeof draftSchema> & {
  hydrated: boolean;
  storageError: string | null;
  begin: (returnTo?: string) => void;
  saveDraft: (draft: { displayName: string; email: string }) => void;
  finish: () => Promise<boolean>;
  cancel: () => void;
  flush: () => Promise<void>;
  finishHydration: (error?: unknown) => void;
};

export function createSignupStore(storage: StateStorage) {
  let writes = Promise.resolve();
  let lastQueued: string | undefined;
  let readFailed = false;
  let reportError: () => void = () => {};
  // Serialize async SecureStore writes so older edits cannot overwrite newer ones.
  const guardedStorage: StateStorage = {
    getItem: async (name) => {
      await writes;
      try {
        const value = await storage.getItem(name);
        readFailed = false;
        return value;
      } catch (error) {
        readFailed = true;
        throw error;
      }
    },
    setItem: (name, value) => {
      if (readFailed || value === lastQueued) return writes;
      lastQueued = value;
      writes = writes.then(() => storage.setItem(name, value)).then(() => {}).catch(() => {
        // Keep the queue usable and report native errors without an unhandled rejection.
        reportError();
      });
      return writes;
    },
    removeItem: (name) => storage.removeItem(name),
  };
  return createStore<SignupState>()(persist((set, get) => {
    reportError = () => set({ storageError: 'Could not save your signup progress. Reopen the app to try again.' });
    return {
      ...emptyDraft, hydrated: false, storageError: null,
      begin: (returnTo) => {
        if (!get().hydrated) return;
        set({ pending: true, ...(returnTo ? { returnTo: returnTo === 'ai' ? 'ai' : 'home' } : {}) });
      },
      saveDraft: ({ displayName, email }) => {
        if (get().hydrated) set({ displayName, email });
      },
      finish: async () => {
        if (!get().hydrated || get().storageError) return false;
        const previous = draftSchema.parse(get());
        set(emptyDraft);
        await writes;
        if (get().storageError) { set(previous); return false; }
        return true;
      },
      cancel: () => { if (get().hydrated) set({ pending: false, returnTo: 'home' }); },
      flush: () => writes,
      finishHydration: (error) => set({
        hydrated: true,
        storageError: error ? 'Could not restore your signup progress. Please try again.' : null,
      }),
    };
  }, {
    name: 'kimo-signup', version: 1,
    storage: createJSONStorage(() => guardedStorage),
    // Passwords and confirmation never enter the persisted store.
    partialize: ({ pending, displayName, email, returnTo }) => ({ pending, displayName, email, returnTo }),
    merge: (saved, current) => saved === undefined ? current : { ...current, ...draftSchema.parse(saved) },
    skipHydration: true,
    onRehydrateStorage: (state) => (_restored, error) => {
      readFailed = !!error;
      state.finishHydration(error);
    },
  }));
}

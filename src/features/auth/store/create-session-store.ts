import { createStore } from 'zustand/vanilla';
import type { StateStorage } from 'zustand/middleware';
import { z } from 'zod';
import type { Account, Session } from '../schema/account-schema';

export type SessionState = {
  token: string | null;
  account: Account | null;
  hydrated: boolean;
  storageError: string | null;
  storageRecovery: 'restore' | 'clear' | 'save';
  epoch: number;
  hydrate: () => Promise<void>;
  accept: (session: Session) => Promise<void>;
  retrySave: () => Promise<void>;
  clear: () => Promise<void>;
  confirm: (token: string, account: Account) => void;
  requireOnboarding: () => void;
};

// Serialize token writes, including logout, so a slower write cannot resurrect a session.
export function createSessionStore(storage: StateStorage) {
  let pendingSession: Session | null = null;
  let writes = Promise.resolve();
  const enqueue = (operation: () => Promise<unknown> | unknown) => {
    const next = writes.then(operation);
    writes = next.then(() => {}, () => {});
    return next;
  };
  return createStore<SessionState>()((set, get) => ({
    token: null, account: null, hydrated: false, storageError: null, storageRecovery: 'restore', epoch: 0,
    hydrate: async () => {
      const epoch = get().epoch;
      try {
        const saved = await enqueue(() => storage.getItem('kimo-session-v1'));
        const token = saved === null || saved === undefined ? null : z.string().min(1).parse(saved);
        if (epoch === get().epoch) set({ token, hydrated: true, storageError: null });
      } catch {
        if (epoch === get().epoch) set({ hydrated: true, storageRecovery: 'restore', storageError: 'Could not restore your session. Try again.' });
      }
    },
    accept: async ({ token, tokenType: _tokenType, ...account }) => {
      pendingSession = { ...account, token, tokenType: 'Bearer' };
      const epoch = get().epoch + 1;
      set({ token: null, account: null, epoch, storageError: null });
      try {
        await enqueue(() => storage.setItem('kimo-session-v1', token));
        if (epoch === get().epoch) { pendingSession = null; set({ token, account, hydrated: true }); }
      } catch {
        if (epoch === get().epoch) set({ storageRecovery: 'save', storageError: 'Could not save your session. Please try again.' });
        throw new Error('Could not save your session. Please try again.');
      }
    },
    retrySave: async () => { if (pendingSession) await get().accept(pendingSession); },
    clear: async () => {
      pendingSession = null;
      const epoch = get().epoch + 1;
      set({ token: null, account: null, epoch, storageError: null });
      try { await enqueue(() => storage.removeItem('kimo-session-v1')); }
      catch { if (get().epoch === epoch) set({ storageRecovery: 'clear', storageError: 'Could not remove the saved session. Try again before closing the app.' }); }
    },
    confirm: (token, account) => { if (get().token === token) set({ account }); },
    requireOnboarding: () => {
      const account = get().account;
      if (account) set({ account: { ...account, onboardingCompleted: false } });
    },
  }));
}

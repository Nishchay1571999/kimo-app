import type { StateStorage } from 'zustand/middleware';

// SecureStore is native-only. Web previews keep auth drafts in memory rather
// than writing private account details to browser localStorage or SQLite.
const drafts = new Map<string, string>();
export const authStorage: StateStorage = {
  getItem: (key) => drafts.get(key) ?? null,
  setItem: (key, value) => { drafts.set(key, value); },
  removeItem: (key) => { drafts.delete(key); },
};

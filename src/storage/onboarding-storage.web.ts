import type { StateStorage } from 'zustand/middleware';

export const onboardingStorage: StateStorage = {
  getItem: (name) => typeof window === 'undefined' ? null : window.localStorage.getItem(name),
  setItem: (name, value) => { window.localStorage.setItem(name, value); },
  removeItem: (name) => { window.localStorage.removeItem(name); },
};

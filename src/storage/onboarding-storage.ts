import Storage from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

export const onboardingStorage: StateStorage = {
  getItem: (name) => Storage.getItemSync(name),
  setItem: (name, value) => Storage.setItemSync(name, value),
  removeItem: (name) => Storage.removeItemSync(name),
};

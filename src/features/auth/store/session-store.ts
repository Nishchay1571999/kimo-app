import { useStore } from 'zustand';
import { authStorage } from '@/storage/auth-storage';
import { createSessionStore, type SessionState } from './create-session-store';

export const sessionStore = createSessionStore(authStorage);
export const useSessionStore = <T,>(selector: (state: SessionState) => T) => useStore(sessionStore, selector);

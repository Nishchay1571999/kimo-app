import { api } from '@/lib/api';
import { sessionStore } from '../store/session-store';
import { createAuthService } from './create-auth-service';

export const authService = createAuthService(api, () => {
  const { token, account } = sessionStore.getState();
  return token && account ? { ...account, token } : null;
});

import { ApiError } from '../../../lib/api/client';
import type { createApiClient } from '../../../lib/api/client';
import { accountSchema, sessionSchema } from '../schema/account-schema';
import type { Session } from '../schema/account-schema';
import type { LoginForm } from '../schema/login-schema';
import type { RegisterForm } from '../schema/register-schema';

export function localTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; }
  catch { return 'Asia/Kolkata'; }
}

export function createAuthService(client: ReturnType<typeof createApiClient>, getSession: () => Pick<Session, 'token' | 'accountStatus' | 'id' | 'timezone'> | null, timezone = localTimezone) {
  const signIn = async (values: LoginForm) => sessionSchema.parse(await client.request('/v1/accounts/sign-in', {
    method: 'POST', authenticated: false, body: values,
  }));
  return {
    signIn,
    async continueAsGuest() {
      const result = sessionSchema.parse(await client.request('/v1/accounts/continue-as-guest', {
        method: 'POST', authenticated: false, body: { timezone: timezone() },
      }));
      if (result.accountStatus !== 'guest' || result.name !== null || result.email !== null)
        throw new ApiError('Could not start a guest session. Please try again.', 0, 'INVALID_GUEST_RESPONSE');
      return result;
    },
    async register(values: RegisterForm) {
      const guest = getSession();
      const converting = guest?.accountStatus === 'guest';
      const account = accountSchema.parse(await client.request('/v1/accounts', { method: 'POST', authenticated: false, body: {
        name: values.displayName, email: values.email, password: values.password,
        timezone: guest?.timezone ?? timezone(),
        ...(converting ? { auth_provider_id: guest.token } : {}),
      } }));
      if (account.accountStatus !== 'member' || (converting && account.id !== guest.id))
        throw new ApiError('Could not confirm your account. Please sign in again.', 0, 'INVALID_ACCOUNT_RESPONSE');
      if (converting) return sessionSchema.parse({ ...account, token: guest.token, tokenType: 'Bearer' });
      try { return await signIn({ email: values.email, password: values.password }); }
      catch { throw new ApiError('Your account was created. Please sign in to continue.', 0, 'ACCOUNT_CREATED'); }
    },
    async me(signal?: AbortSignal) { return accountSchema.parse(await client.request('/v1/accounts/me', { signal })); },
  };
}

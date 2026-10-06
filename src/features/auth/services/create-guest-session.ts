import { ApiError } from '../../../lib/api/client';
import type { Session, Account } from '../schema/account-schema';

type Identity = { token: string | null; account: Account | null; epoch: number; hydrated: boolean; storageError: string | null };
export function createGuestSession({ getIdentity, requestGuest, accept }: {
  getIdentity: () => Identity; requestGuest: () => Promise<Session>; accept: (session: Session) => Promise<void>;
}) {
  let pending: { epoch: number; savingEpoch?: number; promise: Promise<Session> } | undefined;
  return () => {
    const identity = getIdentity();
    if (!identity.hydrated || identity.storageError || (identity.token && !identity.account))
      return Promise.reject(new ApiError('Could not restore your session. Please try again.', 0, 'SESSION_NOT_READY'));
    if (identity.token && identity.account) {
      if (identity.account.accountStatus === 'member') return Promise.reject(new ApiError('You are already signed in.', 409, 'ALREADY_SIGNED_IN'));
      return Promise.resolve({ ...identity.account, token: identity.token, tokenType: 'Bearer' as const });
    }
    if (pending && (pending.epoch === identity.epoch || pending.savingEpoch === identity.epoch)) return pending.promise;
    const promise = (async () => {
      const guest = await requestGuest();
      if (identity.epoch !== getIdentity().epoch) throw new ApiError('Your session changed. Please try again.', 0, 'SESSION_CHANGED');
      if (pending?.epoch === identity.epoch) pending.savingEpoch = identity.epoch + 1;
      await accept(guest);
      return guest;
    })();
    pending = { epoch: identity.epoch, promise };
    const finish = () => { if (pending?.promise === promise) pending = undefined; };
    void promise.then(finish, finish);
    return promise;
  };
}

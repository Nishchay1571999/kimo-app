import { create, isCancel, isAxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}

type RequestOptions = { method?: string; body?: unknown; signal?: AbortSignal; authenticated?: boolean; identity?: Identity; timeoutMs?: number };
type Identity = { token: string | null; epoch: number };
type Interceptors = {
  getIdentity: () => Identity;
  unauthorized: () => void;
  onboardingRequired: () => void;
};
type ApiRequestConfig = InternalAxiosRequestConfig & { authenticated?: boolean; expectedIdentity?: Identity };

export function createApiClient(baseUrl: string, interceptors: Interceptors, adapter?: AxiosAdapter) {
  const client = create({
    baseURL: baseUrl.replace(/\/$/, ''), timeout: 20000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    // React Native/web use XHR; Node verification uses HTTP. No Fetch adapter.
    adapter: adapter ?? ['xhr', 'http'],
  });
  const identities = new WeakMap<InternalAxiosRequestConfig, Identity>();
  client.interceptors.request.use((config: ApiRequestConfig) => {
    const identity = interceptors.getIdentity();
    if (config.expectedIdentity && (identity.token !== config.expectedIdentity.token || identity.epoch !== config.expectedIdentity.epoch))
      throw new ApiError('Your session changed. Please try again from your current account.', 0, 'SESSION_CHANGED');
    identities.set(config, identity);
    if (config.authenticated !== false) {
      if (!identity.token) throw new ApiError('Please sign in to continue.', 401, 'SESSION_REQUIRED');
      config.headers.set('Authorization', `Bearer ${identity.token}`);
    }
    return config;
  });
  client.interceptors.response.use((response) => response, (error: unknown) => {
    if (error instanceof ApiError || isCancel(error)) return Promise.reject(error);
    if (!isAxiosError(error)) return Promise.reject(new ApiError('Could not complete this request. Please try again.', 0, 'REQUEST_FAILED'));
    const status = error.response?.status ?? 0;
    let body: unknown = error.response?.data;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    const details = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const code = typeof details.code === 'string' ? details.code : status ? `HTTP_${status}` : 'NETWORK_ERROR';
    const config = error.config as ApiRequestConfig | undefined;
    const identity = config ? identities.get(config) : undefined;
    const current = interceptors.getIdentity();
    if (config?.authenticated !== false && identity && current.token === identity.token && current.epoch === identity.epoch) {
      if (status === 401) interceptors.unauthorized();
      if (status === 403 && (code === 'ONBOARDING_REQUIRED' || details.message === 'Complete onboarding first')) interceptors.onboardingRequired();
    }
    const message = status >= 500 ? 'The service is unavailable. Please try again.'
      : status === 0 ? error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        ? 'The request timed out. Please try again.' : 'Could not connect. Check your connection and try again.'
      : typeof details.message === 'string' ? details.message : 'Could not complete this request. Please try again.';
    return Promise.reject(new ApiError(message, status, code));
  });
  return {
    async stream(path: string, options: { body: unknown; signal: AbortSignal; identity: Identity; onText: (text: string) => void }): Promise<void> {
      const abort = new AbortController();
      const cancel = () => abort.abort();
      options.signal.addEventListener('abort', cancel);
      if (options.signal.aborted) cancel();
      let callbackError: unknown;
      const consume = (text: string) => {
        if (abort.signal.aborted) return;
        const current = interceptors.getIdentity();
        if (current.epoch !== options.identity.epoch || current.token !== options.identity.token) {
          callbackError = new ApiError('Your session changed.', 0, 'SESSION_CHANGED'); abort.abort(); return;
        }
        try { options.onText(text); } catch (error) { callbackError = error; abort.abort(); }
      };
      try {
        const response = await client.request<string>({
          url: path, method: 'POST', data: options.body, signal: abort.signal,
          expectedIdentity: options.identity, authenticated: true,
          headers: { Accept: 'application/x-ndjson' }, responseType: 'text', timeout: 200000,
          transformResponse: [data => data],
          onDownloadProgress: progress => {
            const xhr = progress.event?.target;
            if (xhr?.status === 200 && typeof xhr.responseText === 'string' &&
              xhr.getResponseHeader?.('Content-Type')?.includes('application/x-ndjson')) consume(xhr.responseText);
          },
        } as Parameters<typeof client.request>[0] & { expectedIdentity: Identity; authenticated: boolean });
        if (!String(response.headers['content-type']).includes('application/x-ndjson') || typeof response.data !== 'string')
          throw new ApiError('The reply could not be read. Check saved messages before retrying.', 0, 'INVALID_CHAT_STREAM');
        consume(response.data);
        if (callbackError) throw callbackError;
      } catch (error) { throw callbackError ?? error; }
      finally { options.signal.removeEventListener('abort', cancel); }
    },
    async request(path: string, options: RequestOptions = {}): Promise<unknown> {
      const response = await client.request<unknown>({
        url: path, method: options.method ?? 'GET', data: options.body,
        ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
        signal: options.signal, authenticated: options.authenticated !== false, expectedIdentity: options.identity,
      } as Parameters<typeof client.request>[0] & { authenticated: boolean; expectedIdentity?: Identity });
      return response.status === 204 ? null : response.data;
    },
  };
}

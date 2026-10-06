import { z } from 'zod';
import { ApiError, type createApiClient } from '../../lib/api/client';
import { createChatStream } from './stream';
import { createThreadSchema, messageSchema, modelSchema, sendSchema, threadSchema, updateThreadSchema, type ChatEvent, type SendInput, type ThreadUpdate } from './schema';

export type ChatIdentity = { id: string; epoch: number; token: string };
export type ChatScope = Pick<ChatIdentity, 'id' | 'epoch'>;
export function createChatService(api: ReturnType<typeof createApiClient>, getIdentity: () => ChatIdentity | null) {
  const current = (scope: ChatScope) => {
    const owner = getIdentity();
    if (!owner || scope.id !== owner.id || scope.epoch !== owner.epoch) throw new ApiError('Your session changed. Reopen chat from your current account.', 0, 'SESSION_CHANGED');
    return owner;
  };
  const isCurrent = (owner: ChatIdentity) => { const now = getIdentity(); return !!now && now.id === owner.id && now.epoch === owner.epoch && now.token === owner.token; };
  const check = (owner: ChatIdentity) => { if (!isCurrent(owner)) throw new ApiError('Your session changed.', 0, 'SESSION_CHANGED'); };
  const parse = <T>(schema: z.ZodType<T>, raw: unknown) => {
    const result = schema.safeParse(raw); if (!result.success) throw new ApiError('Could not read saved chat data. Please refresh.', 0, 'INVALID_CHAT_RESPONSE'); return result.data;
  };
  const request = async (scope: ChatScope, path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}) => {
    const owner = current(scope); const result = await api.request(path, { ...options, identity: owner }); check(owner); return result;
  };
  return {
    isCurrent,
    async models(scope: ChatScope, signal?: AbortSignal) { return parse(z.array(modelSchema), await request(scope, '/v1/ai/models', { signal })).filter(model => model.supportsText); },
    async list(scope: ChatScope, cursor?: string, signal?: AbortSignal) {
      if (cursor) z.uuid().parse(cursor);
      return parse(z.array(threadSchema), await request(scope, `/v1/chat/threads?limit=50${cursor ? `&cursor=${cursor}` : ''}`, { signal }));
    },
    async get(scope: ChatScope, id: string, signal?: AbortSignal) {
      z.uuid().parse(id); const thread = parse(threadSchema, await request(scope, `/v1/chat/threads/${id}`, { signal }));
      if (thread.id !== id) throw new ApiError('Could not read this conversation.', 0, 'INVALID_CHAT_RESPONSE'); return thread;
    },
    async create(scope: ChatScope, input: { title?: string; aiModelId?: string }) {
      return parse(threadSchema, await request(scope, '/v1/chat/threads', { method: 'POST', body: createThreadSchema.parse(input) }));
    },
    async update(scope: ChatScope, id: string, input: ThreadUpdate) {
      z.uuid().parse(id); const result = parse(threadSchema, await request(scope, `/v1/chat/threads/${id}`, { method: 'PATCH', body: updateThreadSchema.parse(input) }));
      if (result.id !== id) throw new ApiError('Could not confirm this conversation change.', 0, 'INVALID_CHAT_RESPONSE'); return result;
    },
    async delete(scope: ChatScope, id: string) { z.uuid().parse(id); await request(scope, `/v1/chat/threads/${id}`, { method: 'DELETE' }); },
    async messages(scope: ChatScope, id: string, before?: number, signal?: AbortSignal) {
      z.uuid().parse(id); if (before !== undefined) z.number().int().positive().parse(before);
      const messages = parse(z.array(messageSchema), await request(scope, `/v1/chat/threads/${id}/messages?limit=50${before ? `&before=${before}` : ''}`, { signal }));
      if (messages.some((message, i) => message.threadId !== id || (before !== undefined && message.sequenceNumber >= before) || (i > 0 && message.sequenceNumber <= messages[i - 1].sequenceNumber)) || new Set(messages.map(message => message.id)).size !== messages.length)
        throw new ApiError('Could not read this conversation history.', 0, 'INVALID_CHAT_RESPONSE');
      return messages;
    },
    async send(scope: ChatScope, id: string, input: SendInput, signal: AbortSignal, emit: (event: ChatEvent) => void) {
      z.uuid().parse(id); const { requestId, text } = sendSchema.parse(input); const owner = current(scope);
      const stream = createChatStream(requestId, event => { check(owner); if (!signal.aborted) emit(event); });
      await api.stream(`/v1/chat/threads/${id}/messages`, { identity: owner, signal,
        body: { requestId, content: [{ type: 'text', text }] }, onText: text => stream.push(text) });
      check(owner); if (signal.aborted) throw new ApiError('Response stopped. Check saved messages before continuing.', 0, 'CHAT_INTERRUPTED');
      return stream.finish();
    },
  };
}

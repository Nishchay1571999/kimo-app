import { z } from 'zod';

const timestamp = z.iso.datetime({ offset: true });
export const threadSchema = z.object({
  id: z.uuid(), title: z.string().nullable(), aiModelId: z.uuid().nullable(),
  threadStatus: z.enum(['active', 'archived']), createdAt: timestamp, updatedAt: timestamp,
});
export const modelSchema = z.object({
  id: z.uuid(), name: z.string(), provider: z.string(), providerModelId: z.string(),
  supportsText: z.boolean(), supportsImages: z.boolean(), supportsAudio: z.boolean(),
});
export const sourceSchema = z.object({
  id: z.string().min(1), type: z.enum(['daily_health', 'weekly_health', 'monthly_health', 'health_range', 'entries', 'metric_history']),
  title: z.string(), origin: z.enum(['context', 'tool']), toolCallId: z.string().optional(),
  query: z.unknown(), snapshot: z.unknown(), provenance: z.object({
    entities: z.array(z.object({ entityId: z.uuid(), revision: z.number().int().positive() })), healthRecordIds: z.array(z.string()),
  }),
});
export const messageSchema = z.object({
  id: z.uuid(), threadId: z.uuid(), message: z.string(), role: z.enum(['user', 'assistant']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']), sequenceNumber: z.number().int().positive(),
  requestId: z.uuid(), replyToMessageId: z.uuid().nullable(), actualModelId: z.uuid().nullable(),
  metadata: z.object({ sources: z.array(sourceSchema).optional() }).passthrough(), errorCode: z.string().nullable(),
  createdAt: timestamp, updatedAt: timestamp, completedAt: timestamp.nullable(),
});
export const createThreadSchema = z.object({ title: z.string().trim().min(1).max(200).optional(), aiModelId: z.uuid().optional() }).strict();
export const updateThreadSchema = createThreadSchema.extend({ threadStatus: z.enum(['active', 'archived']).optional() }).strict().refine(value => Object.keys(value).length > 0);
export const sendSchema = z.object({ requestId: z.uuid(), text: z.string().trim().min(1).max(8000) });
export const chatEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message.started'), messageId: z.uuid(), userMessageId: z.uuid(), requestId: z.uuid(), replayed: z.boolean() }),
  z.object({ type: z.literal('agent.status'), status: z.enum(['thinking', 'generating']) }),
  z.object({ type: z.literal('text.delta'), delta: z.string() }),
  z.object({ type: z.literal('source.added'), source: sourceSchema }),
  z.object({ type: z.literal('tool.started'), toolCallId: z.string(), tool: z.string(), label: z.string() }),
  z.object({ type: z.literal('tool.completed'), toolCallId: z.string(), tool: z.string() }),
  z.object({ type: z.literal('tool.failed'), toolCallId: z.string(), tool: z.string(), errorCode: z.string() }),
  z.object({ type: z.literal('message.completed'), messageId: z.uuid(), actualModelId: z.uuid().nullable(), replayed: z.boolean().optional() }),
  z.object({ type: z.enum(['message.failed', 'message.cancelled']), messageId: z.uuid(), errorCode: z.string() }),
]);
export type Thread = z.infer<typeof threadSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
export type ChatSource = z.infer<typeof sourceSchema>;
export type ChatEvent = z.infer<typeof chatEventSchema>;
export type SendInput = z.infer<typeof sendSchema>;
export type ThreadUpdate = z.infer<typeof updateThreadSchema>;

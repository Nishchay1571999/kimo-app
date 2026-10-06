import type { ImageSource } from 'expo-image';

import type { z } from 'zod';
import type { modelSchema } from './schema';

export type ChatModel = { id: string; name: string; logo?: ImageSource | number };
export const defaultChatModel: ChatModel = { id: 'server-default', name: 'Server default' };
export function chatModels(models: z.infer<typeof modelSchema>[] = [], currentId?: string | null): ChatModel[] {
  const catalog: ChatModel[] = models.map(model => ({ id: model.id, name: model.name }));
  if (currentId && !catalog.some(model => model.id === currentId)) catalog.unshift({ id: currentId, name: 'Current thread model' });
  return currentId ? catalog : [defaultChatModel, ...catalog];
}

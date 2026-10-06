import { infiniteQueryOptions, queryOptions, type QueryClient } from '@tanstack/react-query';
import type { ChatScope, createChatService } from './service';

type Service = ReturnType<typeof createChatService>;
export const chatKey = (scope: ChatScope) => ['account', scope.epoch, 'chat', scope.id] as const;
export const threadKey = (scope: ChatScope, id: string) => [...chatKey(scope), 'thread', id] as const;
export const messagesKey = (scope: ChatScope, id: string) => [...chatKey(scope), 'messages', id] as const;
export const modelsOptions = (service: Service, scope: ChatScope) => queryOptions({
  queryKey: [...chatKey(scope), 'models'], queryFn: ({ signal }) => service.models(scope, signal), retry: false, staleTime: 300000,
});
export const threadOptions = (service: Service, scope: ChatScope, id: string) => queryOptions({
  queryKey: threadKey(scope, id), queryFn: ({ signal }) => service.get(scope, id, signal), retry: false, staleTime: 30000,
});
export const threadsOptions = (service: Service, scope: ChatScope) => infiniteQueryOptions({
  queryKey: [...chatKey(scope), 'threads'], initialPageParam: undefined as string | undefined,
  queryFn: ({ pageParam, signal }) => service.list(scope, pageParam, signal), retry: false, staleTime: 30000,
  getNextPageParam: page => page.length === 50 ? page.at(-1)?.id : undefined,
});
export const messagesOptions = (service: Service, scope: ChatScope, id: string) => infiniteQueryOptions({
  queryKey: messagesKey(scope, id), initialPageParam: undefined as number | undefined,
  queryFn: ({ pageParam, signal }) => service.messages(scope, id, pageParam, signal), retry: false, staleTime: 0,
  getNextPageParam: page => page.length === 50 ? page[0]?.sequenceNumber : undefined,
});
export async function refreshChat(client: QueryClient, scope: ChatScope, isCurrent: () => boolean) {
  if (!isCurrent()) return;
  await client.cancelQueries({ queryKey: chatKey(scope) });
  if (isCurrent()) await client.invalidateQueries({ queryKey: chatKey(scope) });
}

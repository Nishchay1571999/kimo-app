import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useStore } from 'zustand';
import { api } from '@/lib/api';
import { sessionStore, useSessionStore } from '@/features/auth/store/session-store';
import { useActiveScreen } from '@/hooks/use-active-screen';
import { createChatService } from './service';
import { createChatRunStore } from './run-store';
import { chatKey, messagesOptions, modelsOptions, refreshChat, threadKey, threadOptions, threadsOptions } from './queries';
import type { SendInput, ThreadUpdate } from './schema';

export function getChatIdentity() {
  const { account, token, epoch } = sessionStore.getState();
  return account?.accountStatus === 'member' && account.onboardingCompleted && token ? { id: account.id, token, epoch } : null;
}
export const chatService = createChatService(api, getChatIdentity);
const runs = new Map<string, ReturnType<typeof createChatRunStore>>();
sessionStore.subscribe((state, previous) => {
  if (state.epoch !== previous.epoch) { runs.forEach(run => run.stop()); runs.clear(); }
});
export function useChatScope() {
  const { account, epoch } = useSessionStore(state => state);
  return { scope: { id: account?.id ?? '', epoch }, enabled: account?.accountStatus === 'member' && account.onboardingCompleted };
}
export function useChatModels() { const { scope, enabled } = useChatScope(); return useQuery({ ...modelsOptions(chatService, scope), enabled }); }
export function useThreads() { const { scope, enabled } = useChatScope(); return useInfiniteQuery({ ...threadsOptions(chatService, scope), enabled }); }
export function useCreateThread() {
  const client = useQueryClient();
  return useMutation({ retry: false, mutationFn: async (input: { title?: string; aiModelId?: string }) => {
    const owner = getChatIdentity(); if (!owner) throw new Error('Sign in and complete onboarding to chat.');
    return { owner, thread: await chatService.create(owner, input) };
  }, onSuccess: async ({ owner, thread }) => {
    if (!chatService.isCurrent(owner)) return;
    client.setQueryData(threadKey(owner, thread.id), thread);
    await client.invalidateQueries({ queryKey: [...chatKey(owner), 'threads'] });
  } });
}
export function useThreadChange(id: string) {
  const client = useQueryClient();
  return useMutation({ retry: false, mutationFn: async (input: ThreadUpdate | 'delete') => {
    const owner = getChatIdentity(); if (!owner) throw new Error('Please sign in.');
    const thread = input === 'delete' ? await chatService.delete(owner, id) : await chatService.update(owner, id, input);
    return { owner, thread, deleted: input === 'delete' };
  }, onSuccess: async ({ owner, thread, deleted }) => {
    if (!chatService.isCurrent(owner)) return;
    if (deleted) {
      client.removeQueries({ queryKey: threadKey(owner, id) });
      client.removeQueries({ queryKey: [...chatKey(owner), 'messages', id] });
      const key = `${owner.id}:${owner.epoch}:${id}`; runs.get(key)?.stop(); runs.delete(key);
    }
    else if (thread) client.setQueryData(threadKey(owner, id), thread);
    await refreshChat(client, owner, () => chatService.isCurrent(owner));
  } });
}
export function useConversation(id: string) {
  const { scope, enabled } = useChatScope();
  const activeSince = useActiveScreen(`${scope.id}:${scope.epoch}:${id}`);
  const active = !!enabled && activeSince !== null;
  const thread = useQuery({ ...threadOptions(chatService, scope, id), enabled: active });
  const messages = useInfiniteQuery({ ...messagesOptions(chatService, scope, id), enabled: active });
  const owner = getChatIdentity();
  const key = `${scope.id}:${scope.epoch}:${id}`;
  let runner = runs.get(key);
  if (!runner && owner) { runner = createChatRunStore(chatService, owner, id, randomUUID); runs.set(key, runner); }
  // This hook is mounted only behind the authenticated chat route gate.
  if (!runner) throw new Error('Chat session is unavailable.');
  const state = useStore(runner.store);
  const client = useQueryClient();
  useEffect(() => { if (!active) runner.stop(); }, [active, runner]);
  useEffect(() => () => runner.stop(), [runner]);
  const send = async (text: string, retry = false) => {
    await (retry ? runner.retry() : runner.send(text));
    const current = getChatIdentity();
    if (current?.id === scope.id && current.epoch === scope.epoch) await refreshChat(client, current, () => chatService.isCurrent(current));
  };
  const recover = async (input: SendInput) => {
    await runner.recover(input);
    const current = getChatIdentity();
    if (current?.id === scope.id && current.epoch === scope.epoch) await refreshChat(client, current, () => chatService.isCurrent(current));
  };
  return { thread, messages, runner, state, send, recover };
}

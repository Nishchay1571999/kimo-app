import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ellipsis } from 'lucide-react-native';
import { Action, styles } from '@/features/upload/components/shared';
import { chatService, useChatModels, useConversation, useThreadChange } from '../hooks';
import type { ThreadUpdate } from '../schema';
import { ChatScreen } from './chat-screen';
import { ChatBubble } from './chat-messages';

// Questions handed over from the Ask screen are sent once per thread, even across remounts.
const handedOver = new Set<string>();
export function Conversation({ id, ask }: { id: string; ask?: string }) {
  const { thread, messages, runner, state, send, recover } = useConversation(id);
  const models = useChatModels();
  const change = useThreadChange(id);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const mutationLock = useRef(false);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const saved = [...new Map(messages.data?.pages.flat().map(message => [message.id, message])).values()].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const processing = saved.some(message => message.status === 'processing' || message.status === 'pending');
  const pendingReply = saved.find(message => message.role === 'assistant' && ['pending', 'processing'].includes(message.status));
  const pendingQuestion = pendingReply && saved.find(message => message.requestId === pendingReply.requestId && message.role === 'user');
  const savedRun = saved.find(message => message.requestId === state.run?.requestId && message.role === 'assistant');
  const savedTerminal = savedRun && !['pending', 'processing'].includes(savedRun.status);
  const unresolved = state.run?.status === 'interrupted' && !savedTerminal;
  const blocked = state.busy || change.isPending || processing;
  const canSend = !!thread.data && !thread.isError && thread.data.threadStatus === 'active' && !!messages.data && !messages.isError && !unresolved && !blocked;
  useEffect(() => {
    if (!ask || !canSend || handedOver.has(id) || saved.length > 0 || state.run) return;
    handedOver.add(id);
    void send(ask);
  }, [ask, canSend, id, saved.length, state.run, send]);
  const mutate = (input: ThreadUpdate | 'delete') => {
    if (mutationLock.current || blocked) return;
    mutationLock.current = true;
    change.mutate(input, { onSuccess: result => {
      if (!focused.current || !chatService.isCurrent(result.owner)) return;
      setTitle(null);
      if (result.deleted) router.replace('/chat/new');
    }, onSettled: () => { mutationLock.current = false; } });
  };
  const reload = () => { void thread.refetch(); void messages.refetch(); };
  const modelName = (actualId: string | null | undefined) => actualId ? models.data?.find(model => model.id === actualId)?.name ?? (actualId === thread.data?.aiModelId ? 'Selected thread model' : 'Server fallback model') : undefined;
  const activeTool = state.run?.tools.findLast(tool => tool.status === 'processing');
  return <ChatScreen value={draft} onChangeText={setDraft}
    disabled={!canSend} isResponding={state.busy} onStop={() => runner.stop()}
    onSend={text => { if (!canSend) return; setDraft(''); void send(text); }}>
    {(thread.isPending || messages.isPending) && <ActivityIndicator accessibilityLabel="Loading conversation" />}
    {(thread.isError || messages.isError) && <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{thread.error?.message ?? messages.error?.message}</Text><Action secondary onPress={reload}>Refresh conversation</Action></View>}
    {thread.data && <View style={{ gap: 12 }}>
      <View style={styles.header}>
        <Text style={[styles.section, { flex: 1 }]} numberOfLines={2}>{thread.data.title ?? 'Conversation'}{thread.data.threadStatus === 'archived' ? ' · Archived' : ''}</Text>
        <Pressable onPress={() => setOptionsOpen(!optionsOpen)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Conversation options" accessibilityState={{ expanded: optionsOpen }}>
          <Ellipsis size={22} color="#52525B" />
        </Pressable>
      </View>
      {optionsOpen && <View style={styles.card}>
      {title === null ? <Action secondary disabled={blocked} onPress={() => setTitle(thread.data?.title ?? '')}>Rename</Action> : <>
        <TextInput value={title} onChangeText={setTitle} maxLength={200} accessibilityLabel="Rename conversation" style={styles.text} />
        <Action secondary disabled={blocked || !title.trim()} onPress={() => mutate({ title: title.trim() })}>Save title</Action>
        <Action secondary disabled={change.isPending} onPress={() => setTitle(null)}>Cancel rename</Action>
      </>}
      <Action secondary disabled={blocked} onPress={() => mutate({ threadStatus: thread.data?.threadStatus === 'archived' ? 'active' : 'archived' })}>{thread.data.threadStatus === 'archived' ? 'Unarchive' : 'Archive'}</Action>
      {confirmDelete ? <><Text style={styles.error}>Delete this conversation and its messages?</Text>
        <Action secondary disabled={blocked} onPress={() => mutate('delete')}>Confirm delete</Action><Action secondary disabled={change.isPending} onPress={() => setConfirmDelete(false)}>Keep conversation</Action>
      </> : <Action secondary disabled={blocked} onPress={() => setConfirmDelete(true)}>Delete conversation</Action>}
      <Action secondary disabled={state.busy || messages.isFetching} onPress={reload}>Refresh messages</Action>
      {change.error && <Text accessibilityRole="alert" style={styles.error}>{change.error.message} Refresh if the conversation is busy.</Text>}
      </View>}
    </View>}
    {messages.hasNextPage && <Action secondary disabled={messages.isFetchingNextPage} onPress={() => { void messages.fetchNextPage(); }}>Load older messages</Action>}
    {saved.length === 0 && !messages.isPending && !!messages.data && !state.run && !ask && <Text style={styles.muted}>No messages yet. Ask your first question below.</Text>}
    {saved.filter(message => !(state.busy && message.requestId === state.run?.requestId)).map(message => <ChatBubble key={message.id} role={message.role} text={message.message} status={message.status} sources={message.metadata.sources} model={message.role === 'assistant' ? modelName(message.actualModelId) : undefined} />)}
    {state.run && (state.busy || !savedRun) && <>
      {!saved.some(message => message.requestId === state.run?.requestId && message.role === 'user') || state.busy ? <ChatBubble role="user" text={state.run.text} status="completed" /> : null}
      <ChatBubble role="assistant" text={state.run.reply} status={state.run.status} sources={state.run.sources} model={modelName(state.run.actualModelId)} activity={activeTool?.label ? `${activeTool.label}…` : undefined} />
    </>}
    {processing && !state.busy && <Text style={styles.muted}>Kimo is still working on a reply. Refresh in a moment.</Text>}
    {pendingQuestion && !state.busy && <Action secondary disabled={change.isPending} onPress={() => { void recover({ requestId: pendingQuestion.requestId, text: pendingQuestion.message }); }}>Retry saved request</Action>}
    {state.error && <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
      {state.run?.status === 'interrupted' && <Action secondary disabled={state.busy || change.isPending} onPress={() => { void send('', true); }}>Retry this request</Action>}
      <Action secondary disabled={state.busy || messages.isFetching} onPress={reload}>Check saved messages</Action>
    </View>}
  </ChatScreen>;
}

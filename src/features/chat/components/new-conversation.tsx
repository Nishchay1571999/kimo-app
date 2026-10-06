import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Action, styles, UploadPage } from '@/features/upload/components/shared';
import { chatService, useChatModels, useCreateThread } from '../hooks';
import { chatModels, defaultChatModel } from '../models';
import { ModelPickerSheet } from './model-picker-sheet';

export function NewConversation() {
  const models = useChatModels();
  const creation = useCreateThread();
  const [title, setTitle] = useState('');
  const [model, setModel] = useState(defaultChatModel);
  const [picker, setPicker] = useState(false);
  const pending = useRef(false);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const start = () => {
    if (pending.current) return;
    if (creation.data && chatService.isCurrent(creation.data.owner)) {
      router.replace({ pathname: '/chat/[threadId]', params: { threadId: creation.data.thread.id } }); return;
    }
    pending.current = true;
    creation.mutate({ ...(title.trim() ? { title: title.trim() } : {}), ...(model.id !== defaultChatModel.id ? { aiModelId: model.id } : {}) }, {
      onSuccess: result => { if (focused.current && chatService.isCurrent(result.owner)) router.replace({ pathname: '/chat/[threadId]', params: { threadId: result.thread.id } }); },
      onSettled: () => { pending.current = false; },
    });
  };
  return <UploadPage title="New chat" subtitle="Ask Kimo about your saved meals, exercise, and health history." onClose={() => router.dismissTo('/(tabs)')}>
    <View style={styles.card}>
      <Text style={styles.text}>Conversation title (optional)</Text>
      <TextInput accessibilityLabel="Conversation title" value={title} onChangeText={setTitle} maxLength={200} editable={!creation.isPending} style={styles.text} placeholder="Title from your first message" />
      <Action secondary disabled={creation.isPending} onPress={() => setPicker(true)}>{`Model: ${model.name}`}</Action>
      <Text style={styles.muted}>Server default can select models beyond the available picker. Chat supports text messages.</Text>
      {models.isPending && <ActivityIndicator accessibilityLabel="Loading models" />}
      {models.isError && <><Text style={styles.error}>Could not load model choices. You can still use the server default.</Text><Action secondary onPress={() => { void models.refetch(); }}>Reload models</Action></>}
      {creation.error && <Text accessibilityRole="alert" style={styles.error}>{creation.error.message} If the connection dropped, check History before creating another chat.</Text>}
      <Action disabled={creation.isPending} onPress={start}>{creation.isPending ? 'Creating…' : creation.data ? 'Open created chat' : 'Start chat'}</Action>
    </View>
    <ModelPickerSheet visible={picker} models={chatModels(models.data)} selectedModelId={model.id} onSelect={setModel} onClose={() => setPicker(false)} />
  </UploadPage>;
}

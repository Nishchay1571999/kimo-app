import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { signOut } from '@/features/auth/components/session-provider';
import { useSessionStore } from '@/features/auth/store/session-store';
import { useChatModels } from '@/features/chat/hooks';
import { ModelPickerSheet } from '@/features/chat/components/model-picker-sheet';
import { chatModels, defaultChatModel } from '@/features/chat/models';
import { useModelPreference } from '@/features/chat/model-preference';
import { useGoalTarget } from '@/features/goals/hooks';
import { Action, styles, UploadPage } from '@/features/upload/components/shared';

export default function SettingsScreen() {
  const account = useSessionStore(state => state.account);
  const target = useGoalTarget();
  const models = useChatModels();
  const accountId = account?.id ?? '';
  const preferred = useModelPreference(state => state.byAccount[accountId]);
  const setPreferred = useModelPreference(state => state.set);
  const [picker, setPicker] = useState(false);
  const catalog = chatModels(models.data);
  const current = catalog.find(model => model.id === preferred) ?? defaultChatModel;
  const goal = target.data?.target;
  return <UploadPage eyebrow="SETTINGS" title={account?.name ?? 'Your account'} subtitle={account?.email ?? 'Signed in'} onClose={() => router.replace('/(tabs)')}>
    <View style={styles.card}>
      <Text style={styles.section}>Daily target</Text>
      <Text style={styles.text}>{goal ? `${goal.caloriesKcal.toLocaleString('en-US')} kcal · ${goal.proteinG} g protein` : target.isPending ? 'Loading…' : 'Not set yet'}</Text>
      <Action secondary onPress={() => router.push({ pathname: '/goals/current', params: { origin: 'settings' } })}>{goal ? 'Change target' : 'Set target'}</Action>
    </View>
    <View style={styles.card}>
      <Text style={styles.section}>Advanced</Text>
      <Text style={styles.muted}>AI model for new conversations. Auto picks a reliable model and switches to a backup if it is unavailable.</Text>
      <Action secondary disabled={models.isPending && !models.isError} onPress={() => setPicker(true)}>{`AI model: ${current.name}`}</Action>
      {models.isError && <Text style={styles.muted}>Model choices are unavailable right now. Kimo will use Auto.</Text>}
    </View>
    {account && <Action secondary onPress={() => { void signOut(); }}>Sign out</Action>}
    <ModelPickerSheet visible={picker} models={catalog} selectedModelId={current.id}
      onSelect={model => setPreferred(accountId, model.id === defaultChatModel.id ? null : model.id)} onClose={() => setPicker(false)} />
  </UploadPage>;
}

import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { localChatModels } from '../models';
import { ChatComposer, type ChatComposerProps } from './chat-composer';

type ChatScreenProps = {
  children?: ReactNode;
  models?: ChatComposerProps['models'];
  isResponding?: boolean;
  onSend?: ChatComposerProps['onSend'];
  onStop?: ChatComposerProps['onStop'];
  onAttach?: ChatComposerProps['onAttach'];
};

// UI shell only: supply send, stop, and attachment handlers when chat is connected.
export function ChatScreen({ children, models = localChatModels, isResponding, onSend, onStop, onAttach }: ChatScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useRef<View>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [draft, setDraft] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id ?? '');

  return (
    <View ref={container} collapsable={false} style={[styles.screen, { backgroundColor: theme.background }]}
      onLayout={() => container.current?.measureInWindow((_x, y) => setKeyboardOffset(y))}>
      <KeyboardAvoidingView style={styles.screen} keyboardVerticalOffset={keyboardOffset}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
        <ScrollView style={styles.conversation} contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          {children}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ChatComposer value={draft} onChangeText={setDraft} models={models}
            isResponding={isResponding} onSend={onSend} onStop={onStop} onAttach={onAttach}
            selectedModelId={selectedModelId} onModelChange={(model) => setSelectedModelId(model.id)} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  conversation: { flex: 1 },
  messages: { flexGrow: 1, width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16, gap: 16 },
  footer: { paddingHorizontal: 12, paddingTop: 8 },
});

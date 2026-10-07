import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ChatComposer, type ChatComposerProps } from './chat-composer';

type ChatScreenProps = {
  children?: ReactNode;
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
  isResponding?: boolean;
  onSend?: ChatComposerProps['onSend'];
  onStop?: ChatComposerProps['onStop'];
  onAttach?: ChatComposerProps['onAttach'];
  placeholder?: string;
};

export function ChatScreen({ children, value, onChangeText, disabled, isResponding, onSend, onStop, onAttach, placeholder }: ChatScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useRef<View>(null);
  const conversation = useRef<ScrollView>(null);
  const followLatest = useRef(true);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  return (
    <View ref={container} collapsable={false} style={[styles.screen, { backgroundColor: theme.background }]}
      onLayout={() => container.current?.measureInWindow((_x, y) => setKeyboardOffset(y))}>
      <KeyboardAvoidingView style={styles.screen} keyboardVerticalOffset={keyboardOffset}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
        <ScrollView ref={conversation} style={styles.conversation} contentContainerStyle={styles.messages}
          onContentSizeChange={() => { if (followLatest.current) conversation.current?.scrollToEnd({ animated: false }); }}
          onScroll={event => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            followLatest.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
          }} scrollEventThrottle={100}
          keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          {children}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ChatComposer value={value} onChangeText={onChangeText} disabled={disabled} placeholder={placeholder}
            isResponding={isResponding} onSend={onSend} onStop={onStop} onAttach={onAttach} />
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

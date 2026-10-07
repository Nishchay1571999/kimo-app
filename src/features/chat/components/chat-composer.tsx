import { OctagonPause, Paperclip, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type ChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  isResponding?: boolean;
  disabled?: boolean;
  onSend?: (text: string) => void;
  placeholder?: string;
  onStop?: () => void;
  onAttach?: () => void;
};

const LINE_HEIGHT = 24;
const INPUT_PADDING = 8;
const MIN_HEIGHT = LINE_HEIGHT * 2 + INPUT_PADDING * 2;
const MAX_HEIGHT = LINE_HEIGHT * 3 + INPUT_PADDING * 2;

export function ChatComposer({ value, onChangeText, isResponding = false, disabled: blocked = false,
  onSend, onStop, onAttach, placeholder = 'Ask Kimo anything…' }: ChatComposerProps) {
  const theme = useTheme();
  const [contentHeight, setContentHeight] = useState(MIN_HEIGHT);
  const canSend = !blocked && value.trim().length > 0 && value.trim().length <= 8000 && !!onSend;
  const disabled = isResponding ? !onStop : !canSend;
  const inputHeight = value ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)) : MIN_HEIGHT;

  return (
    <>
      <View style={[styles.composer, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        <View style={[styles.inputArea, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
          <TextInput value={value} onChangeText={onChangeText} multiline maxLength={8000} editable={!isResponding}
            accessibilityLabel="Message Kimo" placeholder={placeholder} placeholderTextColor={theme.textSecondary}
            textAlignVertical="top" underlineColorAndroid="transparent"
            onContentSizeChange={(event) => setContentHeight(event.nativeEvent.contentSize.height)}
            scrollEnabled={contentHeight > MAX_HEIGHT} submitBehavior="newline"
            style={[styles.input, { color: theme.text, height: inputHeight },
              Platform.OS === 'web' && styles.webInput]} />
          <View style={styles.actions}>
            {onAttach && <Pressable onPress={onAttach} style={({ pressed }) => [styles.attachment, { opacity: pressed ? 0.5 : 1 }]}
              accessibilityRole="button" accessibilityLabel="Attach files">
              <Paperclip size={21} color={theme.textSecondary} strokeWidth={1.75} />
            </Pressable>}
            <Pressable disabled={disabled} hitSlop={4} accessibilityRole="button"
              accessibilityLabel={isResponding ? 'Stop response' : 'Send message'}
              accessibilityState={{ disabled }}
              onPress={() => {
                if (isResponding) onStop?.();
                else if (canSend) onSend?.(value.trim());
              }}
              style={({ pressed }) => [styles.primary, {
                backgroundColor: disabled ? theme.backgroundElement : theme.text,
                opacity: pressed ? 0.65 : 1,
              }]}>
              {isResponding
                ? <OctagonPause size={20} color={theme.background} strokeWidth={1.75} />
                : <Send size={19} color={disabled ? theme.textSecondary : theme.background} strokeWidth={1.75} />}
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  composer: { width: '100%', maxWidth: 800, alignSelf: 'center', borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  inputArea: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 22, paddingLeft: 16, paddingRight: 8, paddingVertical: 8 },
  input: { flex: 1, minWidth: 0, paddingHorizontal: 0, paddingVertical: INPUT_PADDING, fontSize: 16, lineHeight: LINE_HEIGHT },
  webInput: { outlineWidth: 0, overflowY: 'auto' } as import('react-native').TextStyle,
  actions: { justifyContent: 'space-between', alignItems: 'center', marginLeft: 8, gap: 4 },
  attachment: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  primary: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

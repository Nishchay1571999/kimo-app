import { Image } from 'expo-image';
import { ChevronDown, OctagonPause, Paperclip, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ChatModel } from '../models';
import { ModelPickerSheet } from './model-picker-sheet';

export type ChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  models: readonly ChatModel[];
  selectedModelId: string;
  onModelChange: (model: ChatModel) => void;
  isResponding?: boolean;
  onSend?: (text: string, model: ChatModel) => void;
  onStop?: () => void;
  onAttach?: () => void;
};

const LINE_HEIGHT = 24;
const INPUT_PADDING = 8;
const MIN_HEIGHT = LINE_HEIGHT * 2 + INPUT_PADDING * 2;
const MAX_HEIGHT = LINE_HEIGHT * 3 + INPUT_PADDING * 2;

export function ChatComposer({ value, onChangeText, models, selectedModelId, onModelChange,
  isResponding = false, onSend, onStop, onAttach }: ChatComposerProps) {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(MIN_HEIGHT);
  const selectedModel = models.find((model) => model.id === selectedModelId) ?? models[0];
  const canSend = value.trim().length > 0 && !!selectedModel;
  const disabled = !isResponding && !canSend;
  const inputHeight = value ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)) : MIN_HEIGHT;

  return (
    <>
      <View style={[styles.composer, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        <Pressable disabled={!models.length} accessibilityRole="button"
          accessibilityLabel={`Change model, current model ${selectedModel?.name ?? 'none'}`}
          accessibilityState={{ expanded: pickerOpen, disabled: !models.length }}
          onPress={() => { Keyboard.dismiss(); setPickerOpen(true); }}
          style={({ pressed }) => [styles.header, { opacity: pressed ? 0.6 : 1 }]}>
          {selectedModel && <View style={styles.logoTile}>
            <Image source={selectedModel.logo} style={styles.logo} contentFit="contain" />
          </View>}
          <Text style={[styles.modelName, { color: theme.text }]} numberOfLines={1}>
            {selectedModel?.name ?? 'Choose a model'}
          </Text>
          <Text style={[styles.modelLabel, { color: theme.textSecondary }]}>Model</Text>
          <ChevronDown size={16} color={theme.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <View style={[styles.inputArea, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
          <TextInput value={value} onChangeText={onChangeText} multiline
            accessibilityLabel="Message AI" placeholder="Message AI…" placeholderTextColor={theme.textSecondary}
            textAlignVertical="top" underlineColorAndroid="transparent"
            onContentSizeChange={(event) => setContentHeight(event.nativeEvent.contentSize.height)}
            scrollEnabled={contentHeight > MAX_HEIGHT} submitBehavior="newline"
            style={[styles.input, { color: theme.text, height: inputHeight },
              Platform.OS === 'web' && styles.webInput]} />
          <View style={styles.actions}>
            <Pressable onPress={onAttach} style={({ pressed }) => [styles.attachment, { opacity: pressed ? 0.5 : 1 }]}
              accessibilityRole="button" accessibilityLabel="Attach files">
              <Paperclip size={21} color={theme.textSecondary} strokeWidth={1.75} />
            </Pressable>
            <Pressable disabled={disabled} hitSlop={4} accessibilityRole="button"
              accessibilityLabel={isResponding ? 'Stop response' : 'Send message'}
              accessibilityState={{ disabled }}
              onPress={() => {
                if (isResponding) onStop?.();
                else if (canSend) onSend?.(value.trim(), selectedModel);
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
      <ModelPickerSheet visible={pickerOpen} models={models} selectedModelId={selectedModel?.id ?? ''}
        onSelect={onModelChange} onClose={() => setPickerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  composer: { width: '100%', maxWidth: 800, alignSelf: 'center', borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingHorizontal: 16, paddingVertical: 6 },
  logoTile: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#E0E1E6', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 22, height: 22 },
  modelName: { flex: 1, fontSize: 14, fontWeight: '500' },
  modelLabel: { fontSize: 12 },
  inputArea: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingLeft: 16, paddingRight: 8, paddingVertical: 8 },
  input: { flex: 1, minWidth: 0, paddingHorizontal: 0, paddingVertical: INPUT_PADDING, fontSize: 16, lineHeight: LINE_HEIGHT },
  webInput: { outlineWidth: 0, overflowY: 'auto' } as import('react-native').TextStyle,
  actions: { justifyContent: 'space-between', alignItems: 'center', marginLeft: 8, gap: 4 },
  attachment: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  primary: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

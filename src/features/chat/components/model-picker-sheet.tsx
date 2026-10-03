import { Image } from 'expo-image';
import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import type { ChatModel } from '../models';

type ModelPickerSheetProps = {
  visible: boolean;
  models: readonly ChatModel[];
  selectedModelId: string;
  onSelect: (model: ChatModel) => void;
  onClose: () => void;
};

export function ModelPickerSheet({ visible, models, selectedModelId, onSelect, onClose }: ModelPickerSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <Pressable style={styles.backdrop} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="Dismiss model selector" />
        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 16) }]}
          accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">Choose a model</Text>
            <Pressable onPress={onClose} style={styles.close}
              accessibilityRole="button" accessibilityLabel="Close model selector">
              <X size={22} color={theme.textSecondary} strokeWidth={1.75} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.models}>
            {models.map((model) => {
              const selected = selectedModelId === model.id;
              return (
                <Pressable key={model.id} accessibilityRole="radio"
                  accessibilityState={{ selected }} accessibilityLabel={model.name}
                  onPress={() => { onSelect(model); onClose(); }}
                  style={({ pressed }) => [styles.model, {
                    backgroundColor: selected || pressed ? theme.backgroundElement : theme.background,
                  }]}>
                  <View style={styles.logoTile}>
                    <Image source={model.logo} style={styles.logo} contentFit="contain" />
                  </View>
                  <Text style={[styles.modelName, { color: theme.text }]}>{model.name}</Text>
                  {selected && <Check size={20} color={theme.text} strokeWidth={2} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  backdrop: { flex: 1 },
  sheet: { width: '100%', maxWidth: 640, maxHeight: '80%', alignSelf: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 12, paddingTop: 12, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  models: { paddingHorizontal: 16, gap: 4 },
  model: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, minHeight: 64, borderRadius: 16 },
  // A neutral tile keeps the white Qwen and black OpenAI assets visible in both themes.
  logoTile: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E0E1E6', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 28, height: 28 },
  modelName: { flex: 1, fontSize: 16, fontWeight: '500' },
});

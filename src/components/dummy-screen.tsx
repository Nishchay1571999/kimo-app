import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export type DummyAction = {
  label: string;
  href?: Href;
  onPress?: () => void;
  replace?: boolean;
};

export function DummyScreen({ title, description, details = [], actions }: {
  title: string;
  description: string;
  details?: string[];
  actions: DummyAction[];
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">KIMO · DEMO</ThemedText>
          <ThemedText type="subtitle" accessibilityRole="header">{title}</ThemedText>
          <ThemedText themeColor="textSecondary">{description}</ThemedText>
          {details.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.card}>
              {details.map((detail) => <ThemedText key={detail}>{detail}</ThemedText>)}
            </ThemedView>
          )}
          <View style={styles.actions}>
            {actions.map(({ label, href, onPress, replace }) => (
              <Pressable key={label} accessibilityRole="button"
                onPress={() => {
                  onPress?.();
                  if (href) {
                    if (replace) router.replace(href);
                    else router.push(href);
                  }
                }}
                style={({ pressed }) => [styles.button, {
                  backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.65 : 1,
                }]}>
                <ThemedText>{label}</ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Placeholder screen. Actions simulate navigation; no real data is saved.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20, width: '100%', maxWidth: 600, alignSelf: 'center' },
  card: { padding: 20, gap: 12, borderRadius: 16 },
  actions: { gap: 12 },
  button: { minHeight: 48, padding: 16, borderRadius: 12, justifyContent: 'center' },
});

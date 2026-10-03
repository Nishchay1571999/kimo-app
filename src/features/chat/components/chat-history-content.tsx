import { router } from 'expo-router';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from 'expo-router/drawer';
import { MessageSquare, SquarePen } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

// Use the existing demo thread until saved conversations are available.
const threads = [
  { id: 'demo-thread-1' },
  { id: 'demo-thread-2' },
  { id: 'demo-thread-3' },
  { id: 'demo-thread-4' },
  { id: 'demo-thread-5' },
];

export function ChatHistoryContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const activeRoute = props.state.routes[props.state.index];
  const activeThreadId = activeRoute.name === '[threadId]' && activeRoute.params && 'threadId' in activeRoute.params
    ? activeRoute.params.threadId
    : undefined;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <DrawerItem
        label="New chat"
        icon={() => <SquarePen size={20} strokeWidth={1.75} color={theme.text} />}
        accessibilityLabel="New chat"
        focused={activeRoute.name === 'new'}
        activeTintColor={theme.text}
        inactiveTintColor={theme.text}
        activeBackgroundColor={theme.backgroundElement}
        labelStyle={[styles.label, styles.newChatLabel]}
        style={styles.item}
        onPress={() => {
          props.navigation.closeDrawer();
          router.navigate({ pathname: '/chat/new' });
        }}
      />
      <ThemedText themeColor="textSecondary" accessibilityRole="header" style={styles.historyHeading}>
        History
      </ThemedText>
      {threads.map((thread, index) => (
        <DrawerItem
          key={thread.id}
          label={String(index + 1)}
          icon={() => <MessageSquare size={20} strokeWidth={1.5} color={theme.textSecondary} />}
          accessibilityLabel={`Open thread ${index + 1}`}
          focused={activeThreadId === thread.id}
          activeTintColor={theme.text}
          inactiveTintColor={theme.text}
          activeBackgroundColor={theme.backgroundElement}
          labelStyle={styles.label}
          style={styles.item}
          onPress={() => {
            props.navigation.closeDrawer();
            router.navigate({ pathname: '/chat/[threadId]', params: { threadId: thread.id } });
          }}
        />
      ))}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 2 },
  item: { borderRadius: 10, minHeight: 48 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  newChatLabel: { fontWeight: '500' },
  historyHeading: { fontSize: 13, lineHeight: 18, fontWeight: '500', paddingHorizontal: 16, marginTop: 28, marginBottom: 8 },
});

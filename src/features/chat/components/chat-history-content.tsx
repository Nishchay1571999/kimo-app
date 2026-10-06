import { router } from 'expo-router';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from 'expo-router/drawer';
import { MessageSquare, SquarePen } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useThreads } from '../hooks';

export function ChatHistoryContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const history = useThreads();
  const threads = [...new Map(history.data?.pages.flat().map(thread => [thread.id, thread])).values()];
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
      {history.isPending && <ActivityIndicator accessibilityLabel="Loading chat history" />}
      {history.isError && <ThemedText accessibilityRole="alert">{history.error.message}</ThemedText>}
      <DrawerItem label="Refresh history" onPress={() => { void history.refetch(); }} />
      {!history.isPending && !history.isError && !threads.length && <ThemedText themeColor="textSecondary" style={styles.historyHeading}>No conversations yet.</ThemedText>}
      {threads.map((thread) => (
        <DrawerItem
          key={thread.id}
          label={`${thread.title ?? 'Untitled conversation'}${thread.threadStatus === 'archived' ? ' · Archived' : ''}`}
          icon={() => <MessageSquare size={20} strokeWidth={1.5} color={theme.textSecondary} />}
          accessibilityLabel={`Open ${thread.title ?? 'Untitled conversation'}`}
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
      {history.hasNextPage && <DrawerItem label={history.isFetchingNextPage ? 'Loading…' : 'Load more conversations'} onPress={() => { if (!history.isFetchingNextPage) void history.fetchNextPage(); }} />}
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

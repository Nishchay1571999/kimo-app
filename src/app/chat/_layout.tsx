import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ChatHistoryContent } from '@/features/chat/components/chat-history-content';
import { useTheme } from '@/hooks/use-theme';

export default function ChatLayout() {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        initialRouteName="new"
        backBehavior="history"
        drawerContent={(props) => <ChatHistoryContent {...props} />}
        screenOptions={{
          drawerType: 'slide',
          headerStatusBarHeight: 0,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          drawerStyle: { backgroundColor: theme.background },
          sceneStyle: { backgroundColor: theme.background },
        }}>
        <Drawer.Screen name="new" options={{ title: 'New chat', }} />
        <Drawer.Screen name="[threadId]" options={{ title: 'Conversation' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { X } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
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
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chat and return home"
              onPress={() => {
                // Remove the chat navigator so Back from Home cannot reopen it.
                router.dismissTo('/(tabs)');
              }}
              style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}>
              <X size={22} strokeWidth={1.75} color={theme.text} />
            </Pressable>
          ),
          drawerStyle: { backgroundColor: theme.background },
          sceneStyle: { backgroundColor: theme.background },
        }}>
        <Drawer.Screen name="new" options={{ title: 'New chat' }} />
        <Drawer.Screen name="[threadId]" options={{ title: 'Conversation' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    width: 44,
    height: 44,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

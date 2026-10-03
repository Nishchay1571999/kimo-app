import { router, Tabs } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { useDemoSession } from '@/context/demo-session';
import { AISignInSheet } from '@/features/auth/components/ai-sign-in-sheet';

export default function TabsLayout() {
  const { session } = useDemoSession();
  const [showSignIn, setShowSignIn] = useState(false);
  return (
    <View style={styles.container}>
      <View
        style={styles.container}
        accessibilityElementsHidden={showSignIn}
        importantForAccessibility={showSignIn ? 'no-hide-descendants' : 'auto'}>
        <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen
            name="ai"
            options={{ title: 'KIMO' }}
            listeners={{
              tabPress: (event) => {
                event.preventDefault();
                if (session.mode === 'account') router.push('/chat/new');
                else setShowSignIn(true);
              },
            }}
          />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>
      {showSignIn && <AISignInSheet onClose={() => setShowSignIn(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });

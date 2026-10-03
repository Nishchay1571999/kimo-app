import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Brain, BrainCircuit, House, HousePlug, UserRoundPlus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const tabIcons = {
  index: { inactive: House, active: HousePlug },
  ai: { inactive: Brain, active: BrainCircuit },
  profile: { inactive: UserRoundPlus, active: UserRoundPlus },
};

export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundElement,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}>
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const icons = tabIcons[route.name as keyof typeof tabIcons];
          if (!icons) return null;

          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const Icon = focused ? icons.active : icons.inactive;
          const color = focused ? theme.text : theme.textSecondary;
          const label = options.title ?? route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected: focused }}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.tab,
                { backgroundColor: focused ? theme.backgroundSelected : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <Icon size={24} color={color} strokeWidth={focused ? 2.2 : 1.8} />
              <Text style={[styles.label, { color }, focused && styles.selectedLabel]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    minHeight: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedLabel: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
});

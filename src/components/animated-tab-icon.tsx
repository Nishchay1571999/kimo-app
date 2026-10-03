import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export function AnimatedTabIcon({
  inactive: InactiveIcon,
  active: ActiveIcon,
  focused,
}: {
  inactive: LucideIcon;
  active: LucideIcon;
  focused: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(focused ? 1 : 0);
  const emphasis = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    const target = focused ? 1 : 0;
    progress.value = reducedMotion ? target : withTiming(target, { duration: 200 });
    emphasis.value = reducedMotion
      ? target
      : withSpring(target, { damping: 12, stiffness: 220, mass: 0.6 });
  }, [focused, reducedMotion, progress, emphasis]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reducedMotion ? 0 : -2 * emphasis.value },
      { scale: reducedMotion ? 1 : 1 + 0.1 * emphasis.value },
    ],
  }));
  const inactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: reducedMotion ? 1 : 1 - 0.15 * progress.value }],
  }));
  const activeStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: reducedMotion ? 1 : 0.85 + 0.15 * progress.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.icon, containerStyle]}>
      <Animated.View style={[styles.layer, inactiveStyle]}>
        <InactiveIcon size={24} color={theme.textSecondary} strokeWidth={1.8} />
      </Animated.View>
      <Animated.View style={[styles.layer, activeStyle]}>
        <ActiveIcon size={24} color={theme.text} strokeWidth={2.2} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24 },
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});

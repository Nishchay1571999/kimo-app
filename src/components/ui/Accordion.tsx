import { createContext, useContext, useState } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Button, ButtonText } from '@/components/ui/Button';
import { cn } from '@/utils/lib';

const animationConfig = { duration: 200, reduceMotion: ReduceMotion.System };

const AccordionContext = createContext<{
  value: string | undefined;
  toggle: (value: string) => void;
} | null>(null);
const ItemContext = createContext<string | null>(null);

export function Accordion({ defaultValue, style, children, ...props }: ViewProps & { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <AccordionContext.Provider value={{
      value,
      toggle: (next) => setValue((current) => current === next ? undefined : next),
    }}>
      <View style={cn<ViewStyle>(styles.root, style)} {...props}>{children}</View>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, style, children, ...props }: ViewProps & { value: string }) {
  return (
    <ItemContext.Provider value={value}>
      <View style={cn<ViewStyle>(styles.item, style)} {...props}>{children}</View>
    </ItemContext.Provider>
  );
}

function useAccordionItem() {
  const accordion = useContext(AccordionContext);
  const value = useContext(ItemContext);
  if (!accordion || value === null) throw new Error('AccordionItem must be inside Accordion.');
  return { open: accordion.value === value, toggle: () => accordion.toggle(value) };
}

export function AccordionTrigger({ children }: { children: string }) {
  const { open, toggle } = useAccordionItem();
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open ? '225deg' : '45deg', animationConfig) }],
  }));
  return (
    <Button
      variant="ghost"
      onPress={toggle}
      accessibilityLabel={children}
      accessibilityState={{ expanded: open }}
      style={styles.trigger}
    >
      <ButtonText style={styles.triggerText}>{children}</ButtonText>
      <Animated.View
        accessible={false}
        style={[styles.chevron, chevronStyle]}
      />
    </Button>
  );
}

export function AccordionContent({ style, onLayout, ...props }: ViewProps) {
  const { open } = useAccordionItem();
  const [contentHeight, setContentHeight] = useState(0);
  const contentStyle = useAnimatedStyle(() => ({
    height: withTiming(open ? contentHeight : 0, animationConfig),
    opacity: withTiming(open ? 1 : 0, animationConfig),
  }));

  return (
    <Animated.View
      style={[styles.contentWrapper, contentStyle]}
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!open}
    >
      <View
        {...props}
        style={cn<ViewStyle>(styles.content, style)}
        onLayout={(event) => {
          setContentHeight(event.nativeEvent.layout.height);
          onLayout?.(event);
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  item: { borderBottomWidth: 1, borderBottomColor: '#E4E4E7' },
  trigger: {
    minHeight: 52, height: 'auto', justifyContent: 'space-between',
    paddingHorizontal: 0, paddingVertical: 16, borderRadius: 0, gap: 16,
  },
  triggerText: { flex: 1, textAlign: 'left', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  chevron: {
    width: 8, height: 8, borderRightWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: '#71717A', marginRight: 4,
  },
  contentWrapper: { overflow: 'hidden' },
  content: { position: 'absolute', width: '100%', paddingBottom: 16, gap: 10 },
});

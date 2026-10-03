import { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps, type ViewStyle } from 'react-native';

import { cn } from '@/utils/lib';

const RadioContext = createContext<{
  value?: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  disabled: boolean;
} | null>(null);

export function RadioGroup({ value, onValueChange, onBlur, disabled = false, style, children, ...props }:
  ViewProps & { value?: string; onValueChange: (value: string) => void; onBlur?: () => void; disabled?: boolean }) {
  return (
    <RadioContext.Provider value={{ value, onValueChange, onBlur, disabled }}>
      <View accessibilityRole="radiogroup" style={cn<ViewStyle>(styles.group, style)} {...props}>
        {children}
      </View>
    </RadioContext.Provider>
  );
}

export function RadioGroupItem({ value, label, description }: { value: string; label: string; description?: string }) {
  const group = useContext(RadioContext);
  if (!group) throw new Error('RadioGroupItem must be inside RadioGroup.');
  const checked = group.value === value;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked, disabled: group.disabled }}
      disabled={group.disabled}
      onBlur={group.onBlur}
      onPress={() => { group.onValueChange(value); group.onBlur?.(); }}
      style={({ pressed }) => cn<ViewStyle>(
        styles.item, checked && styles.selected, pressed && styles.pressed,
        group.disabled && styles.disabled,
      )}
    >
      <View style={cn<ViewStyle>(styles.radio, checked && styles.radioSelected)}>
        {checked && <View style={styles.indicator} />}
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center', minHeight: 48, padding: 12, gap: 12,
    borderWidth: 1, borderColor: '#E4E4E7', borderRadius: 10, backgroundColor: '#FFFFFF',
  },
  selected: { borderColor: '#18181B', backgroundColor: '#FAFAFA' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#A1A1AA', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#18181B' },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#18181B' },
  text: { flex: 1, gap: 4 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: '#18181B' },
  description: { fontSize: 13, lineHeight: 19, color: '#71717A' },
});

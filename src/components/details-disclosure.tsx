import { ChevronDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Keeps technical metadata (sources, models, statuses) available but out of the main reading path. */
export function DetailsDisclosure({ label = 'View details', children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View>
    <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} hitSlop={6}
      style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.6 }]}>
      <Text style={styles.label}>{open ? 'Hide details' : label}</Text>
      <ChevronDown size={14} color="#71717A" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
    </Pressable>
    {open && <View style={styles.body}>{children}</View>}
  </View>;
}
export const detailStyles = StyleSheet.create({
  row: { fontSize: 13, lineHeight: 19, color: '#52525B' },
});
const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#71717A' },
  body: { marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#F4F4F5', gap: 6 },
});

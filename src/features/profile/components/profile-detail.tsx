import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailHeading}>
        <Icon size={15} color="#60646C" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexGrow: 1,
    flexBasis: 72,
    gap: 6,
  },
  detailHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailLabel: {
    color: '#60646C',
    fontSize: 12,
    lineHeight: 18,
  },
  detailValue: {
    color: '#17171A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});

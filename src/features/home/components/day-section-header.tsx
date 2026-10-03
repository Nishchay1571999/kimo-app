import { Pressable, StyleSheet, Text, View } from 'react-native';

export function DaySectionHeader({
  title,
  eyebrow,
}: {
  title: string;
  eyebrow: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Pressable style={styles.historyButton}>
        <Text style={styles.historyButtonText}>History</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: 27,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9A9BA2',
  },

  sectionTitle: {
    marginTop: 3,
    fontSize: 26,
    fontWeight: '700',
    color: '#17171A',
  },

  historyButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E5',
  },

  historyButtonText: {
    fontSize: 13,
    color: '#5553D7',
    fontWeight: '600',
  },
});

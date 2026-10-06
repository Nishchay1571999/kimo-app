import { StyleSheet, Text, View } from 'react-native';

import type { TimelineEntryData, TimelineItemData } from '../types';
import { EntryCard } from './entry-card';

export function Timeline({ items, onOpenEntry }: { items: readonly TimelineItemData[]; onOpenEntry: (entryId: string) => void }) {
  return (
    <View style={styles.timeline}>
      {items.map((item, index) => item.kind === 'entry'
        ? <TimelineEntry key={item.id} entry={item.entry} onPress={() => onOpenEntry(item.entry.id)} />
        : <TimelineBoundary key={item.id} label={`${item.time}${item.eventDate ? `\n${item.eventDate}` : ''}`}
          description={item.label} bottom={index === items.length - 1} />)}
    </View>
  );
}

function TimelineBoundary({
  label,
  bottom,
  description,
}: {
  label: string;
  bottom?: boolean;
  description: string;
}) {
  return (
    <View
      style={[
        styles.timelineBoundary,
        bottom && styles.timelineBoundaryBottom,
      ]}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.boundaryTime}>{label}</Text>
      </View>

      <View style={styles.boundaryContent}>
        <Text style={{ marginLeft: 14, color: '#777983', fontSize: 12 }}>{description}</Text>
        <View style={styles.boundaryDot} />
        <View style={styles.boundaryLine} />
      </View>
    </View>
  );
}

function TimelineEntry({
  entry,
  onPress,
}: {
  entry: TimelineEntryData;
  onPress: () => void;
}) {
  return (
    <View style={styles.timelineEntry}>
      <View style={styles.timeColumn}>
        <Text style={styles.timelineTime}>{entry.time}</Text>
        {entry.eventDate && <Text style={{ fontSize: 10, color: '#777983', textAlign: 'right' }}>{entry.eventDate}</Text>}
      </View>

      <View style={styles.timelineRail}>
        <View style={styles.timelineLine} />

        <View
          style={[
            styles.timelineDot,
            entry.type === 'image' && styles.imageDot,
            entry.type === 'audio' && styles.audioDot,
            entry.type === 'text' && styles.textDot,
          ]}
        />
      </View>

      <View style={styles.entryContent}>
        <EntryCard entry={entry} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    marginTop: 27,
    paddingHorizontal: 16,
  },

  timelineBoundary: {
    minHeight: 46,
    flexDirection: 'row',
  },

  timelineBoundaryBottom: {
    marginTop: -1,
  },

  timeColumn: {
    width: 72,
    paddingRight: 12,
    alignItems: 'flex-end',
  },

  boundaryTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B1B6',
  },

  boundaryContent: {
    flex: 1,
    position: 'relative',
  },

  boundaryDot: {
    position: 'absolute',
    left: -5,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C9C9CE',
  },

  boundaryLine: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E5E3',
  },

  timelineEntry: {
    flexDirection: 'row',
    minHeight: 135,
  },

  timelineTime: {
    paddingTop: 8,
    fontSize: 12,
    color: '#777983',
    textAlign: 'right',
  },

  timelineRail: {
    width: 22,
    position: 'relative',
    alignItems: 'center',
  },

  timelineLine: {
    position: 'absolute',
    width: 1.5,
    top: 0,
    bottom: 0,
    backgroundColor: '#DDDDE0',
  },

  timelineDot: {
    marginTop: 9,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#FAFAF8',
  },

  imageDot: {
    backgroundColor: '#4AAA6D',
  },

  audioDot: {
    backgroundColor: '#5C68E6',
  },

  textDot: {
    backgroundColor: '#E09548',
  },

  entryContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
});

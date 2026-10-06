import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TimelineEntryData } from '../types';
import { AnalysisSummary } from '../../entries/components/analysis-summary';

export function EntryCard({
  entry,
  onPress,
}: {
  entry: TimelineEntryData;
  onPress: () => void;
}) {
  const content = entry.type === 'image' ? <ImageEntryCard entry={entry} />
    : entry.type === 'audio' ? <AudioEntryCard entry={entry} /> : <TextEntryCard entry={entry} />;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${entry.title}`} onPress={onPress}>{content}{entry.outsideSchedule && <Text style={{ fontSize: 11, color: '#777983', marginTop: 5 }}>Outside your usual schedule</Text>}</Pressable>;
}

function ImageEntryCard({
  entry,
}: {
  entry: TimelineEntryData;
}) {
  return (
    <View style={[styles.noticeCard, styles.imageCard]}>
      <View style={styles.pin} />

      <Image
        source={{ uri: entry.image }}
        style={styles.noticeImage}
      />

      <View style={styles.noticeBody}>
        <EntryTypeTag label="Photo" />

        <Text style={styles.entryTitle}>
          {entry.title}
        </Text>

        <EntryDescription description={entry.description} numberOfLines={2} />
        <AnalysisSummary ai={entry.ai} compact />
      </View>
    </View>
  );
}

function AudioEntryCard({
  entry,
}: {
  entry: TimelineEntryData;
}) {
  return (
    <View style={[styles.noticeCard, styles.audioCard]}>
      <View style={styles.pin} />

      <EntryTypeTag label="Voice note" />

      <Text style={styles.entryTitle}>
        {entry.title}
      </Text>

      <Text style={styles.audioDuration}>Audio attachment{entry.duration ? ` · ${entry.duration}` : ''}</Text>

      <EntryDescription description={entry.description} numberOfLines={2} />
      <AnalysisSummary ai={entry.ai} compact />
    </View>
  );
}

function TextEntryCard({
  entry,
}: {
  entry: TimelineEntryData;
}) {
  return (
    <View style={[styles.noticeCard, styles.textCard]}>
      <View style={styles.pin} />

      <EntryTypeTag label={entry.category === 'nutrition' ? 'Meal' : entry.category === 'exercise' ? 'Exercise' : 'Note'} />

      <Text style={styles.entryTitle}>
        {entry.title}
      </Text>

      <EntryDescription description={entry.description} />
      <AnalysisSummary ai={entry.ai} compact />
    </View>
  );
}

function EntryDescription({
  description,
  numberOfLines,
}: {
  description?: string;
  numberOfLines?: number;
}) {
  if (!description) return null;

  return (
    <Text style={styles.entryDescription} numberOfLines={numberOfLines}>
      {description}
    </Text>
  );
}

function EntryTypeTag({
  label,
}: {
  label: string;
}) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    minHeight: 112,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    position: 'relative',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 7,

    elevation: 1,
  },

  imageCard: {
    flexDirection: 'row',
    backgroundColor: '#F6FAF4',
    borderColor: '#E1EBDE',
  },

  pin: {
    position: 'absolute',
    top: -5,
    left: '50%',
    width: 22,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(224, 207, 169, 0.7)',
    transform: [{ rotate: '-3deg' }],
    zIndex: 4,
  },

  noticeImage: {
    width: 90,
    height: 90,
    borderRadius: 13,
    backgroundColor: '#E5E5E5',
  },

  noticeBody: {
    flex: 1,
    marginLeft: 13,
  },

  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222329',
  },

  entryDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: '#777983',
  },

  audioCard: {
    backgroundColor: '#F4F6FD',
    borderColor: '#E0E4F3',
  },

  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 7,
  },

  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  playIcon: {
    marginLeft: 2,
    fontSize: 12,
    color: '#555DDB',
  },

  audioDuration: {
    fontSize: 11,
    color: '#81838C',
  },

  textCard: {
    backgroundColor: '#FFF8ED',
    borderColor: '#F0E4D2',
  },

  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },

  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#676871',
  },

  audioWave: {
    flex: 1,
    height: 32,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  audioBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: '#7B82DE',
  },
});

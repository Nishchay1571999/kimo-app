import { Ruler, Scale, UserRound } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { ProfileDetail } from './profile-detail';

type ProfileCardProps = {
  profile: {
    name: string;
    age: number;
    height: number;
    weight: number;
    avatar: string;
  };
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: profile.avatar }}
          style={styles.avatar}
          accessibilityLabel={`${profile.name}'s profile photo`}
        />
        <View style={styles.profileInformation}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.profileSubtitle}>Your health at a glance</Text>
        </View>
      </View>
      <View style={styles.profileDetails}>
        <ProfileDetail
          icon={UserRound}
          label="Age"
          value={`${profile.age} years`}
        />

        <ProfileDetail
          icon={Ruler}
          label="Height"
          value={`${profile.height} cm`}
        />

        <ProfileDetail
          icon={Scale}
          label="Weight"
          value={`${profile.weight} kg`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDEDEE',
    gap: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECECEF',
  },
  profileInformation: { flex: 1 },
  name: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: '#17171A',
    letterSpacing: -0.5,
  },
  profileSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#60646C',
    marginTop: 4,
  },
  profileDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EDEDEE',
  },
});

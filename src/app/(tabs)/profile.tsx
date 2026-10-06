import { Dumbbell, Utensils } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ContributionHeatmap } from '@/features/profile/components/contribution-heatmap';
import { ProfileCard } from '@/features/profile/components/profile-card';
import { Button, ButtonText } from '@/components/ui/Button';
import { signOut } from '@/features/auth/components/session-provider';
import { useSessionStore } from '@/features/auth/store/session-store';
import { StreakCard } from '@/features/profile/components/streak-card';
import {
    EXERCISE_ACTIVITY,
    EXERCISE_COLORS,
    FOOD_ACTIVITY,
    FOOD_COLORS,
    PROFILE,
} from '@/features/profile/data';

function getPreviousMonth() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

export default function ProfileScreen() {
  const account = useSessionStore((state) => state.account);
  const previousMonth = useMemo(
    () => getPreviousMonth(),
    [],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileCard profile={PROFILE} />
        {account && <Button variant="outline" onPress={() => { void signOut(); }}><ButtonText>Sign out</ButtonText></Button>}

        <StreakCard maxStreak={PROFILE.maxStreak} />

        <ContributionHeatmap
          title="Food Bingo"
          orientation="days-horizontal"
          icon={Utensils}
          iconColor="#25833C"
          iconBackground="#E9F5E9"
          colors={FOOD_COLORS}
          activity={FOOD_ACTIVITY}
          month={previousMonth}
        />

        <ContributionHeatmap
          title="Exercise Bingo"
          orientation="days-horizontal"
          icon={Dumbbell}
          iconColor="#275EBA"
          iconBackground="#E8F0FF"
          colors={EXERCISE_COLORS}
          activity={EXERCISE_ACTIVITY}
          month={previousMonth}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  container: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  pageTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '700',
    color: '#17171A',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
});

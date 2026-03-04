// app/(tabs)/feed.tsx
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from '@/src/components/Text';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RunIcon from '@/assets/icons/run.svg';
import WalkIcon from '@/assets/icons/walk.svg';
import SkrIcon from '@/assets/icons/skr.svg';
import { useActivitiesStore } from '@/store/activitiesStore';
import { useChallengesStore } from '@/store/Challengestore';

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get from stores
  const {
    activities,
    loading: activitiesLoading,
    fetchActivities,
  } = useActivitiesStore();
  const {
    challenges,
    loading: challengesLoading,
    fetchChallenges,
  } = useChallengesStore();

  const [refreshing, setRefreshing] = useState(false);

  const loading = activitiesLoading || challengesLoading;

  useEffect(() => {
    fetchActivities();
    fetchChallenges();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchActivities(), fetchChallenges()]);
    setRefreshing(false);
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size='large' color='#FF3D00' />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor='#FF3D00'
          />
        }
      >
        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No activities yet</Text>
              <Text style={styles.emptySubtext}>
                Start recording your first activity!
              </Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    // TODO: Navigate to activity detail
                    console.log('View activity:', activity.id);
                  }}
                >
                  {/* Header */}
                  <View style={styles.activityHeader}>
                    <View style={styles.activityTitleRow}>
                      {activity.type === 'run' ? (
                        <RunIcon width={26} height={26} color='#FFFFFF' />
                      ) : (
                        <WalkIcon width={26} height={26} color='#FFFFFF' />
                      )}
                      <View style={styles.activityTitleInfo}>
                        <Text style={styles.activityTitle}>
                          {activity.title}
                        </Text>
                        <Text style={styles.activityDate}>{activity.date}</Text>
                      </View>
                    </View>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>

                  {/* Stats */}
                  <View style={styles.activityStats}>
                    <View style={styles.activityStat}>
                      <Text style={styles.activityStatLabel}>Dist</Text>
                      <Text style={styles.activityStatValue}>
                        {formatDistance(activity.distance)}km
                      </Text>
                    </View>
                    <View style={styles.activityStat}>
                      <Text style={styles.activityStatLabel}>Pace</Text>
                      <Text style={styles.activityStatValue}>
                        {activity.pace}/km
                      </Text>
                    </View>
                    <View style={styles.activityStat}>
                      <Text style={styles.activityStatLabel}>Time</Text>
                      <Text style={styles.activityStatValue}>
                        {formatDuration(activity.duration)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenges</Text>
          <Text style={styles.sectionSubtitle}>
            Stake +10K $SKR to join challenges
          </Text>

          <View style={styles.challengesList}>
            {challenges.map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeCard}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: Navigate to challenge detail
                  console.log('View challenge:', challenge.id);
                }}
              >
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <View style={styles.challengeReward}>
                  <Text style={styles.challengeRewardAmount}>
                    {challenge.reward}
                  </Text>
                  <SkrIcon width={18} height={18} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: 'Archivo_600SemiBold',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#808080',
    marginBottom: 16,
    paddingHorizontal: 20,
    fontFamily: 'Archivo_400Regular',
  },

  // Activities
  activitiesList: {
    gap: 20,
    paddingHorizontal: 20,
  },
  activityCard: {
    backgroundColor: 'rgba(145, 145, 145, 0.16)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#343434',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 0.7,
    borderBottomColor: '#343434',
    paddingBottom: 12,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  activityTitleInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Archivo_500Medium',
  },
  activityDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#808080',
    fontFamily: 'Archivo_500Medium',
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Archivo_500Medium',
  },
  activityStats: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#808080',
    fontFamily: 'Archivo_500Medium',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Archivo_500Medium',
  },

  // Challenges
  challengesList: {
    gap: 16,
    paddingHorizontal: 20,
  },
  challengeCard: {
    backgroundColor: 'rgba(145, 145, 145, 0.16)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#343434',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Archivo_500Medium',
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeRewardAmount: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Archivo_500Medium',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Archivo_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#808080',
    textAlign: 'center',
    fontFamily: 'Archivo_400Regular',
  },
});

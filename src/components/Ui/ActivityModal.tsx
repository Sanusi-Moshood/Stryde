import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useActivityMetrics } from '@/hooks/useaActivity';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import ExpandIcon from '@/assets/icons/expand.svg';
import CollapseIcon from '@/assets/icons/collapse.svg';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ANIMATION_CONFIG = LayoutAnimation.create(
  250,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.scaleY,
);

export default function ActivityModal({
  isRecording,
  distance,
  duration,
  isPausedState,
}: {
  isRecording: boolean;
  distance: number;
  duration: number;
  isPausedState: boolean;
}) {
  const [statsExpanded, setStatsExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  const { formattedDistance, formattedDuration, pace, calories, steps } =
    useActivityMetrics(distance, duration);

  const toggleExpanded = (value: boolean) => {
    LayoutAnimation.configureNext(ANIMATION_CONFIG);
    setStatsExpanded(value);
  };

  // Auto-expand stats when paused
  useEffect(() => {
    if (isPausedState) {
      toggleExpanded(true);
    }
  }, [isPausedState]);

  useEffect(() => {
    if (isRecording && !isPausedState) {
      toggleExpanded(false);
    }
  }, [isPausedState]);

  return (
    <TouchableOpacity
      activeOpacity={statsExpanded ? 1 : 0.8}
      onPress={() => {
        if (!statsExpanded) toggleExpanded(true);
      }}
    >
      <BlurView
        intensity={95}
        tint='dark'
        style={[
          styles.activityModal,
          {
            top: insets.top + 12,
            flexDirection: statsExpanded ? 'column' : 'row',
            alignItems: 'center',
            paddingVertical: statsExpanded ? 40 : 14,
            gap: statsExpanded ? 24 : 20,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            toggleExpanded(!statsExpanded);
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.expandButton}
        >
          {statsExpanded ? (
            <CollapseIcon width={28} height={28} />
          ) : (
            <ExpandIcon width={14} height={16} />
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.compactStatItem,
            { alignItems: statsExpanded ? 'center' : 'flex-start' },
          ]}
        >
          <Text style={styles.compactStatLabel}>Distance</Text>
          <Text style={styles.compactStatValue}>{formattedDistance}km</Text>
        </View>

        <View
          style={[
            styles.compactStatItem,
            { alignItems: statsExpanded ? 'center' : 'flex-start' },
          ]}
        >
          <Text style={styles.compactStatLabel}>Time</Text>
          <Text style={styles.compactStatValue}>{formattedDuration}</Text>
        </View>

        {statsExpanded && (
          <>
            <View style={[styles.compactStatItem, { alignItems: 'center' }]}>
              <Text style={styles.compactStatLabel}>Pace</Text>
              <Text style={styles.compactStatValue}>6:20/km</Text>
            </View>

            <View style={[styles.compactStatItem, { alignItems: 'center' }]}>
              <Text style={styles.compactStatLabel}>Calorie</Text>
              <Text style={styles.compactStatValue}>1855 Cal</Text>
            </View>

            <View style={[styles.compactStatItem, { alignItems: 'center' }]}>
              <Text style={styles.compactStatLabel}>Steps</Text>
              <Text style={styles.compactStatValue}>14000</Text>
            </View>
          </>
        )}
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  activityModal: {
    position: 'absolute',
    borderColor: '#1F1F1F',
    borderWidth: 1,
    left: 0,
    right: 0,
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(145, 145, 145, 0.16)',
    paddingVertical: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 20,
  },
  expandButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  compactStatsContent: {
    flexDirection: 'row',
    gap: 32,
  },
  compactStatItem: {
    gap: 12,
  },
  compactStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  compactStatValue: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: -1,
    lineHeight: 48,
  },
});

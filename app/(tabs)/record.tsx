// app/(tabs)/record.tsx
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useActivityStore } from '@/store/activityStore';

type RecordingState = 'idle' | 'recording' | 'paused';

export default function RecordScreen() {
  const router = useRouter();
  const {
    isRecording,
    isPaused,
    distance,
    duration,
    coordinates,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useActivityStore();

  const [activityType, setActivityType] = useState<'run' | 'walk' | 'cycle'>(
    'run',
  );
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated panel height: 200px (idle) → 320px (recording)
  const panelHeight = useRef(new Animated.Value(200)).current;

  // Determine current UI state
  const recordingState: RecordingState = isRecording
    ? isPaused
      ? 'paused'
      : 'recording'
    : 'idle';

  // Initialize location
  useEffect(() => {
    (async () => {
      try {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          Alert.alert('Enable Location', 'Please enable location services.');
          setLoading(false);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission required.');
          setLoading(false);
          return;
        }

        // Get last known for instant display
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setLocation(lastKnown);
          setLoading(false);
        }

        // Get accurate location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
      } catch (error) {
        console.error('Location error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Watch location when recording
  useEffect(() => {
    if (!isRecording) return;

    let subscription: Location.LocationSubscription | null = null;

    const watchLocation = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 10,
        },
        (loc) => {
          setCurrentLocation(loc);

          if (mapRef.current && !isPaused) {
            mapRef.current.animateCamera({
              center: {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              },
              zoom: 17,
            });
          }
        },
      );
    };

    watchLocation();

    return () => {
      subscription?.remove();
    };
  }, [isRecording, isPaused]);

  // Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        useActivityStore.getState().incrementDuration();
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Animate panel when state changes
  useEffect(() => {
    if (recordingState === 'idle') {
      Animated.spring(panelHeight, {
        toValue: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(panelHeight, {
        toValue: 320,
        useNativeDriver: false,
      }).start();
    }
  }, [recordingState]);

  const handleStart = async () => {
    try {
      const { status: bgStatus } =
        await Location.getBackgroundPermissionsAsync();

      if (bgStatus !== 'granted') {
        Alert.alert(
          'Background Location Required',
          'Please allow location access "All the time".',
        );
        return;
      }

      await startRecording();
    } catch (error) {
      console.error('Start error:', error);
      Alert.alert('Error', 'Failed to start tracking.');
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleFinish = () => {
    Alert.alert(
      'Finish Activity?',
      'Are you sure you want to end this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'destructive',
          onPress: async () => {
            await stopRecording();
            router.push('/activity-summary');
          },
        },
      ],
    );
  };

  // Format helpers
  const formatDistance = (meters: number) => (meters / 1000).toFixed(2);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = () => {
    if (distance === 0 || duration === 0) return '--:--';
    const km = distance / 1000;
    const paceSeconds = duration / km;

    if (paceSeconds < 150) return '2:30';
    if (paceSeconds > 1200) return '20:00';

    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.floor(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : {
                latitude: 6.5244,
                longitude: 3.3792,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
        }
        showsUserLocation
        followsUserLocation={isRecording && !isPaused}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {coordinates.length > 1 && (
          <Polyline
            coordinates={coordinates.map((c) => ({
              latitude: c.latitude,
              longitude: c.longitude,
            }))}
            strokeColor='#FF6B4A'
            strokeWidth={5}
            lineJoin='round'
            lineCap='round'
          />
        )}
      </MapView>

      {/* Recording badge */}
      {isRecording && (
        <View style={[styles.recordingBadge, isPaused && styles.pausedBadge]}>
          {!isPaused && <View style={styles.recordingDot} />}
          <Text style={styles.recordingText}>
            {isPaused ? 'PAUSED' : 'RECORDING'}
          </Text>
        </View>
      )}

      {/* Bottom panel - animated height changes with state */}
      <Animated.View style={[styles.bottomPanel, { height: panelHeight }]}>
        {recordingState === 'idle' ? (
          // ===== IDLE STATE =====
          <>
            <View style={styles.activityTabs}>
              <TouchableOpacity
                style={[
                  styles.activityTab,
                  activityType === 'run' && styles.activityTabActive,
                ]}
                onPress={() => setActivityType('run')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activityType === 'run' && styles.tabTextActive,
                  ]}
                >
                  🏃 Run
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.activityTab,
                  activityType === 'walk' && styles.activityTabActive,
                ]}
                onPress={() => setActivityType('walk')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activityType === 'walk' && styles.tabTextActive,
                  ]}
                >
                  🚶 Walk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.activityTab,
                  activityType === 'cycle' && styles.activityTabActive,
                ]}
                onPress={() => setActivityType('cycle')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activityType === 'cycle' && styles.tabTextActive,
                  ]}
                >
                  🚴 Cycle
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.gpsStatus}>
                {location ? '📍 GPS Ready' : '📍 Getting location...'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleStart}
              disabled={!location}
              style={styles.buttonTouchable}
            >
              <Text style={styles.startButtonText}>▶ START</Text>
            </TouchableOpacity>
          </>
        ) : (
          // ===== RECORDING/PAUSED STATE =====
          <>
            <View style={styles.mainStat}>
              <Text style={styles.distanceValue}>
                {formatDistance(distance)}
              </Text>
              <Text style={styles.distanceUnit}>KM</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{calculatePace()}</Text>
                <Text style={styles.statLabel}>Avg. pace (/km)</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {Math.round(distance * 0.05)}
                </Text>
                <Text style={styles.statLabel}>kcal</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                onPress={handlePauseResume}
                style={styles.buttonTouchable}
              >
                <Text style={styles.pauseButtonText}>
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinish}
              >
                <Text style={styles.finishButtonText}>🏁 Finish</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  map: {
    flex: 1,
  },
  recordingBadge: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 77, 109, 0.95)',
    borderRadius: 20,
  },
  pausedBadge: {
    backgroundColor: 'rgba(160, 160, 171, 0.95)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  recordingText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141419',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 74, 0.1)',
  },
  // Idle state components
  activityTabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    marginBottom: 16,
  },
  activityTab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activityTabActive: {
    backgroundColor: 'rgba(255, 107, 74, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B78',
  },
  tabTextActive: {
    color: '#FF6B4A',
  },
  statusRow: {
    marginBottom: 16,
  },
  gpsStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22D3A0',
  },
  startButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonTouchable: {
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  // Recording state components
  mainStat: {
    alignItems: 'center',
    marginBottom: 20,
  },
  distanceValue: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FF6B4A',
    lineHeight: 64,
    letterSpacing: -2,
  },
  distanceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B78',
    letterSpacing: 2,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B6B78',
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  finishButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1C1C24',
    borderWidth: 1,
    borderColor: '#6B6B78',
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B6B78',
  },
});

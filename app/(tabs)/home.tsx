// app/(tabs)/record.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActivityStore } from '@/store/activityStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Dark map style matching the design ───
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'landscape.man_made.building',
    elementType: 'geometry',
    stylers: [{ color: '#151515' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#797979' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];

type ActivityType = 'run' | 'walk' | 'cycle';

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  run: 'run-fast',
  walk: 'walk',
  cycle: 'bike',
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  walk: 'Walk',
  cycle: 'Cycle',
};

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

  const [activityType, setActivityType] = useState<ActivityType>('walk');
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [isCentered, setIsCentered] = useState(true);
  const [isHeadingMode, setIsHeadingMode] = useState(false);
  const [heading, setHeading] = useState(0);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);

  // Animations
  const statsCardOpacity = useRef(new Animated.Value(0)).current;
  const statsCardScale = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── Determine UI state ───
  const isIdle = !isRecording;
  const isActiveRecording = isRecording && !isPaused;
  const isPausedState = isRecording && isPaused;

  // ─── Pulse animation for user dot glow ───
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ─── Stats card animation ───
  useEffect(() => {
    if (statsExpanded) {
      Animated.parallel([
        Animated.spring(statsCardOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(statsCardScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(statsCardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(statsCardScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [statsExpanded]);

  // Auto-expand stats when paused
  useEffect(() => {
    if (isPausedState) {
      setStatsExpanded(true);
    }
  }, [isPausedState]);

  // ─── Initialize location ───
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

        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setLocation(lastKnown);
          setCurrentLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });

          setTimeout(() => {
            mapRef.current?.animateCamera(
              {
                center: {
                  latitude: lastKnown.coords.latitude,
                  longitude: lastKnown.coords.longitude,
                },
                zoom: 17,
              },
              { duration: 0 },
            );
          }, 100);
          setLoading(false);
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setTimeout(() => {
          mapRef.current?.animateCamera(
            {
              center: {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              },
              zoom: 17,
            },
            { duration: 0 },
          );
        }, 100);
      } catch (error) {
        console.error('Location error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Watch location when recording ───
  useEffect(() => {
    if (!isRecording) return;

    let subscription: Location.LocationSubscription | null = null;

    const watchLocation = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          const newCoord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCurrentLocation(newCoord);

          if (mapRef.current && isCentered && !isPaused) {
            mapRef.current.animateCamera(
              {
                center: newCoord,
                zoom: 17,
                heading: isHeadingMode ? heading : 0,
              },
              { duration: 500 },
            );
          }
        },
      );
    };

    watchLocation();

    return () => {
      subscription?.remove();
    };
  }, [isRecording, isPaused, isCentered, isHeadingMode, heading]);

  // ─── Heading tracking ───
  useEffect(() => {
    if (!isHeadingMode) {
      headingSubRef.current?.remove();
      headingSubRef.current = null;
      return;
    }

    const startHeading = async () => {
      headingSubRef.current = await Location.watchHeadingAsync((h) => {
        setHeading(h.trueHeading);
        if (mapRef.current && currentLocation && isCentered) {
          mapRef.current.animateCamera(
            {
              center: currentLocation,
              heading: h.trueHeading,
              zoom: 17,
            },
            { duration: 300 },
          );
        }
      });
    };

    startHeading();

    return () => {
      headingSubRef.current?.remove();
    };
  }, [isHeadingMode, currentLocation, isCentered]);

  // ─── Timer ───
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

  // ─── Handlers ───
  const handleStart = async () => {
    try {
      const { status: bgStatus } =
        await Location.getBackgroundPermissionsAsync();

      if (bgStatus !== 'granted') {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Background Location Required',
            'Please allow location access "All the time" for tracking.',
          );
          return;
        }
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
      setStatsExpanded(false);
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
            setStatsExpanded(false);
            router.push('/activity-summary');
          },
        },
      ],
    );
  };

  const handleRecenter = () => {
    if (isCentered) {
      // Already centered → toggle heading mode
      setIsHeadingMode(!isHeadingMode);
    } else {
      // Off-center → recenter
      setIsCentered(true);
      setIsHeadingMode(false);
      if (mapRef.current && currentLocation) {
        mapRef.current.animateCamera(
          {
            center: currentLocation,
            zoom: 17,
            heading: 0,
          },
          { duration: 500 },
        );
      }
    }
  };

  const handleMapDrag = () => {
    setIsCentered(false);
    setIsHeadingMode(false);
  };

  const cycleActivityType = () => {
    const types: ActivityType[] = ['walk', 'run', 'cycle'];
    const currentIndex = types.indexOf(activityType);
    const nextIndex = (currentIndex + 1) % types.length;
    setActivityType(types[nextIndex]);
  };

  // ─── Format helpers ───
  const formatDistance = (meters: number) => (meters / 1000).toFixed(1);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const calculateCalories = () => {
    // Rough estimate: ~60 cal/km for running
    return Math.round((distance / 1000) * 60);
  };

  const calculateSteps = () => {
    // Rough estimate: ~1300 steps/km
    const steps = Math.round((distance / 1000) * 1300);
    return steps.toLocaleString();
  };

  const mapRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

  return (
    <View style={styles.container}>
      {/* ─── Full-screen Map ─── */}
      {loading && !location ? (
        <View style={[styles.map, { backgroundColor: '#000000' }]} />
      ) : (
        <MapView
          ref={mapRef}
          style={[styles.map, { opacity: loading && !location ? 0 : 1 }]}
          provider={PROVIDER_GOOGLE}
          customMapStyle={DARK_MAP_STYLE}
          showsBuildings={false}
          toolbarEnabled={true}
          onPanDrag={handleMapDrag}
          mapPadding={{
            top: 0,
            right: 0,
            bottom: isIdle ? 160 : 120,
            left: 0,
          }}
        >
          {/* Route polyline */}
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

          {/* Custom user location dot */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.userDotContainer}>
                {/* Outer ring (fake border) */}
                <View style={styles.userDotBorder} />
                {/* Inner dot */}
                <View style={styles.userDot} />
              </View>
            </Marker>
          )}
        </MapView>
      )}
      {/* ─── Re-center / GPS heading button ─── */}
      {!isIdle && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              isCentered ? (isHeadingMode ? 'compass' : 'navigate') : 'locate'
            }
            size={22}
            color={isCentered ? '#FF6B4A' : '#888'}
          />
        </TouchableOpacity>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* ─── IDLE STATE ─── */}
      {/* ════════════════════════════════════════════════ */}
      {isIdle && (
        <View style={styles.idleOverlay}>
          {/* Activity type toggle pill */}
          <TouchableOpacity
            style={styles.activityPill}
            onPress={cycleActivityType}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={ACTIVITY_ICONS[activityType] as any}
              size={20}
              color='#FFFFFF'
            />
            <Text style={styles.activityPillText}>
              {ACTIVITY_LABELS[activityType]}
            </Text>
          </TouchableOpacity>

          {/* Big circular start button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            disabled={!location}
            activeOpacity={0.8}
          >
            <View style={styles.startButtonInner}>
              <Ionicons name='play' size={32} color='#0A0A0F' />
            </View>
          </TouchableOpacity>

          <Text style={styles.startHintText}>Start your first activity!</Text>
        </View>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* ─── RECORDING STATE: Compact stats bar (top) ─── */}
      {/* ════════════════════════════════════════════════ */}
      {isRecording && !statsExpanded && (
        <TouchableOpacity
          style={styles.compactStatsBar}
          onPress={() => setStatsExpanded(true)}
          activeOpacity={0.8}
        >
          <View style={styles.compactStatsContent}>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatLabel}>Distance</Text>
              <Text style={styles.compactStatValue}>
                {formatDistance(distance)}km
              </Text>
            </View>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatLabel}>Time</Text>
              <Text style={styles.compactStatValue}>
                {formatDuration(duration)}
              </Text>
            </View>
          </View>
          <Ionicons name='expand-outline' size={20} color='#888' />
        </TouchableOpacity>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* ─── RECORDING/PAUSED: Expanded stats card ─── */}
      {/* ════════════════════════════════════════════════ */}
      {isRecording && statsExpanded && (
        <Animated.View
          style={[
            styles.expandedStatsCard,
            {
              opacity: statsCardOpacity,
              transform: [{ scale: statsCardScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => {
              if (!isPaused) setStatsExpanded(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name='contract-outline' size={18} color='#666' />
          </TouchableOpacity>

          <View style={styles.expandedStatRow}>
            <Text style={styles.expandedStatLabel}>Distance</Text>
            <Text style={styles.expandedStatValue}>
              {formatDistance(distance)}km
            </Text>
          </View>

          <View style={styles.expandedStatRow}>
            <Text style={styles.expandedStatLabel}>Time</Text>
            <Text style={styles.expandedStatValueWhite}>
              {formatDuration(duration)}
            </Text>
          </View>

          <View style={styles.expandedStatRow}>
            <Text style={styles.expandedStatLabel}>Pace</Text>
            <Text style={styles.expandedStatValueWhite}>
              {calculatePace()}/km
            </Text>
          </View>

          <View style={styles.expandedStatRow}>
            <Text style={styles.expandedStatLabel}>Calorie</Text>
            <Text style={styles.expandedStatValueOrange}>
              {calculateCalories()} Cal
            </Text>
          </View>

          <View style={styles.expandedStatRow}>
            <Text style={styles.expandedStatLabel}>Steps</Text>
            <Text style={styles.expandedStatValueOrange}>
              {calculateSteps()}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* ─── RECORDING: Pause button (bottom center) ─── */}
      {/* ════════════════════════════════════════════════ */}
      {isActiveRecording && (
        <View style={styles.recordingControls}>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePauseResume}
            activeOpacity={0.8}
          >
            <Ionicons name='pause' size={32} color='#0A0A0F' />
          </TouchableOpacity>
        </View>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* ─── PAUSED: Resume & Finish buttons ─── */}
      {/* ════════════════════════════════════════════════ */}
      {isPausedState && (
        <View style={styles.pausedControls}>
          <TouchableOpacity
            style={styles.resumeButton}
            onPress={handlePauseResume}
            activeOpacity={0.8}
          >
            <Ionicons name='play' size={18} color='#0A0A0F' />
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Ionicons name='flag' size={18} color='#FFFFFF' />
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // ─── Custom user dot ───
  userDotContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  directionBeam: {
    position: 'absolute',
    top: 0,
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  userDotBorder: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 11,
    backgroundColor: '#FF3D00',
    // no borderWidth needed
  },

  // ─── Recenter / GPS button ───
  recenterButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 25, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // ═══════════════════════════════════════════
  // ─── IDLE STATE ───
  // ═══════════════════════════════════════════
  idleOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(50, 50, 60, 0.85)',
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  activityPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // Glow
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  startButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startHintText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },

  // ═══════════════════════════════════════════
  // ─── COMPACT STATS BAR (recording, top-left) ───
  // ═══════════════════════════════════════════
  compactStatsBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 30, 38, 0.88)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  compactStatsContent: {
    flexDirection: 'row',
    gap: 32,
  },
  compactStatItem: {
    gap: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
    letterSpacing: 0.5,
  },
  compactStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },

  // ═══════════════════════════════════════════
  // ─── EXPANDED STATS CARD ───
  // ═══════════════════════════════════════════
  expandedStatsCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 70,
    backgroundColor: 'rgba(25, 25, 32, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  collapseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedStatRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  expandedStatValue: {
    fontSize: 38,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  expandedStatValueWhite: {
    fontSize: 38,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  expandedStatValueOrange: {
    fontSize: 38,
    fontWeight: '300',
    color: '#FF6B4A',
    letterSpacing: -1,
  },

  // ═══════════════════════════════════════════
  // ─── RECORDING CONTROLS (pause button) ───
  // ═══════════════════════════════════════════
  recordingControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  // ═══════════════════════════════════════════
  // ─── PAUSED CONTROLS (Resume + Finish) ───
  // ═══════════════════════════════════════════
  pausedControls: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0F',
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    backgroundColor: '#FF6B4A',
    borderRadius: 30,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

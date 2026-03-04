import { useState, useEffect, useRef, useCallback, JSX } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { Text } from '@/src/components/Text';
import { useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActivityStore } from '@/store/activityStore';
import PlayIcon from '@/assets/icons/play.svg';
import WalkIcon from '@/assets/icons/walk.svg';
import RunIcon from '@/assets/icons/run.svg';
import PauseIcon from '@/assets/icons/pause.svg';
import FlagIcon from '@/assets/icons/finish.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import ActivityModal from '@/src/components/Ui/ActivityModal';

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

type ActivityType = 'run' | 'walk';

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  run: 'run-fast',
  walk: 'walk',
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  walk: 'Walk',
};

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    activityType,
    setActivityType,
  } = useActivityStore();

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCentered, setIsCentered] = useState(true);
  const [isHeadingMode, setIsHeadingMode] = useState(false);
  const [heading, setHeading] = useState(0);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);

  // Animations

  // ─── Determine UI state ───
  const isIdle = !isRecording;
  const isActiveRecording = isRecording && !isPaused;
  const isPausedState = isRecording && isPaused;

  useEffect(() => {
    console.log('📍 Coordinates count:', coordinates.length);
    if (coordinates.length > 0) {
      console.log('First point:', coordinates[0]);
      console.log('Last point:', coordinates[coordinates.length - 1]);
    }
  }, [coordinates]);
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
  // ─── Watch location when recording ───
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const watchLocation = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: isRecording ? 1000 : 2000,
          distanceInterval: isRecording ? 5 : 10,
        },
        (loc) => {
          const newCoord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCurrentLocation(newCoord);

          if (isRecording && !isPaused) {
            useActivityStore.getState().updateLocation(loc);
          }

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
  // ─── Heading tracking (Android - bearing from movement) ───
  useEffect(() => {
    if (!isHeadingMode || !isRecording) {
      headingSubRef.current?.remove();
      headingSubRef.current = null;
      return;
    }

    let lastCoord: { latitude: number; longitude: number } | null = null;

    const startHeading = async () => {
      headingSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500, // Update every 500ms for smooth rotation
          distanceInterval: 3, // Minimum 3m movement to calculate bearing
        },
        (loc) => {
          const newCoord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          if (lastCoord) {
            const bearing = calculateBearing(lastCoord, newCoord);
            setHeading(bearing);

            if (mapRef.current && isCentered) {
              mapRef.current.animateCamera(
                {
                  center: newCoord,
                  heading: bearing,
                  zoom: 17,
                },
                { duration: 300 },
              );
            }
          }

          lastCoord = newCoord;
        },
      );
    };

    startHeading();

    return () => {
      headingSubRef.current?.remove();
    };
  }, [isHeadingMode, isCentered, isRecording]);

  // ─── Helper: Calculate bearing between two points ───
  function calculateBearing(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
  ): number {
    const startLat = (start.latitude * Math.PI) / 180;
    const startLng = (start.longitude * Math.PI) / 180;
    const endLat = (end.latitude * Math.PI) / 180;
    const endLng = (end.longitude * Math.PI) / 180;

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
  }
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
    const types: ActivityType[] = ['walk', 'run'];
    const currentIndex = types.indexOf(activityType);
    const nextIndex = (currentIndex + 1) % types.length;
    setActivityType(types[nextIndex]);
  };

  const ACTIVITY_ICON_COMPONENTS: Record<ActivityType, React.ReactNode> = {
    walk: <WalkIcon width={20} height={20} color='#FFFFFF' />,
    run: <RunIcon width={20} height={20} color='#FFFFFF' />,
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
            bottom: isIdle ? 100 : 80,
            left: 0,
          }}
        >
          {/* Route polyline */}
          {coordinates.length > 1 && isRecording && (
            <Polyline
              coordinates={coordinates.map((c) => ({
                latitude: c.latitude,
                longitude: c.longitude,
              }))}
              strokeColor='#FF3D00'
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
            color={isCentered ? '#FF3D00' : '#888'}
          />
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.bottomButtons,
          { position: 'absolute', bottom: insets.bottom + 108 },
        ]}
      >
        {/* ════════════════════════════════════════════════ */}
        {/* ─── IDLE STATE ─── */}
        {/* ════════════════════════════════════════════════ */}
        <View
          style={[
            styles.idleOverlay,
            { justifyContent: isIdle ? 'space-between' : 'center' },
          ]}
        >
          {/* Activity type toggle pill */}

          {isIdle && (
            <TouchableOpacity onPress={cycleActivityType} activeOpacity={0.7}>
              <BlurView intensity={8} tint='light' style={styles.activityPill}>
                {ACTIVITY_ICON_COMPONENTS[activityType]}
                <Text style={styles.activityPillText}>
                  {ACTIVITY_LABELS[activityType]}
                </Text>
              </BlurView>
            </TouchableOpacity>
          )}
          {/* start/pause button */}
          {!isPaused && (
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                marginBottom: 30,
              }}
            >
              <TouchableOpacity
                style={styles.startButton}
                onPress={isRecording ? handlePauseResume : handleStart}
                disabled={!location}
                activeOpacity={0.8}
              >
                {isRecording ? (
                  <PauseIcon width={24} height={24} />
                ) : (
                  <PlayIcon width={24} height={24} />
                )}
              </TouchableOpacity>

              {/* {isIdle && (
                <Text style={styles.startHintText}>
                  Start your first activity!
                </Text>
              )} */}
            </View>
          )}

          {isIdle && (
            <TouchableOpacity
              activeOpacity={0.7}
              disabled
              style={{ opacity: 0 }}
            >
              <BlurView intensity={8} tint='light' style={styles.activityPill}>
                {ACTIVITY_ICON_COMPONENTS[activityType]}
                <Text style={styles.activityPillText}>
                  {ACTIVITY_LABELS[activityType]}
                </Text>
              </BlurView>
            </TouchableOpacity>
          )}
        </View>

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
              <PlayIcon />
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <FlagIcon />
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!isIdle && (
        <ActivityModal
          distance={distance}
          isRecording={isRecording}
          duration={duration}
          isPausedState={isPausedState}
        />
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
    top: '50%',
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

  bottomButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  // ═══════════════════════════════════════════
  // ─── IDLE STATE ───
  // ═══════════════════════════════════════════

  idleOverlay: {
    flexDirection: 'row',
    gap: 17,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 25,
  },
  activityPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    // paddingHorizontal: 19,
    // paddingVertical: 13,
    width: 68,
    height: 68,
    overflow: 'hidden',
    backgroundColor: '#101010',
    borderRadius: 100,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  activityPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Archivo_400Regular',
  },
  startButton: {
    width: 74,
    height: 74,
    flexDirection: 'column',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 12,
    // Glow
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
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
    color: '#FF3D00',
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
    flexDirection: 'row',
    gap: 32,
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
    backgroundColor: '#FF3D00',
    borderRadius: 30,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

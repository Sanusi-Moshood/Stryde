// app/activity-summary.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Text } from '@/src/components/Text';
import { useRouter } from 'expo-router';
import MapView from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { useActivityStore } from '@/store/activityStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RunIcon from '@/assets/icons/run.svg';
import WalkIcon from '@/assets/icons/walk.svg';
import Svg, { Path } from 'react-native-svg';
import { useActivityMetrics } from '@/hooks/useaActivity';
import { useActivitiesStore } from '@/store/activitiesStore';

// Dark map style (keeping for future use)
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
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#797979' }],
  },
];

type ActivityType = 'run' | 'walk';

// Component to render just the route path
const RoutePathView = ({
  coordinates,
}: {
  coordinates: Array<{ latitude: number; longitude: number }>;
}) => {
  if (coordinates.length < 2) {
    return (
      <View style={styles.emptyRoute}>
        <Text style={styles.emptyRouteText}>No route data</Text>
      </View>
    );
  }

  // Calculate bounds
  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  coordinates.forEach((coord) => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  // Container dimensions
  const containerWidth = 335; // Adjust based on your layout
  const containerHeight = 280;

  // Add padding
  const padding = 20;
  const drawWidth = containerWidth - padding * 2;
  const drawHeight = containerHeight - padding * 2;

  // Scale coordinates to fit container
  const scale = Math.min(drawWidth / lngRange, drawHeight / latRange);

  const points = coordinates.map((coord) => {
    const x = (coord.longitude - minLng) * scale + padding;
    const y = containerHeight - ((coord.latitude - minLat) * scale + padding); // Flip Y
    return { x, y };
  });

  // Create SVG path
  const pathData = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <Svg
      width={containerWidth}
      height={containerHeight}
      style={styles.routeSvg}
    >
      <Path
        d={pathData}
        stroke='#FF3D00'
        strokeWidth={4}
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};

export default function ActivitySummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    distance,
    duration,
    coordinates,
    reset,
    activityType,
    setActivityType,
  } = useActivityStore();

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { addActivity } = useActivitiesStore();
  const { formattedDistance, formattedDuration, pace, calories, steps } =
    useActivityMetrics(distance, duration);
  const viewShotRef = useRef<View>(null);
  const mapRef = useRef<MapView>(null);

  // Calculate map region from coordinates
  const getMapRegion = () => {
    if (coordinates.length === 0) {
      return {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    coordinates.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  // Fit map to route on mount
  useEffect(() => {
    if (mapRef.current && coordinates.length > 1) {
      const region = getMapRegion();
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 500);
      }, 100);
    }
  }, []);

  // Image picker
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBackgroundImage(result.assets[0].uri);
    }
  };

  const handleSnapImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBackgroundImage(result.assets[0].uri);
    }
  };

  const handleImageOptions = () => {
    Alert.alert(
      'Add Background',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleSnapImage },
        { text: 'Choose from Library', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  // Share functionality
  const handleShare = async () => {
    try {
      setIsCapturing(true);

      // Capture the view as image
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });

      // TODO: Implement actual sharing
      // For now, just show success
      Alert.alert('Share', 'Activity shared successfully!');

      setIsCapturing(false);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share activity.');
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    Alert.alert('Discard Activity?', 'This activity will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          reset();
          router.replace('/(tabs)/home');
        },
      },
    ]);
  };

  const handleSave = async () => {
    try {
      // Calculate pace (seconds per km)
      const km = distance / 1000;
      if (km === 0) {
        Alert.alert('Error', 'No distance recorded');
        return;
      }

      const paceSeconds = duration / km;
      const mins = Math.floor(paceSeconds / 60);
      const secs = Math.floor(paceSeconds % 60);
      const paceString = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Save to activities store
      await addActivity({
        type: activityType,
        title: activityTitle,
        distance,
        duration,
        pace: paceString,
        calories: calories,
        coordinates,
      });

      Alert.alert('Success!', 'Activity saved successfully.');

      // Reset activity store and navigate to feed
      reset();
      router.replace('/(tabs)/feed');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save activity.');
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };

  const activityTitle = `${getTimeOfDay()} ${activityType}`;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Header */}
          <Text style={styles.header}>Activity Completed</Text>

          {/* Shareable view */}
          <View ref={viewShotRef} collapsable={false}>
            {/* Activity title */}
            <View style={styles.titleRow}>
              {activityType === 'run' ? (
                <RunIcon width={24} height={24} color='#FFFFFF' />
              ) : (
                <WalkIcon width={24} height={24} color='#FFFFFF' />
              )}
              <Text style={styles.activityTitle}>{activityTitle}</Text>
            </View>

            {/* Route visualization - just the path */}
            <View style={styles.routeContainer}>
              {backgroundImage && (
                <Image
                  source={{ uri: backgroundImage }}
                  style={styles.backgroundImage}
                  blurRadius={8}
                />
              )}
              {!backgroundImage && <View style={styles.routeBackground} />}

              {/* Draw route as SVG path or Canvas */}
              <RoutePathView coordinates={coordinates} />
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {/* Row 1 */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{formattedDistance}km</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Time</Text>
                  <Text style={styles.statValue}>{formattedDuration}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Pace</Text>
                  <Text style={styles.statValue}>{pace}/km</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Calorie</Text>
                  <Text style={styles.statValue}>{calories} Cal</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Steps</Text>
                  <Text style={styles.statValue}>{steps}</Text>
                </View>
                <View style={styles.statItem} />
              </View>
            </View>
          </View>

          {/* Image upload/snap option */}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleImageOptions}
            activeOpacity={0.7}
          >
            <Ionicons name='camera' size={20} color='#FF3D00' />
            <Text style={styles.imageButtonText}>
              {backgroundImage
                ? 'Change background image'
                : 'Snap or upload background image'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSave}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Archivo_600SemiBold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Archivo_500Medium',
  },
  routeContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    backgroundColor: '#000000',
  },
  routeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  routeSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  emptyRoute: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRouteText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Archivo_400Regular',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888888',
    marginBottom: 4,
    fontFamily: 'Archivo_400Regular',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Archivo_600SemiBold',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    marginBottom: 24,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3D00',
    fontFamily: 'Archivo_500Medium',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Archivo_700Bold',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FF3D00',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Archivo_700Bold',
  },
  saveButton: {
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Archivo_600SemiBold',
  },
});

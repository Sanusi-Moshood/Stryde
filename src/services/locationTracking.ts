import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useActivityStore } from '@/store/activityStore';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('❌ Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    console.log('📍 Background location update:', locations.length, 'points');

    const location = locations[0];

    if (location) {
      console.log(
        '📍 Lat:',
        location.coords.latitude,
        'Lng:',
        location.coords.longitude,
      );

      const { isPaused, updateLocation } = useActivityStore.getState();

      if (!isPaused) {
        updateLocation(location);
        console.log('✅ Location updated in store');
      } else {
        console.log('⏸ Paused, skipping location update');
      }
    }
  }
});

export async function startBackgroundLocation() {
  console.log('🔵 Starting background location...');

  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  console.log('🔵 Foreground status:', foregroundStatus);

  if (foregroundStatus !== 'granted') {
    throw new Error('Foreground permission not granted');
  }

  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();
  console.log('🔵 Background status:', backgroundStatus);

  if (backgroundStatus !== 'granted') {
    throw new Error('Background permission not granted');
  }

  // Check if task is already registered
  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  console.log('🔵 Task already registered:', isRegistered);

  if (isRegistered) {
    console.log('🔵 Stopping existing task first...');
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }

  console.log('🔵 Starting location updates...');
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 5,
    foregroundService: {
      notificationTitle: 'Stryde is tracking your run',
      notificationBody: 'Tap to return to the app',
      notificationColor: '#E8FF47',
    },
    pausesUpdatesAutomatically: false,
  });

  console.log('✅ Background location started successfully');
}

export async function stopBackgroundLocation() {
  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('Background location stopped');
  }
}

export function isBackgroundLocationAvailable() {
  return Location.hasServicesEnabledAsync();
}

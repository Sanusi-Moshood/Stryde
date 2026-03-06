import { create } from "zustand";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";

import { Coordinate } from "@/src/types";
import {
  startBackgroundLocation,
  stopBackgroundLocation,
} from "@/src/services/locationTracking";
import { WalkResult } from "@/src/services/walkService";

interface ActivityState {
  isRecording: boolean;
  isPaused: boolean;
  distance: number;
  duration: number;
  steps: number;
  calories: number;
  coordinates: Coordinate[];
  startTime: number | null;
  activityType: "run" | "walk";
  isPedometerAvailable: boolean;
  lastWalkResult: WalkResult | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<void>;
  updateLocation: (location: Location.LocationObject) => void;
  incrementDuration: () => void; // New function
  reset: () => void;
  setActivityType: (type: "run" | "walk") => void;
}

const INITIAL_STATE = {
  isRecording: false,
  isPaused: false,
  distance: 0,
  duration: 0,
  steps: 0,
  calories: 0,
  coordinates: [],
  startTime: null,
  activityType: "walk" as "run" | "walk",
  isPedometerAvailable: false,
  lastWalkResult: null,
};

const CALORIES_PER_KM: Record<string, number> = {
  walk: 65,
  run: 80,
  hike: 75,
  ride: 40,
};

let pedometerSubscription: { remove: () => void } | null = null;
let stepCountAtStart = 0;

export const useActivityStore = create<ActivityState>((set, get) => ({
  ...INITIAL_STATE,

  startRecording: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission denied");
    }

    // Start background location tracking
    await startBackgroundLocation();

    const isAvailable = await Pedometer.isAvailableAsync();

    if (isAvailable) {
      const now = new Date();
      const start = new Date(now.getTime() - 1000);

      try {
        pedometerSubscription = await Pedometer.watchStepCount((result) => {
          const { isPaused } = useActivityStore.getState();
          if (!isPaused) {
            set({ steps: result.steps });
          }
        });
      } catch (error) {
        console.error("Error watching step count:", error);
      }
    }

    set({
      isRecording: true,
      isPaused: false,
      startTime: Date.now(),
      coordinates: [],
      distance: 0,
      duration: 0,
      steps: 0,
      calories: 0,
      isPedometerAvailable: isAvailable,
    });
  },

  setActivityType: (type: "run" | "walk") => {
    set({ activityType: type });
  },

  pauseRecording: () => {
    set({ isPaused: true });
  },

  resumeRecording: () => {
    set({ isPaused: false });
  },

  stopRecording: async () => {
    if (pedometerSubscription) {
      pedometerSubscription.remove();
      pedometerSubscription = null;
    }

    // Stop background tracking
    await stopBackgroundLocation();

    set({ isRecording: false, isPaused: false });
  },

  updateLocation: (location: Location.LocationObject) => {
    const { coordinates, isPaused, distance, activityType } = get();

    console.log("updateLocation called");
    console.log("isPaused:", isPaused);
    console.log("Current coords count:", coordinates.length);
    console.log(
      "New location:",
      location.coords.latitude,
      location.coords.longitude,
    );

    if (isPaused) return;

    const newCoord: Coordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      altitude: location.coords.altitude ?? undefined,
    };

    let newDistance = distance;
    if (coordinates.length > 0) {
      const last = coordinates[coordinates.length - 1];
      newDistance += calculateDistance(
        last.latitude,
        last.longitude,
        newCoord.latitude,
        newCoord.longitude,
      );
    }

    const caloriesPerKm = CALORIES_PER_KM[activityType] ?? 65;
    const newCalories = Math.round((newDistance / 1000) * caloriesPerKm);

    set({
      coordinates: [...coordinates, newCoord],
      distance: newDistance,
      calories: newCalories,
    });
  },

  incrementDuration: () => {
    const { isPaused } = get();
    if (!isPaused) {
      set((state) => ({ duration: state.duration + 1 }));
    }
  },

  reset: () => {
    if (pedometerSubscription) {
      pedometerSubscription.remove();
      pedometerSubscription = null;
    }
    set(INITIAL_STATE);
  },
}));

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

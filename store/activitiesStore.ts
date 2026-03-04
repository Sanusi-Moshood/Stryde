// store/activitiesStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedActivity {
  id: string;
  type: 'run' | 'walk';
  title: string;
  date: string;
  time: string;
  distance: number; // in meters
  pace: string; // min/km format
  duration: number; // in seconds
  calories: number;
  coordinates: Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
    altitude?: number;
  }>;
  createdAt: string;
}

interface ActivitiesState {
  activities: SavedActivity[];
  loading: boolean;

  // Actions
  fetchActivities: () => Promise<void>;
  addActivity: (
    activity: Omit<SavedActivity, 'id' | 'date' | 'time' | 'createdAt'>,
  ) => Promise<void>;
  clearActivities: () => Promise<void>;
}

const STORAGE_KEY = 'stryde_activities';

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  loading: false,

  fetchActivities: async () => {
    set({ loading: true });

    try {
      // Get from local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const activities = JSON.parse(stored);
        set({ activities, loading: false });
      } else {
        // No activities yet
        set({ activities: [], loading: false });
      }

      // TODO: Also fetch from backend and merge
      // const response = await fetch('API_URL/activities');
      // const serverActivities = await response.json();
      // Merge and update local storage
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      set({ loading: false });
    }
  },

  addActivity: async (activityData) => {
    try {
      const now = new Date();

      // Format date and time
      const formattedDate = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const newActivity: SavedActivity = {
        id: Date.now().toString(),
        ...activityData,
        date: formattedDate,
        time: formattedTime,
        createdAt: now.toISOString(),
      };

      // Add to state (prepend so newest is first)
      const { activities } = get();
      const updated = [newActivity, ...activities];

      set({ activities: updated });

      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      console.log('✅ Activity saved to local storage');

      // TODO: Also save to backend
      // await fetch('API_URL/activities', {
      //   method: 'POST',
      //   body: JSON.stringify(newActivity),
      // });
    } catch (error) {
      console.error('Failed to add activity:', error);
      throw error;
    }
  },

  clearActivities: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ activities: [] });
      console.log('✅ Activities cleared');
    } catch (error) {
      console.error('Failed to clear activities:', error);
    }
  },
}));

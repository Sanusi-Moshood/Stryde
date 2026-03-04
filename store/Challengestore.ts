// store/challengesStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Challenge {
  id: string;
  title: string;
  reward: number; // $SKR amount
  type: 'distance' | 'streak' | 'speed';
  description?: string;
  progress?: number; // 0-100
  target?: number;
}

interface ChallengesState {
  challenges: Challenge[];
  loading: boolean;

  // Actions
  fetchChallenges: () => Promise<void>;
  updateChallengeProgress: (id: string, progress: number) => void;
}

const STORAGE_KEY = 'stryde_challenges';

// Default challenges matching the design
const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'First 1km',
    reward: 10,
    type: 'distance',
    description: 'Complete your first 1km activity',
    target: 1000, // 1km in meters
    progress: 0,
  },
  {
    id: '2',
    title: 'Daily 5km walk',
    reward: 10,
    type: 'distance',
    description: 'Walk 5km in a single activity',
    target: 5000,
    progress: 0,
  },
  {
    id: '3',
    title: '15km run',
    reward: 30,
    type: 'distance',
    description: 'Run 15km in a single activity',
    target: 15000,
    progress: 0,
  },
  {
    id: '4',
    title: '50km total distance',
    reward: 100,
    type: 'distance',
    description: 'Reach 50km total distance across all activities',
    target: 50000,
    progress: 0,
  },
];

export const useChallengesStore = create<ChallengesState>((set, get) => ({
  challenges: DEFAULT_CHALLENGES,
  loading: false,

  fetchChallenges: async () => {
    set({ loading: true });

    try {
      // Check local storage for any updates
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const challenges = JSON.parse(stored);
        set({ challenges, loading: false });
      } else {
        // Use defaults and save to storage
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(DEFAULT_CHALLENGES),
        );
        set({ challenges: DEFAULT_CHALLENGES, loading: false });
      }

      // TODO: Fetch from backend for server-side challenges
      // const response = await fetch('API_URL/challenges');
      // const serverChallenges = await response.json();
      // Merge with local and update
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      set({ challenges: DEFAULT_CHALLENGES, loading: false });
    }
  },

  updateChallengeProgress: (id: string, progress: number) => {
    const { challenges } = get();

    const updated = challenges.map((challenge) => {
      if (challenge.id === id) {
        return { ...challenge, progress: Math.min(progress, 100) };
      }
      return challenge;
    });

    set({ challenges: updated });

    // Save to local storage
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(
      (error) => {
        console.error('Failed to update challenge progress:', error);
      },
    );
  },
}));

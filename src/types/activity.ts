export type ActivityType = 'run' | 'walk';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number;
}

export interface ActivitySplit {
  km: number;
  pace: number; // seconds per km
  duration: number; // seconds
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  distance: number; // meters
  duration: number; // seconds
  avgPace: number; // seconds per km
  calories: number;
  elevation: number; // meters gained
  coordinates: Coordinate[];
  splits: ActivitySplit[];
  skrEarned: number;
  challengeId: string | null;
  crewId: string | null;
  isPublic: boolean;
  createdAt: string;
}

export type CreateActivityInput = Omit<
  Activity,
  'id' | 'createdAt' | 'skrEarned'
>;

export interface ActivityStats {
  totalDistance: number;
  totalActivities: number;
  totalTime: number;
  avgPace: number;
  longestRun: number;
  currentStreak: number;
}

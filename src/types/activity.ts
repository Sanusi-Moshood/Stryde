export type ActivityType = "run" | "walk";

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
  distance: number;
  duration: number;
  steps: number;
  calories: number;
  coordinates: Coordinate[];
  tokensEarned: number;
  mintTxSignature?: string;
  tokenBreakdown?: string;
  isSeeker?: boolean;
  status: "verified" | "flagged" | "rejected";
  challengeId?: string | null;
  isPublic: boolean;
  createdAt: string;
}

export type CreateActivityInput = Omit<
  Activity,
  | "id"
  | "createdAt"
  | "tokensEarned"
  | "status"
  | "mintTxSignature"
  | "tokenBreakdown"
  | "isSeeker"
>;

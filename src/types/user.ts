export interface UserStats {
  totalWalks: number;
  totalSteps: number;
  totalDistanceMeters: number;
  totalCalories: number;
  totalDurationSeconds: number;
  longestStreak: number;
  currentStreak: number;
  lastWalkDate?: string;
}

export interface UserChallengeStats {
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
}

export interface UserAchievement {
  achievementId: string;
  name: string;
  unlockedAt: string;
}

export interface User {
  _id: string; // MongoDB uses _id not id
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  email?: string | null;
  tokenBalance: number;
  lifetimeEarnedTokens: number;
  lifetimeSpentTokens: number;
  reputationScore: number;
  stats: UserStats;
  challengeStats: UserChallengeStats;
  achievements: UserAchievement[];
  followersCount: number;
  followingCount: number;
  isBanned: boolean;
  skrIdentityAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateUserInput = Partial<
  Pick<User, "username" | "displayName" | "avatarUrl" | "bio">
>;

export interface UserProfile extends User {
  isFollowing?: boolean; // when viewing someone else's profile
}

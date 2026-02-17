// src/types/user.ts
export interface User {
  _id: string; // MongoDB uses _id not id
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateUserInput = Partial<
  Pick<User, 'username' | 'displayName' | 'avatarUrl' | 'bio'>
>;

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  totalDistance: number; // in meters
  totalActivities: number;
  totalTime: number; // in seconds
  skrBalance: number;
  skrEarned: number; // lifetime earned
  isFollowing?: boolean; // when viewing someone else's profile
}

//   export type CreateUserInput = Pick
//     User,
//     'walletAddress' | 'username' | 'displayName'
//   > & {
//     avatarUrl?: string | null;
//     bio?: string | null;
//   };

//   export type UpdateUserInput = Partial
//     Pick<User, 'username' | 'displayName' | 'avatarUrl' | 'bio'>
//   >;

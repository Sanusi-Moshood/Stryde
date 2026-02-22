import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectWallet, disconnectWallet } from '../src/services/wallet';
import { getOrCreateUser, updateUser } from '../src/services/users';
import { User, UpdateUserInput } from '@/src/types';
import { useRouter } from 'expo-router';

const USER_CACHE_KEY = '@user_profile';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  publicKey: string | null;
  user: User | null;

  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  completeProfile: (input: UpdateUserInput) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  publicKey: null,
  user: null,

  initialize: async () => {
    try {
      const authToken = await AsyncStorage.getItem('@wallet_authToken');
      const publicKey = await AsyncStorage.getItem('@wallet_address');
      console.log(authToken + ' saved wallet token');

      if (!authToken || !publicKey) {
        set({ isLoading: false });
        return;
      }

      // Check cache first
      const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        const user = JSON.parse(cached) as User;
        set({
          isAuthenticated: true,
          publicKey,
          user,
          isLoading: false,
        });
        return;
      }

      // No cache → hit server
      const user = await getOrCreateUser(publicKey);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));

      set({
        isAuthenticated: true,
        publicKey,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  connect: async () => {
    try {
      set({
        isLoading: true,
      });
      const { publicKey, authToken } = await connectWallet();
      console.log(`conn result in authstore ${publicKey}`);

      // Dummy user with no username to trigger profile setup
      const dummyUser: User = {
        _id: 'dummy123',
        walletAddress: publicKey,
        username: 'olawaledev',
        displayName: 'Olawale',
        avatarUrl: null,
        bio: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save wallet to storage
      await AsyncStorage.setItem('@wallet_address', publicKey);
      await AsyncStorage.setItem('@wallet_authToken', authToken);

      //  server finds or creates user
      // const user = await getOrCreateUser(publicKey);
      // await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(dummyUser));

      const { user } = useAuthStore.getState(); // Get fresh state

      set({
        isLoading: false,
        isAuthenticated: true,
        publicKey,
        user: dummyUser,
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  },

  completeProfile: async (input: UpdateUserInput) => {
    const { publicKey } = get();
    if (!publicKey) throw new Error('No wallet connected');

    try {
      const updatedUser = await updateUser(publicKey, input);

      // Update cache with new profile
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));

      set({ user: updatedUser });
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  },

  disconnect: async () => {
    try {
      const authToken = await AsyncStorage.getItem('@wallet_authToken');
      if (!authToken) return;

      await disconnectWallet(authToken);

      // Clear everything
      await AsyncStorage.multiRemove([
        '@wallet_address',
        '@wallet_authToken',
        USER_CACHE_KEY,
      ]);

      set({
        isAuthenticated: false,
        publicKey: null,
        user: null,
      });

      console.log('wallet disconnected');
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
      throw error;
    }
  },
}));

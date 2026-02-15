import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectWallet, disconnectWallet } from '../services/wallet';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  publicKey: string | null;

  initialize: () => Promise<void>;
  connect: (walletId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  walletAddress: null,
  publicKey: null,

  initialize: async () => {
    try {
      // Check if user was previously connected
      const savedWallet = await AsyncStorage.getItem('@wallet_address');
      if (savedWallet) {
        set({
          isAuthenticated: true,
          walletAddress: savedWallet,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  connect: async (walletId: string) => {
    // will do later
    // try {
    //   const { address, publicKey } = await connectWallet(walletId);
    //   // Save to storage
    //   await AsyncStorage.setItem('@wallet_address', address);
    //   set({
    //     isAuthenticated: true,
    //     walletAddress: address,
    //     publicKey,
    //   });
    // } catch (error) {
    //   console.error('Wallet connection failed:', error);
    //   throw error;
    // }
  },

  disconnect: async () => {
    try {
      await disconnectWallet();
      await AsyncStorage.removeItem('@wallet_address');

      set({
        isAuthenticated: false,
        walletAddress: null,
        publicKey: null,
      });
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
      throw error;
    }
  },
}));

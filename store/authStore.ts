import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectWallet, disconnectWallet } from "../src/services/wallet";
import { User, UpdateUserInput } from "@/src/types";
import { useRouter } from "expo-router";
import { connectToServer, getMe, setupProfile } from "@/src/services/users";

const USER_CACHE_KEY = "@user_profile";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  publicKey: string | null;
  user: User | null;
  isNewUser: boolean;

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
  isNewUser: false,

  initialize: async () => {
    try {
      const accessToken = await AsyncStorage.getItem("@wallet_accessToken");
      const publicKey = await AsyncStorage.getItem("@wallet_address");
      console.log(accessToken + " saved wallet token");

      if (!accessToken || !publicKey) {
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
      const user = await getMe();
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      set({
        isAuthenticated: true,
        publicKey,
        user,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      set({ isLoading: false });
    }
  },

  connect: async () => {
    try {
      set({
        isLoading: true,
      });

      // Step 1 - connect mobile wallet adapter
      const { publicKey, authToken } = await connectWallet();
      console.log(`conn result in authstore ${publicKey}`);

      // Step 2 - connect to our server
      const { user, accessToken, refreshToken, isNewUser } =
        await connectToServer(publicKey);
      console.log("🆕 isNewUser from server:", isNewUser);

      // Step 3 - save tokens and wallet info
      await AsyncStorage.setItem("@wallet_address", publicKey);
      await AsyncStorage.setItem("@wallet_authToken", authToken);
      await AsyncStorage.setItem("@wallet_accessToken", accessToken);
      await AsyncStorage.setItem("@wallet_refreshToken", refreshToken);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));

      set({
        isLoading: false,
        isAuthenticated: true,
        publicKey,
        user,
        isNewUser,
      });
    } catch (error) {
      console.error("Wallet connection failed:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  completeProfile: async (input: UpdateUserInput) => {
    try {
      const updatedUser = await setupProfile(input);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  },

  disconnect: async () => {
    try {
      const authToken = await AsyncStorage.getItem("@wallet_authToken");
      // Deauthorize from Mock MWA
      if (authToken) {
        await disconnectWallet(authToken); // this calls wallet.deauthorize()
      }

      await AsyncStorage.multiRemove([
        "@wallet_address",
        "@wallet_authToken",
        "@wallet_accessToken",
        "@wallet_refreshToken",
        USER_CACHE_KEY,
      ]);

      set({
        isAuthenticated: false,
        publicKey: null,
        user: null,
      });
      console.log("wallet disconnected");
    } catch (error) {
      console.error("Wallet disconnect failed:", error);
      throw error;
    }
  },
}));

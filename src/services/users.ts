import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, UpdateUserInput } from "../types";

const BASE_URL = "https://vernon-carposporic-unverbally.ngrok-free.dev/api";

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("@wallet_accessToken");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    Authorization: `Bearer ${token}`,
  };
};

export async function connectToServer(walletAddress: string): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> {
  const response = await fetch(`${BASE_URL}/auth/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ walletAddress }),
  });
  if (!response.ok) throw new Error("Failed to connect to server");
  const data = await response.json();
  return data.data;
}

export async function setupProfile(input: UpdateUserInput): Promise<User> {
  const headers = await getAuthHeader();
  console.log("🔐 Auth header:", JSON.stringify(headers));
  console.log("📝 Setup profile input:", JSON.stringify(input));

  const response = await fetch(`${BASE_URL}/auth/profile/setup`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

  console.log("📡 Setup profile status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log("❌ Setup profile error:", error);
    throw new Error("Failed to setup profile");
  }

  const data = await response.json();
  return data.data.user;
}

export async function getMe(): Promise<User> {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers,
  });
  if (!response.ok) throw new Error("Failed to get user");
  const data = await response.json();
  return data.data.user;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem("@wallet_refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) throw new Error("Failed to refresh token");
  const data = await response.json();

  await AsyncStorage.setItem("@wallet_accessToken", data.data.accessToken);
  await AsyncStorage.setItem("@wallet_refreshToken", data.data.refreshToken);

  return data.data.accessToken;
}

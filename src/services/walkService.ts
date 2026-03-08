import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinate } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// Try to refresh the access token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem("@wallet_refreshToken");
    if (!refreshToken) return null;

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const newAccessToken = data.data.accessToken;

    await AsyncStorage.setItem("@wallet_accessToken", newAccessToken);
    return newAccessToken;
  } catch {
    return null;
  }
};

// Get auth header, refresh token if needed
const getAuthHeader = async () => {
  let token = await AsyncStorage.getItem("@wallet_accessToken");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    Authorization: `Bearer ${token}`,
  };
};

export interface WalkSubmission {
  activityType: "walk" | "run" | "hike" | "ride";
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  steps: number;
  calories: number;
  coordinates: Coordinate[];
  elevationGain?: number;
}

export interface WalkResult {
  walkId: string;
  activityType: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  steps: number;
  calories: number;
  tokensEarned: number;
  isSeeker: boolean;
  seekerMultiplier: number;
  tokenBreakdown: string;
  mintTxSignature: string | null;
  status: string;
}

export async function submitWalk(data: WalkSubmission): Promise<WalkResult> {
  let headers = await getAuthHeader();

  let response = await fetch(`${BASE_URL}/walks/submit`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  //  Token expired — try refresh then retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      throw new Error("Session expired. Please reconnect your wallet.");
    }

    // Retry with new token
    headers = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };

    response = await fetch(`${BASE_URL}/walks/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    // Still failing after refresh
    if (response.status === 401) {
      throw new Error("Session expired. Please reconnect your wallet.");
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Failed to submit walk");
  }

  const result = await response.json();
  return result.data;
}

export async function getWalkHistory(page = 1, limit = 20) {
  const headers = await getAuthHeader();

  const response = await fetch(
    `${BASE_URL}/walks/history?page=${page}&limit=${limit}`,
    { method: "GET", headers },
  );

  if (!response.ok) throw new Error("Failed to get walk history");
  const data = await response.json();
  return data.data;
}

export async function getWalkStats() {
  const headers = await getAuthHeader();

  const response = await fetch(`${BASE_URL}/walks/stats`, {
    method: "GET",
    headers,
  });

  if (!response.ok) throw new Error("Failed to get walk stats");
  const data = await response.json();
  return data.data;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UpdateUserInput } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('@wallet_accessToken');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ walletAddress }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Status:', response.status, 'Body:', errorBody);
    throw new Error(`Server error: ${response.status} - ${errorBody}`);
  }
  const data = await response.json();
  return data.data;
}

export async function setupProfile(input: UpdateUserInput): Promise<User> {
  let headers = await getAuthHeader();
  let response = await fetch(`${BASE_URL}/auth/profile/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    await refreshAccessToken();
    headers = await getAuthHeader();
    response = await fetch(`${BASE_URL}/auth/profile/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
  }

  if (!response.ok) throw new Error('Failed to setup profile');
  const data = await response.json();
  return data.data.user;
}

export async function getMe(): Promise<User> {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) throw new Error('Failed to get user');
  const data = await response.json();
  return data.data.user;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem('@wallet_refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) throw new Error('Failed to refresh token');
  const data = await response.json();

  await AsyncStorage.setItem('@wallet_accessToken', data.data.accessToken);
  await AsyncStorage.setItem('@wallet_refreshToken', data.data.refreshToken);

  return data.data.accessToken;
}

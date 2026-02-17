import { User, UpdateUserInput } from '../types';

const BASE_URL = 'https://your-api.com/api'; // Your Express server URL

export async function getOrCreateUser(walletAddress: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) throw new Error('Failed to get/create user');

  const { user } = await response.json();
  return user;
}

export async function updateUser(
  walletAddress: string,
  input: UpdateUserInput,
): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/${walletAddress}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error('Failed to update user');

  const { user } = await response.json();
  return user;
}

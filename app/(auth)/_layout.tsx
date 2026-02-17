import { Stack, useSegments } from 'expo-router';
import { useRef } from 'react';

export default function AuthLayout() {
  const segments = useSegments();

  const prevSegments = useRef<string[]>([]);

  const cameFromSplash =
    prevSegments.current.includes('splash') &&
    segments.includes('profile-setup');

  // update AFTER computing
  prevSegments.current = segments;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen
        name='splash'
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name='walletConnect'
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name='profile-setup'
        options={{
          animation: cameFromSplash ? 'fade' : 'slide_from_right', // Slides up from bottom
        }}
      />
    </Stack>
  );
}

import '@/src/polyfills';
import { useEffect, useCallback } from 'react';
import { Slot, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { View } from 'react-native';
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onSplash = segments.at(1) === 'splash';

    // Always show splash on fresh app open
    if (!inAuthGroup) {
      router.replace('/(auth)/splash');
    }
  }, [isLoading, fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading && fontsLoaded) {
      // Hide splash once auth check is done
      await SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return null; // Native splash stays visible
  }

  return (
    <View
      style={{ flex: 1 }}
      onLayout={() => {
        onLayoutRootView();
      }}
    >
      <StatusBar style='light' />
      <Slot />
    </View>
  );
}

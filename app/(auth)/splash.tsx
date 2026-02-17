import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useAuthStore } from '@/store/authStore';

export default function Splash() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        // Not logged in → wallet connect
        router.replace('/(auth)/walletConnect');
      } else if (isAuthenticated && !user?.username) {
        // connected wallet but no profile → profile setup
        router.replace('/(auth)/profile-setup');
      } else {
        // Logged in + has profile → home
        router.replace('/(tabs)/home');
      }
    }, 3000); // Match your Lottie duration

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* <LottieView
        ref={animationRef}
        source={require('@/assets/animations/Splash.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      /> */}

      <Image
        source={require('@/assets/spalsh-screen.png')}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

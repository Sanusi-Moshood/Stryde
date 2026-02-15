import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

export default function Splash() {
  const router = useRouter();
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Auto-navigate after animation plays once (adjust timing to your animation length)
    const timer = setTimeout(() => {
      router.replace('/(auth)/walletConnect');
    }, 1500); // 3 seconds - adjust based on your Lottie duration

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

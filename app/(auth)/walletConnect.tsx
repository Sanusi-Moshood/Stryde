import { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/src/components/Text';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function WalletConnect() {
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { connect, isLoading } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleConnect = async () => {
    try {
      const { isNewUser } = await connect();
      // Auto-redirects to app after successful connection

      const { user } = useAuthStore.getState();

      console.log(user);
      if (isNewUser) {
        router.replace('/(auth)/profile-setup');

        console.log('username not set yet');
      } else {
        console.log('user exist, go to home');
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
      setSelectedWallet(null);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/splash.png')}
        resizeMode='cover'
        style={styles.image}
      >
        <View
          style={{ flex: 1, gap: 8, width: '100%', paddingTop: insets.top }}
        >
          <Image
            source={require('../../assets/walletscreen.png')}
            style={styles.animationImage}
          />
          <View style={styles.connectBox}>
            <Image
              source={require('../../assets/images/activityIcons.png')}
              style={{ width: 212, height: 70.67, marginTop: -11 }}
            />

            <View style={{ alignItems: 'center', gap: 32 }}>
              <Text style={styles.text}>
                Track Every Move Earn{' '}
                <Text style={[{ color: '#FF3D00' }, styles.text]}>$SKR</Text>
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConnect}
                style={styles.button}
                disabled={isLoading}
              >
                <FontAwesome6 name='plus' size={18} color='black' />
                <Text
                  style={{
                    fontFamily: 'Archivo_500Medium',
                    color: '#000000',
                    fontSize: 20,
                  }}
                >
                  Connect Wallet
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
      {/* Lottie Map Animation */}
      <View>
        {/* <LottieView
          source={require('@/assets/animations/map-path.json')} // Your map animation
          autoPlay
          loop
          style={styles.mapAnimation}
        /> */}
      </View>

      {/* Content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  animationImage: {
    flex: 1,
    resizeMode: 'cover',
    width: '100%',
    borderRadius: 40,
    borderColor: '#FFFFFF14',
    borderWidth: 1,
  },
  image: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  connectBox: {
    backgroundColor: '#00000052',
    height: '39.4%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 24.3,
  },
  text: {
    fontSize: 40,
    fontWeight: 'semibold',
    fontFamily: 'Archivo_600SemiBold',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    paddingVertical: 12,
    paddingRight: 20,
    paddingLeft: 25,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

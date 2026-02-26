import { useAuthStore } from '@/store/authStore';
import { View, Text, Pressable } from 'react-native';

export default function Home() {
  const { connect, disconnect } = useAuthStore();

  const handleConnect = async () => {
    try {
      await disconnect();
      // Auto-redirects to app after successful connection
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Text>Home Scr</Text>

      <Pressable
        onPress={handleConnect}
        style={{
          backgroundColor: '#000000',
          paddingVertical: 12,
          paddingRight: 20,
          paddingLeft: 25,
          borderRadius: 100,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Text
          style={{
            fontFamily: 'Archivo_500Medium',
            color: '#000000',
            fontSize: 20,
          }}
        >
          Disconnect Wallet
        </Text>
      </Pressable>
    </View>
  );
}

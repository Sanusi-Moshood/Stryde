import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, disconnect } = useAuthStore();

  const walletAddress = user?.walletAddress ?? '';
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '----';

  const tokenBalance = user?.tokenBalance ?? 0;
  const totalDistance = ((user?.stats?.totalDistanceMeters ?? 0) / 1000).toFixed(2);
  const totalWalks = user?.stats?.totalWalks ?? 0;
  const totalTokensEarned = user?.lifetimeEarnedTokens ?? 0;

  const handleLogout = () => {
    disconnect();
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.screenTitle}>Profile</Text>

      {/* Wallet card */}
      <View style={styles.walletCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={32} color="#FF3D00" />
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Connected Wallet</Text>
          <Text style={styles.walletAddress}>{shortWallet}</Text>
        </View>
      </View>

      {/* Token balance — hero card */}
      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>$SKR Balance</Text>
        <Text style={styles.tokenBalance}>{tokenBalance.toLocaleString()}</Text>
        <Text style={styles.tokenSub}>Stryde Tokens</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWalks}</Text>
          <Text style={styles.statLabel}>Walks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalDistance}</Text>
          <Text style={styles.statLabel}>km Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTokensEarned.toLocaleString()}</Text>
          <Text style={styles.statLabel}>$SKR Earned</Text>
        </View>
      </View>

      {/* Settings section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#888888" />
          <Text style={styles.menuLabel}>Seeker Status</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="trophy-outline" size={20} color="#888888" />
          <Text style={styles.menuLabel}>Achievements</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="time-outline" size={20} color="#888888" />
          <Text style={styles.menuLabel}>Walk History</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#FF3D00" />
        <Text style={styles.logoutText}>Disconnect Wallet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Archivo_700Bold',
    marginBottom: 24,
  },

  // Wallet card
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    gap: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Archivo_400Regular',
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Archivo_600SemiBold',
    letterSpacing: 1,
  },

  // Token hero card
  tokenCard: {
    backgroundColor: '#FF3D00',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Archivo_400Regular',
    marginBottom: 8,
  },
  tokenBalance: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Archivo_700Bold',
    lineHeight: 64,
  },
  tokenSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Archivo_400Regular',
    marginTop: 4,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Archivo_700Bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#888888',
    fontFamily: 'Archivo_400Regular',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#888888',
    fontFamily: 'Archivo_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Archivo_400Regular',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 61, 0, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.25)',
  },
  comingSoonText: {
    fontSize: 10,
    color: '#FF3D00',
    fontFamily: 'Archivo_500Medium',
    letterSpacing: 0.5,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 61, 0, 0.08)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.25)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3D00',
    fontFamily: 'Archivo_600SemiBold',
  },
});
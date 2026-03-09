import { useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/src/components/Text';
import { Ionicons } from '@expo/vector-icons';

const LOCATION_PERMISSION_ASKED_KEY = '@location_permission_asked';

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useRequestLocationOnMount() {
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  async function requestPermissions() {
    try {
      const alreadyAsked = await AsyncStorage.getItem(
        LOCATION_PERMISSION_ASKED_KEY,
      );
      if (alreadyAsked === 'true') return;

      await AsyncStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, 'true');

      // Step 1 — OS foreground modal fires immediately (no pre-modal)
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Stryde needs location access to track your walks and earn $SKR tokens. Enable it in Settings.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      // Step 2 — Foreground granted, show our branded background modal
      setShowBackgroundModal(true);
    } catch (error) {
      console.error('Location permission request failed:', error);
    }
  }

  async function handleAllowBackground() {
    setShowBackgroundModal(false);
    await Location.requestBackgroundPermissionsAsync();
  }

  function handleDenyBackground() {
    setShowBackgroundModal(false);
  }

  return {
    showBackgroundModal,
    handleAllowBackground,
    handleDenyBackground,
  };
}

// ─── Background Modal (the only custom modal) ─────────────────────────────────
export function BackgroundLocationModal({
  visible,
  onAllow,
  onDeny,
}: {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType='slide'
      onRequestClose={onDeny}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name='navigate' size={32} color='#FF3D00' />
          </View>

          <Text style={styles.title}>One More Step</Text>

          <Text style={styles.body}>
            To keep tracking your walk when your screen turns off, Stryde needs
            background location access.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>
                Tap <Text style={styles.stepHighlight}>"Open Settings"</Text> below
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>
                Select <Text style={styles.stepHighlight}>"Allow all the time"</Text> under Location
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.allowButton}
            onPress={onAllow}
            activeOpacity={0.8}
          >
            <Text style={styles.allowButtonText}>Open Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.denyButton}
            onPress={onDeny}
            activeOpacity={0.8}
          >
            <Text style={styles.denyButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 61, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Archivo_700Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Archivo_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  stepsList: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3D00',
    marginTop: 7,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Archivo_400Regular',
    lineHeight: 20,
  },
  stepHighlight: {
    color: '#FFFFFF',
    fontFamily: 'Archivo_600SemiBold',
  },
  allowButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#FF3D00',
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 10,
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Archivo_700Bold',
  },
  denyButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  denyButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Archivo_400Regular',
  },
});
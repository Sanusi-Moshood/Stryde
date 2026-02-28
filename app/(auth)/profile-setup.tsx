import { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/src/components/Text';

const avatars = [
  require('../../assets/avatars/av1.png'),
  require('../../assets/avatars/av2.png'),
  require('../../assets/avatars/av3.png'),
  require('../../assets/avatars/av4.png'),
  require('../../assets/avatars/av5.png'),
  require('../../assets/avatars/av6.png'),
];

export default function ProfileSetup() {
  const router = useRouter();
  const { completeProfile, user } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState({
    displayName: '',
    username: '',
  });

  useEffect(() => {
    // Pick a random avatar on mount
    setAvatarIndex(Math.floor(Math.random() * avatars.length));
  }, []);

  const validate = () => {
    let valid = true;
    const newErrors = { displayName: '', username: '' };

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
      valid = false;
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    } else if (username.length < 3) {
      newErrors.username = 'At least 3 characters';
      valid = false;
    } else if (username.includes(' ')) {
      newErrors.username = 'No spaces allowed';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await completeProfile({
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: Image.resolveAssetSource(avatars[avatarIndex]).uri,
      });

      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Profile setup failed:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/bgp.png')}
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      resizeMode='cover'
    >
      <View
        style={{
          marginBottom: insets.bottom,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          flex: 1,
        }}
      >
        <KeyboardAvoidingView
          style={[
            styles.flex,
            {
              justifyContent: 'flex-end',
            },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Image source={avatars[avatarIndex]} style={styles.avatar} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.displayName ? styles.inputError : null,
                  ]}
                  placeholderTextColor='#555E7A'
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    setErrors((e) => ({ ...e, displayName: '' }));
                  }}
                  maxLength={30}
                />
                {errors.displayName ? (
                  <Text style={styles.errorText}>{errors.displayName}</Text>
                ) : null}
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.username ? styles.inputError : null,
                  ]}
                  placeholderTextColor='#555E7A'
                  value={`@${username}`}
                  onChangeText={(text) => {
                    const withoutAt = text.startsWith('@') ? text.slice(1) : '';
                    setUsername(withoutAt);
                    setErrors((e) => ({ ...e, username: '' }));
                  }}
                  maxLength={30}
                />
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : null}
              </View>

              {/* Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Bio
                  <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholderTextColor='#555E7A'
                  value={bio}
                  onChangeText={setBio}
                  maxLength={150}
                  multiline
                  textAlignVertical='top'
                />
              </View>
            </View>
          </ScrollView>
          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!displayName || !username || loading) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!displayName || !username || loading}
          >
            {loading ? (
              <ActivityIndicator color='#080B14' />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
  },
  flex: {
    flex: 1,
    flexGrow: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    alignSelf: 'center',
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  plusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#080B14',
    marginTop: -1,
  },
  form: {
    width: '100%',
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Archivo_700Bold',
    color: '#FFFFFF',
  },
  optionalText: {
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 10,
    paddingLeft: 12,
    minHeight: 44,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    width: '100%',
  },
  bioInput: {
    height: 120,
    paddingTop: 10,

    paddingLeft: 12,
  },

  inputError: {
    borderColor: '#FF4D6D',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D6D',
    fontFamily: 'Archivo_400Regular',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  button: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: 'Archivo_700Bold',
    color: '#000000',
    fontWeight: 500,
  },
});

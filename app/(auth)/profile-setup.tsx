import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function ProfileSetup() {
  const router = useRouter();
  const { completeProfile, user } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    displayName: '',
    username: '',
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission needed to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

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
  if (!validate()) return

  setLoading(true)
  try {
    await completeProfile({
      username: username.toLowerCase().trim(),
      displayName: displayName.trim(),
      avatarUrl: avatar ?? '', // send empty string if no avatar for now
      bio: '',                 // add empty bio since backend requires it
    })

    router.replace('/(tabs)/home')
  } catch (error) {
    console.error('Profile setup failed:', error)
    alert('Something went wrong. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Profile</Text>
          <Text style={styles.subtitle}>
            How should other athletes know you?
          </Text>
          {/* Show wallet address */}
          {user?.walletAddress && (
            <View style={styles.walletBadge}>
              <Text style={styles.walletText}>
                👛 {user.walletAddress.slice(0, 4)}...
                {user.walletAddress.slice(-4)}
              </Text>
            </View>
          )}
        </View>

        {/* Avatar picker */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>📷</Text>
              <Text style={styles.avatarHint}>Add Photo</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✏️</Text>
          </View>
        </TouchableOpacity>

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
              placeholder='e.g. Alex Runner'
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
            <View
              style={[
                styles.usernameWrap,
                errors.username ? styles.inputError : null,
              ]}
            >
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                placeholder='yourhandle'
                placeholderTextColor='#555E7A'
                value={username}
                onChangeText={(text) => {
                  setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''));
                  setErrors((e) => ({ ...e, username: '' }));
                }}
                maxLength={20}
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>
            {errors.username ? (
              <Text style={styles.errorText}>{errors.username}</Text>
            ) : (
              <Text style={styles.hintText}>
                Letters, numbers and underscores only
              </Text>
            )}
          </View>
        </View>

        {/* Button */}
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
            <Text style={styles.buttonText}>Let's Go 🏃</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          You can update this anytime in settings
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Archivo_700Bold',
    color: '#F0F2FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: '#8B91AC',
    marginBottom: 12,
  },
  walletBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    borderRadius: 8,
  },
  walletText: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    color: '#A78BFA',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 36,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E8FF47',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#141827',
    borderWidth: 2,
    borderColor: '#252D45',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarIcon: {
    fontSize: 28,
  },
  avatarHint: {
    fontSize: 11,
    color: '#555E7A',
    fontFamily: 'Archivo_400Regular',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8FF47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    fontSize: 12,
  },
  form: {
    width: '100%',
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Archivo_700Bold',
    color: '#8B91AC',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0E1220',
    borderWidth: 1,
    borderColor: '#252D45',
    borderRadius: 14,
    padding: 16,
    color: '#F0F2FF',
    fontSize: 15,
    fontFamily: 'Archivo_400Regular',
    width: '100%',
  },
  usernameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1220',
    borderWidth: 1,
    borderColor: '#252D45',
    borderRadius: 14,
    paddingLeft: 16,
  },
  atSign: {
    color: '#555E7A',
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
  },
  usernameInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 4,
    color: '#F0F2FF',
    fontSize: 15,
    fontFamily: 'Archivo_400Regular',
  },
  inputError: {
    borderColor: '#FF4D6D',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D6D',
    fontFamily: 'Archivo_400Regular',
  },
  hintText: {
    fontSize: 12,
    color: '#555E7A',
    fontFamily: 'Archivo_400Regular',
  },
  button: {
    width: '100%',
    padding: 18,
    backgroundColor: '#E8FF47',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Archivo_700Bold',
    color: '#080B14',
  },
  footer: {
    fontSize: 12,
    color: '#555E7A',
    fontFamily: 'Archivo_400Regular',
    textAlign: 'center',
  },
});

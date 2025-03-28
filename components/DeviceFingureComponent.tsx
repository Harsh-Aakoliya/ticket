import React, { useState } from 'react';
import { 
  Pressable, 
  Text, 
  View, 
  Platform, 
  StyleSheet, 
  Alert 
} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const DeviceFingerprintComponent = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  const handleGetFingerprint = async () => {
    try {
      // Check platform compatibility
      if (Platform.OS !== 'android') {
        Alert.alert(
          'Unsupported Platform', 
          'Device fingerprint is only available on Android'
        );
        return;
      }

      // Retrieve fingerprint
      const deviceFingerprint = await DeviceInfo.getFingerprint();
      
      // Update state
      setFingerprint(deviceFingerprint);

      // Optional: Copy to clipboard or perform other actions
      console.log('Device Fingerprint:', deviceFingerprint);

      // Show alert with fingerprint
      Alert.alert(
        'Device Fingerprint', 
        deviceFingerprint || 'Unable to retrieve fingerprint'
      );
    } catch (error) {
      console.error('Fingerprint Retrieval Error:', error);
      
      // Handle potential errors
      Alert.alert(
        'Error', 
        'Failed to retrieve device fingerprint',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={handleGetFingerprint}
        style={({ pressed }) => [
          styles.button,
          { 
            backgroundColor: pressed ? '#e0e0e0' : '#f0f0f0',
            opacity: pressed ? 0.8 : 1 
          }
        ]}
      >
        <Text style={styles.buttonText}>Get Device Fingerprint</Text>
      </Pressable>

      {fingerprint && (
        <View style={styles.fingerprintContainer}>
          <Text style={styles.fingerprintLabel}>Fingerprint:</Text>
          <Text style={styles.fingerprintText} numberOfLines={2}>
            {fingerprint}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fingerprintContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    width: '100%',
  },
  fingerprintLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  fingerprintText: {
    color: '#333',
    fontSize: 12,
  },
});

export default DeviceFingerprintComponent;
// FailureDetailsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';

interface ScannedDetails {
  ScannedOn: string | null;
  ScannedBy: number | null;
}

interface FailureDetailsProps {
  lastScannedDetails: {
    H1: ScannedDetails;
    H2: ScannedDetails;
    H3: ScannedDetails;
  };
  onOkPress: () => void;
}

const FailureDetailsScreen: React.FC<FailureDetailsProps> = ({
  lastScannedDetails,
  onOkPress,
}) => {
  const renderScannedDetails = (details: ScannedDetails, title: string) => (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>{title}</Text>
      <Text style={styles.detailText}>
        Scanned On: {details.ScannedOn || 'Not scanned'}
      </Text>
      {/* <Text style={styles.detailText}>
        Scanned At: {details.ScannedAt || 'Not scanned'}
      </Text> */}
      <Text style={styles.detailText}>
        Scanned By: {details.ScannedBy || 'Not scanned'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Validation Failed</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Last Scanned Details:</Text>
        {renderScannedDetails(lastScannedDetails.H1, "H1")}
        {renderScannedDetails(lastScannedDetails.H2, "H2")}
        {renderScannedDetails(lastScannedDetails.H3, "H3")}
        <TouchableOpacity style={styles.okButton} onPress={onOkPress}>
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ff3b30',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  okButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: width * 0.8,
    alignSelf: 'center',
    marginTop: 20,
  },
  okButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FailureDetailsScreen;
import { Camera, CameraView } from "expo-camera";
import { Stack } from "expo-router";
import {
  AppState,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
  Vibration,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import FailureDetailsScreen from "@/components/FailureScreen";
interface ScannedDetails {
  ScannedOn: string | null;
  ScannedAt: string | null;
  ScannedBy: number | null;
}
import axios from "axios"

interface ValidationResponse {
  IsSuccess: boolean;
  LastScannedDetails?: {
    H1: ScannedDetails;
    H2: ScannedDetails;
    H3: ScannedDetails;
  };
}

export default function ScannerScreen() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isReadyToScan, setIsReadyToScan] = useState(true);
  const [validationResponse, setValidationResponse] = useState<ValidationResponse | null>(null);
  const [showFailureScreen, setShowFailureScreen] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
  function getISTDate() {
    let date = new Date();
    let istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    let istTime = new Date(date.getTime() + istOffset);
    return istTime.toISOString().slice(0, 19).replace("T", " "); // Format: "YYYY-MM-DD HH:MM:SS"
}
  const handleBarcodeScan = async ({ data }: { data: string }) => {
    console.log(data);
    // Only proceed if we're ready to scan and not locked
    if (data && !qrLock.current && isReadyToScan) {
      // Immediately lock scanning
      qrLock.current = true;
      setIsReadyToScan(false);
      setScannedData(data);
      
      try {
        // const response: ValidationResponse = await (await axios.post("http://192.16890.33:3000", {
          const response: ValidationResponse = await (await axios.post("http://192.168.8.13/TicketWebAPI/api/scan", {
          qrcodedata: data,
          scannedon: getISTDate(),
          scannedby: "1",
          location: "H1"
        }))?.data;
        
        console.log("API Response:", response);
        setValidationResponse(response);
        
        if (!response.IsSuccess) {
          Vibration.vibrate(3000);
          setShowFailureScreen(true);
        } else {
          Alert.alert(
            "Success", 
            "QR Code validated successfully!", 
            [
              { 
                text: "Scan Another QR", 
                onPress: () => {
                  handleReset();
                  setIsReadyToScan(true);
                }
              }
            ],
            { cancelable: false } // Prevent touching outside to dismiss
          );
        }
      } catch (error) {
        console.error("API call failed:", error);
        Alert.alert(
          "Error", 
          "Failed to validate QR code (API request problem)", 
          [
            { 
              text: "Scan Another QR", 
              onPress: () => {
                handleReset();
                setIsReadyToScan(true);
              }
            }
          ],
          { cancelable: false } // Prevent touching outside to dismiss
        );
      }
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setValidationResponse(null);
    qrLock.current = false;
    setIsReadyToScan(true);
  };

  const handleOkPress = () => {
    Alert.alert(
      "Options",
      "Choose an action",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Scan Another QR", 
          onPress: () => {
            setShowFailureScreen(false);
            handleReset();
          } 
        }
      ]
    );
  };

  const renderScannedDetails = (details: ScannedDetails, title: string) => (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>{title}</Text>
      <Text>Scanned On: {details.ScannedOn || 'Not scanned'}</Text>
      <Text>Scanned At: {details.ScannedAt || 'Not scanned'}</Text>
      <Text>Scanned By: {details.ScannedBy || 'Not scanned'}</Text>
    </View>
  );

  const renderScannedContent = () => {
    if (!validationResponse) return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data Found</Text>
      </View>
    );

    if (!validationResponse.IsSuccess && validationResponse.LastScannedDetails) {
      return (
        <View style={styles.scannedContentContainer}>
          <Text style={styles.scannedDataTitle}>Last Scanned Details:</Text>
          {renderScannedDetails(validationResponse.LastScannedDetails.H1, "H1")}
          {renderScannedDetails(validationResponse.LastScannedDetails.H2, "H2")}
          {renderScannedDetails(validationResponse.LastScannedDetails.H3, "H3")}
          <TouchableOpacity 
            style={styles.okButtonContainer}
            onPress={handleOkPress}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannedContentContainer}>
        <Text style={styles.successText}>Validation Successful!</Text>
        <TouchableOpacity 
          style={styles.resetButtonContainer}
          onPress={handleReset}
        >
          <Text style={styles.resetButtonText}>Scan Another QR</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const mockApiCall = async (data: string): Promise<ValidationResponse> => {
    // await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      
      IsSuccess: false,
      // IsSuccess: true,
      LastScannedDetails: {
        H1: {
          ScannedOn: "2025-03-23T15:31:22.35",
          ScannedAt: "H1",
          ScannedBy: 1
        },
        H2: {
          ScannedOn: "2025-03-23T15:31:22.35",
          ScannedAt: "H2",
          ScannedBy: 1
        },
        H3: {
          ScannedOn: null,
          ScannedAt: null,
          ScannedBy: null
        }
      }
    };
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      {showFailureScreen && validationResponse?.LastScannedDetails ? (
        <FailureDetailsScreen
          lastScannedDetails={validationResponse.LastScannedDetails}
          onOkPress={handleOkPress}
        />
      ) : (
        <>
          <Stack.Screen
            options={{
              title: "Scanner",
              headerShown: false,
            }}
          />
          {Platform.OS === "android" ? <StatusBar hidden /> : null}
          
          <View style={styles.container}>
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={isReadyToScan ? handleBarcodeScan : undefined}
            />
            {(!isReadyToScan || qrLock.current) && (
              <View style={styles.overlayContainer}>
                <Text style={styles.overlayText}>
                  {validationResponse?.IsSuccess 
                    ? "Scan Successful!" 
                    : "Processing QR Code..."}
                </Text>
              </View>
            )}
          </View>
            <View style={styles.contentContainer}>
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data Found</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    height: height * 0.80,
    overflow: 'hidden',
    position: 'relative',
  },
  contentContainer: {
    height: height * 0.20,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  scannedContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    color: '#888',
  },
  scannedDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    width: '100%',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  okButtonContainer: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: width * 0.7,
    alignItems: 'center',
  },
  okButtonText: {
    color: 'white',
    fontSize: 16,
  },
  resetButtonContainer: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: width * 0.7,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 20,
    color: '#4CAF50',
    marginBottom: 20,
  },
});
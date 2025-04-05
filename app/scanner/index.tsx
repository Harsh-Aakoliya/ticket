// scanner/index.tsx
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
  ActivityIndicator,
  Animated,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { createIconSetFromFontello, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Audio } from "expo-av";
import { useLocalSearchParams } from 'expo-router';

interface ScannedDetails {
  ScannedOn: string | null;
  ScannedBy: string | null;
}

interface ValidationResponse {
  IsSuccess: boolean;
  ticketDate?: string;
  ticketType?: string;
  LastScannedDetails?: {
    H1: ScannedDetails;
    H2: ScannedDetails;
    H3: ScannedDetails;
  };
}

interface UserData {
  deviceId: string;
  hallNumber: number;
  ticketType: string;
}

export default function ScannerScreen() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResponse, setValidationResponse] = useState<ValidationResponse | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<"H1" | "H2" | "H3" | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const failureSoundInterval = useRef<NodeJS.Timeout | null>(null);
  const [lastTicketNumber, setLastTicketNumber] = useState<string | null>("No Ticket Scanned");

  const [lastVisitedTime,setLastVisitedTime]=useState<string|null>(null);
  
  // Animation values for hall circles
  const animation = useRef(new Animated.Value(0)).current;
  const [animatingHall, setAnimatingHall] = useState<"H1" | "H2" | "H3" | null>(null);

  const params = useLocalSearchParams();
  const userDataParam = params.userData;
  
  // Ensure we're working with a string
  const userDataString = Array.isArray(userDataParam) 
    ? userDataParam[0] 
    : userDataParam;
    
  // Parse the string to get our object
  const userData: UserData = userDataString ? JSON.parse(userDataString) : null;
  console.log("User data is ", userData);

  // Get current hall based on userData
  const currentHall = userData?.hallNumber ? `H${userData.hallNumber}` : null;
  
  async function playSound(file: any) {
    const { sound } = await Audio.Sound.createAsync(file);
    soundRef.current = sound;
    await sound.playAsync();
  }

  async function playSuccessSound() {
    await playSound(require('../../assets/success.mp3'));
  }

  async function playFailureSound() {
    await playSound(require('../../assets/failure.mp3'));
  }

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

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Function to check if date is today
  function isToday(dateString: string) {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    return dateString.includes(todayString);
  }

  // Function to get today's date in format to match with API response
  function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function getISTDate() {
    let date = new Date();
    let istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    let istTime = new Date(date.getTime() + istOffset);
    return istTime.toISOString().slice(0, 19).replace("T", " "); // Format: "YYYY-MM-DD HH:MM:SS"
  }

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    console.log(data);
    setLastTicketNumber(data);
    if (data && !qrLock.current && isCameraActive) {
      // Lock scanning and show loading
      qrLock.current = true;
      setIsCameraActive(false);
      setIsLoading(true);
      setScannedData(data);
      setErrorMessage(null);
      
      try {
        // Make API call to validate QR code
        console.log("qrdata ",data);
        console.log("scanedon",getISTDate());
        console.log("Scanned by",userData?.deviceId);
        console.log("scanning for",currentHall);
        // const response: ValidationResponse = await (await axios.post("http://192.168.8.13/TicketWebAPI/api/scan/ticket", {
        //   qrcodedata: data,
        //   scannedon: getISTDate(),
        //   scannedby: userData?.deviceId,
        //   location: currentHall 
        // }))?.data;

        // interface ValidationResponse {
        //   IsSuccess: boolean;
        //   ticketDate?: string;
        //   ticketType?: string;
        //   LastScannedDetails?: {
        //     H1: ScannedDetails;
        //     H2: ScannedDetails;
        //     H3: ScannedDetails;
        //   };
        // }

        const response: ValidationResponse ={
          
            IsSuccess:false,
            ticketDate:"05-04-2025",
            ticketType:"Watershow",
            LastScannedDetails:{
              "H1":{
                ScannedOn:"another",
                ScannedBy:"another"
              },
              "H2":{
                ScannedOn:null, 
                ScannedBy:null
              },
              "H3":{
                ScannedOn:"another",
                ScannedBy:"another"
              },
            }
        }

        //mock data
  
        // response.ticketDate="04-04-2025"

        console.log("API Response:", response);
        setValidationResponse(response);
        setIsLoading(false);
        
        if (response.IsSuccess) {
          // Case 1: Success - Animate the current hall to green
          setScanSuccess(true);
          // await playSuccessSound();
          
          // Start animation for the current hall
          if (currentHall) {
            setAnimatingHall(currentHall as "H1" | "H2" | "H3");
            Animated.timing(animation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false
            }).start(() => {
              setAnimatingHall(null);
              animation.setValue(0);
            });
          }
        } else {
          // Case 2: Failure - Check for specific failure types
          Vibration.vibrate(2000);
          // await playFailureSound();
          
          // Check if it's a date mismatch
          console.log("gettodydate",getTodayDate());
          if (response.ticketDate && response.ticketDate !== getTodayDate()) {
            setErrorMessage(`Date mismatch`);
            setLastVisitedTime(null)
          } 
          // Check if it's already visited
          else if (response.LastScannedDetails && 
                  currentHall && 
                  response.LastScannedDetails[currentHall as keyof typeof response.LastScannedDetails]?.ScannedOn) {
            const hallDetails = response.LastScannedDetails[currentHall as keyof typeof response.LastScannedDetails];
            const scannedTime = hallDetails.ScannedOn ? hallDetails.ScannedOn : "";
            setErrorMessage(`Already visited Exhibition`);
            setLastVisitedTime(scannedTime);
          } 
          // Check if it's ticket type mismatch
          else if (response.ticketType && userData?.ticketType && 
                  response.ticketType.toLowerCase() !== userData.ticketType.toLowerCase()) {
            setErrorMessage(`Exhibition mismatch error`);
            setLastVisitedTime(null)
          }
          // Default error
          else {
            setErrorMessage("Validation failed");
            setLastVisitedTime(null)
          }
        }
      } catch (error) {
        console.error("API call failed:", error);
        setIsLoading(false);
        Alert.alert(
          "Error", 
          "Failed to validate QR code. Please try again.", 
          [{ text: "OK" }]
        );
        handleReset();
      }
    }
  };

  const handleReset = () => {
    if (soundRef.current) {
      soundRef.current.stopAsync();
    }
    if (failureSoundInterval.current) {
      clearInterval(failureSoundInterval.current);
      failureSoundInterval.current = null;
    }
    setScannedData(null);
    setValidationResponse(null);
    qrLock.current = false;
    setIsCameraActive(true);
    setIsLoading(false);
    setScanSuccess(false);
    setSelectedCircle(null);
    setErrorMessage(null);
    animation.setValue(0);
    setAnimatingHall(null);
    setLastVisitedTime(null);
  };

  const activateCamera = () => {
    if(isCameraActive){
      setIsCameraActive(false);
      return;
    }
    if (validationResponse && !validationResponse.IsSuccess) {
      // If previous scan failed, show alert before proceeding
      Alert.alert(
        "Warning",
        "A previous scan was unsuccessful. Do you want to continue with a new scan?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => {
            setIsCameraActive(true);
            setValidationResponse(null);
            setSelectedCircle(null);
            setErrorMessage(null);
            qrLock.current = false;
            
            // Stop any playing sounds
            if (soundRef.current) {
              soundRef.current.stopAsync();
            }
            
            // Clear any existing intervals
            if (failureSoundInterval.current) {
              clearInterval(failureSoundInterval.current);
              failureSoundInterval.current = null;
            }
          }}
        ]
      );
    } else {
      // Regular activation
      setIsCameraActive(true);
      setValidationResponse(null);
      setSelectedCircle(null);
      setScanSuccess(false);
      setErrorMessage(null);
      qrLock.current = false;
      
      // Stop any playing sounds
      if (soundRef.current) {
        soundRef.current.stopAsync();
      }
      
      // Clear any existing intervals
      if (failureSoundInterval.current) {
        clearInterval(failureSoundInterval.current);
        failureSoundInterval.current = null;
      }
    }
  };

  const handleCirclePress = (hall: "H1" | "H2" | "H3") => {
    const details = validationResponse?.LastScannedDetails?.[hall];
    if (details && details.ScannedBy !== null) {
      setSelectedCircle(hall);
    }
  };

  const renderCircles = () => {
    const halls = ["H1", "H2", "H3"];
    
    return (
      <View style={styles.circlesContainer}>
        {halls.map((hall) => {
          const hallKey = hall as "H1" | "H2" | "H3";
          const hallDetails = validationResponse?.LastScannedDetails?.[hallKey];
          
          // Determine circle color based on scan state and success
          let circleStyle = styles.notVisitedCircle; // Default grey (only shown before first scan)
          
          if (validationResponse) {
            // If we have any validation response (success or failure)
            if (hallDetails?.ScannedBy !== null) {
              // If hall has been visited, show green
              circleStyle = styles.visitedCircle;
            } else {
              // If hall hasn't been visited, show red
              circleStyle = styles.unvisitedCircle;
            }
  
            // Special case for success scenario with current hall
            if (validationResponse.IsSuccess && hall === currentHall) {
              circleStyle = styles.visitedCircle; // Green for current hall on success
            }
          }
          
          // For animating the current hall
          const isAnimating = animatingHall === hall;
          const animatedColor = animation.interpolate({
            inputRange: [0, 1],
            outputRange: ['#DDDDDD', '#8FCB9B']
          });
          
          return (
            <TouchableOpacity 
              key={hall}
              style={[
                styles.circle,
                !isAnimating && circleStyle,
                selectedCircle === hall && styles.selectedCircle
              ]}
              onPress={() => handleCirclePress(hallKey)}
              disabled={!hallDetails || hallDetails.ScannedBy === null}
            >
              {isAnimating ? (
                <Animated.View 
                  style={[
                    styles.circle, 
                    { backgroundColor: animatedColor, position: 'absolute', width: '100%', height: '100%', borderRadius: 30 }
                  ]}
                />
              ) : null}
              <Text style={styles.circleText}>{hall.replace("H", "")}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // const renderSelectedDetails = () => {
  //   if (!selectedCircle || !validationResponse?.LastScannedDetails) return null;
    
  //   const details = validationResponse.LastScannedDetails[selectedCircle];
    
  //   return (
  //     <View style={styles.detailsContainer}>
  //       <Text style={styles.detailText}>Scanned On: {details.ScannedOn || 'Not scanned'}</Text>
  //       <Text style={styles.detailText}>Scanned By: {details.ScannedBy || 'Not scanned'}</Text>
  //     </View>
  //   );
  // };

  
  
  // Main render function for the upper part (camera or status)
  const renderUpperPart = () => {
    if (isLoading) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>Validating QR Code...</Text>
        </View>
      );
    }
    
    if (scanSuccess) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={200} color="#4CAF50" />
        </View>
      );
    }
    
    if (validationResponse && !validationResponse.IsSuccess) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="close-circle" size={200} color="#FF3B30" />
        </View>
      );
    }
    
    if (isCameraActive) {
      return (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScan}
        />
      );
    }
    
    // Default welcome screen
    return (
      <View style={styles.welcomeContainer}>
        <Ionicons name="qr-code" size={80} color="#FFFFFF" />
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeText}>
          Ready to Scan
        </Text>
      </View>
    );
  };

  // Render the lower part content with details
  const renderLowerPart = () => {
    return (
      <View style={styles.lowerContentWrapper}>
        <View style={{
          alignItems: "center"
        }}>
          <TouchableOpacity 
            style={[
              styles.scanButton,
              (isLoading) && styles.disabledButton,
            ]}
            onPress={activateCamera}
            disabled={isLoading}
          >
            <Text style={styles.scanButtonText}>
              {isCameraActive ? "Cancel Scan" : "Scan Ticket"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ticketInfoContainer}>
          <Text style={styles.lastTicketDetails}>
            {lastTicketNumber}
          </Text>
        </View>
        
        <View style={{
          alignItems: "center"
        }}>
          {renderCircles()}
        </View>
        <View style={styles.lowerDetailsContainer}>
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          {lastVisitedTime && (
            <Text style={styles.visitedTimeText}>
              {`Visited time: ${lastVisitedTime}`}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen
        options={{
          title: "Scanner",
          headerShown: false,
        }}
      />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          {renderUpperPart()}
        </View>
        <View style={styles.contentContainer}>
          {renderLowerPart()}
        </View>
        <Text style={styles.locationText}>
          Location: {userData?.hallNumber === 0 
            ? `${userData?.ticketType}` 
            : `Hall-${userData?.hallNumber}`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    height: height * 0.65,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  contentContainer: {
    height: height * 0.35,
    backgroundColor: '#f0f0f0',
    padding: 20,  
  },
  lowerContentWrapper: {
    flex: 1,
    // alignItems: 'center',
    // alignContent:"flex-end"
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: width * 0.8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    marginTop: 20,
    color: '#FFFFFF',
  },
  ticketInfoContainer: {
    marginTop: 5,
    padding: 10,
    width: width * 0.8,
    borderRadius: 10,
    alignItems: "center",
  },
  lastTicketDetails: {
    color: "black"
  },
  // lowerDetailsContainer: {
  //   // alignItems: 'center',
  //   width: '100%',
  // },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginVertical: 10,
    // alignItems:"center"
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  notVisitedCircle: {
    backgroundColor: '#DDDDDD', // Grey color when no scan is done
    borderColor: '#AAAAAA',
  },
  visitedCircle: {
    backgroundColor: '#8FCB9B', // Green color for visited
    borderColor: '#4CAF50',
  },
  unvisitedCircle: {
    backgroundColor: '#FFCCCB', // Red color for unvisited
    borderColor: '#FF3B30',
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: '#007AFF', // Blue border for selected circle
  },
  circleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    zIndex: 2,
  },
  detailsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  detailText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#555',
  },
  lowerDetailsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  
  errorText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#FF3B30',
  },

  visitedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 28, // This will align with the error message text
  },

  visitedTimeText: {
    fontSize: 16,
    // marginTop: 4,
    // marginLeft: 28, // This matches the space taken by icon (20) + marginLeft of errorText (8)
    color: '#FF3B30',
  },
  // errorContainer: {
  //   flexDirection: 'row',
  //   // alignItems: 'center',
  //   marginTop: 10,
  //   // padding: 10,
  //   // backgroundColor: '#FFF0F0',
  //   // borderRadius: 10,
  //   width: '90%',
  //   // shadowColor: '#000',
  //   // shadowOffset: { width: 0, height: 2 },
  //   // shadowOpacity: 0.1,
  //   // shadowRadius: 3,
  //   // elevation: 2,
  // },
  locationText: {
    position: 'absolute',
    bottom: 20,
    left: 20,  // Changed from 'right' to 'left'
    // backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    borderRadius: 5,
    // color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // errorText: {
  //   fontSize: 16,
  //   marginLeft: 2,
  //   color: '#FF3B30',
  // }
});

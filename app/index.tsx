// index.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useState, useEffect } from "react";
import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import axios from 'axios';

interface UserData {
  deviceId: string;
  hallNumber: number;
  ticketType: string;
}

export default function Home() {
  const [permission, requestPermission] = useCameraPermissions();
  const [copiedText, setCopiedText] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoadingDeviceId, setIsLoadingDeviceId] = useState<boolean>(true);
  const [deviceIdError, setDeviceIdError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  const [userDataError, setUserDataError] = useState<string | null>(null);

  const isPermissionGranted = Boolean(permission?.granted);
  const router = useRouter();
  
  // Fetch device ID on component mount
  useEffect(() => {
    const fetchDeviceId = async (): Promise<void> => {
      setIsLoadingDeviceId(true);
      try {
        const id = await Application.getAndroidId();
        setDeviceId(id);
        console.log(id);
        setDeviceIdError(null);
        // Once we have the device ID, fetch user data
        fetchUserData(id);
      } catch (error) {
        console.error("Failed to fetch device ID:", error);
        setDeviceIdError("Failed to fetch device ID");
      } finally {
        setIsLoadingDeviceId(false);
      }
    };
    
    fetchDeviceId();
  }, []);
  
  // Fetch user data from API using device ID
  const fetchUserData = async (id: string): Promise<void> => {
    if (!id) return;
    
    setIsLoadingUserData(true);
    try {
      // Replace with your actual API endpoint
      // const response= await (await axios.post("http://192.168.8.13/TicketWebAPI/api/scan/device",{
      //   deviceid:id
      // }))?.data;
      // console.log("response got",response);

      // if(response.hallno === -1){
      //   setUserDataError("Device not registed");
      //   return;
      // }
      
      const response:any = {
          "hallno": 2
      }
      setUserData({
        deviceId:id,
        hallNumber:response.hallno,
        ticketType:(response.hallno === 0)?"watershow":"Exhibition"
      });
      setUserDataError(null);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUserDataError("Failed to fetch hall assignment");
      
      // Fallback to default userData if API fails
      // setUserData({
      //   deviceId: id,
      //   hallNumber: 0,
      //   ticketType: "watershow"
      // });
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleScanPress = (): void => {
    if (!userData) {
      Alert.alert("Error", "User data is not available yet. Please wait or try again.");
      return;
    }
    
    // Pass userData object to scanner route
    router.push({
      pathname: './scanner',
      params: { userData: JSON.stringify(userData) }
    });
  };

  // Render the location information
  const renderLocationInfo = (): React.ReactNode => {
    if (isLoadingDeviceId) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Fetching device ID...</Text>
        </View>
      );
    }
    
    if (deviceIdError) {
      return <Text style={styles.errorText}>{deviceIdError}</Text>;
    }
    
    if (isLoadingUserData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Assigning hall location...</Text>
        </View>
      );
    }
    
    if (userDataError) {
      return <Text style={styles.errorText}>{userDataError}</Text>;
    }
    
    if (userData) {
      return <Text style={styles.infoText}>Location: {userData.hallNumber ===0 ? `${userData.ticketType}`:`Hall-${userData.hallNumber}`}</Text>;

      // if (userData.hallNumber === 0) {
      //   return <Text style={styles.infoText}>Ticket Type: {userData.ticketType}</Text>;
      // } else {
      //   return <Text style={styles.infoText}>Location: Hall-{userData.hallNumber}</Text>;
      // }
    }
    
    return <Text style={styles.infoText}>Initializing...</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.upperPart}>
        <Text style={styles.title}>Ticket Scanner</Text>
      </View>

      <View style={styles.lowerPart}>
        <TouchableOpacity 
          style={[
            styles.scanButton,
            (!userData || isLoadingDeviceId || isLoadingUserData) && styles.disabledButton
          ]}
          onPress={handleScanPress}
          disabled={!userData || isLoadingDeviceId || isLoadingUserData}
        >
          <Text style={styles.scanButtonText}>
            Start Scan
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        {renderLocationInfo()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  upperPart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowerPart: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center"
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    width: "50%"
  },
  disabledButton: {
    backgroundColor: '#555555',
    opacity: 0.7
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 40,
  },
  infoContainer: {
    paddingLeft: 10,
    paddingBottom: 5,
    height: 50,
    justifyContent: 'center'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: 10
  },
  errorText: {
    color: '#FF6B6B',
  },
  infoText: {
    color: 'white',
  }
});
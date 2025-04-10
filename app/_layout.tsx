
// _layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack 
      screenOptions={{
        headerShown:false,
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
}

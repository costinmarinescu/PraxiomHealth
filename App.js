import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContextProvider } from './AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  console.log('🚀 Step 3: Testing with DashboardScreen...');
  
  return (
    <ErrorBoundary>
      <AppContextProvider>
        {/* Simple colored background instead of ImageBackground */}
        <View style={styles.background}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </AppContextProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Fallback color instead of image
  },
});

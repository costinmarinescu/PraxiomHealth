import React from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useAppContext } from './AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import Tier1BiomarkerInputScreen from './screens/Tier1BiomarkerInputScreen';
import Tier2BiomarkerInputScreen from './screens/Tier2BiomarkerInputScreen';
import FitnessAssessmentScreen from './screens/FitnessAssessmentScreen';
import ReportScreen from './screens/ReportScreen';
import DNATestScreen from './screens/DNATestScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';
import BiomarkerHistoryScreen from './screens/BiomarkerHistoryScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import ProfileScreen from './screens/ProfileScreen';
import TestScreen from './screens/TestScreen';
import OuraRingScreen from './screens/OuraRingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="BiomarkerInput" component={BiomarkerInputScreen} />
      <Stack.Screen name="Tier1BiomarkerInput" component={Tier1BiomarkerInputScreen} />
      <Stack.Screen name="Tier2BiomarkerInput" component={Tier2BiomarkerInputScreen} />
      <Stack.Screen name="FitnessAssessment" component={FitnessAssessmentScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="DNATest" component={DNATestScreen} />
      <Stack.Screen name="HistoricalData" component={HistoricalDataScreen} />
      <Stack.Screen name="BiomarkerHistory" component={BiomarkerHistoryScreen} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function WatchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WatchHome" component={WatchScreen} />
      <Stack.Screen name="Test" component={TestScreen} />
    </Stack.Navigator>
  );
}

function OuraRingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OuraRingHome" component={OuraRingScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#00CFC1" />
      <Text style={styles.loadingText}>Loading Praxiom Health...</Text>
    </View>
  );
}

// Error screen component
function ErrorScreen({ error }) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Initialization Error</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Text style={styles.errorHint}>Please restart the app</Text>
    </View>
  );
}

// Main navigation component
function AppNavigation() {
  const { isLoading, loadError } = useAppContext();
  
  console.log('📱 AppNavigation render - isLoading:', isLoading, 'loadError:', loadError);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (loadError) {
    return <ErrorScreen error={loadError} />;
  }
  
  return (
    <View style={styles.background}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      <NavigationContainer theme={MyTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Dashboard') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Watch') {
                iconName = focused ? 'watch' : 'watch-outline';
              } else if (route.name === 'OuraRing') {
                iconName = focused ? 'fitness' : 'fitness-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else {
                iconName = 'ellipsis-horizontal';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false,
            tabBarActiveTintColor: '#00CFC1',
            tabBarInactiveTintColor: 'white',
            tabBarStyle: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderTopWidth: 0,
              elevation: 0,
            },
          })}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardStack}
            options={{ tabBarLabel: 'Home' }}
          />
          <Tab.Screen 
            name="Watch" 
            component={WatchStack}
            options={{ tabBarLabel: 'Watch' }}
          />
          <Tab.Screen 
            name="OuraRing" 
            component={OuraRingStack}
            options={{ tabBarLabel: 'Oura' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsStack}
            options={{ tabBarLabel: 'Settings' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  console.log('🚀 Praxiom Health App Starting...');
  
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppNavigation />
      </AppProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 15,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContextProvider } from './AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import Tier1BiomarkerInputScreen from './screens/Tier1BiomarkerInputScreen';
import Tier2BiomarkerInputScreen from './screens/Tier2BiomarkerInputScreen';
import Tier3BiomarkerInputScreen from './screens/Tier3BiomarkerInputScreen';
import FitnessAssessmentScreen from './screens/FitnessAssessmentScreen';
import ReportScreen from './screens/ReportScreen';
import DNATestScreen from './screens/DNATestScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';
import BiomarkerHistoryScreen from './screens/BiomarkerHistoryScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import ProfileScreen from './screens/ProfileScreen';
import TestScreen from './screens/TestScreen';
import OuraRingScreen from './screens/OuraRingScreen';
import GarminWearableScreen from './screens/GarminWearableScreen';
import DebugTestScreen from './screens/DebugTestScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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
      <Stack.Screen name="Tier3BiomarkerInput" component={Tier3BiomarkerInputScreen} />
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

// ✅ FIX: Add OuraRing Stack Navigator
function OuraRingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OuraRingHome" component={OuraRingScreen} />
    </Stack.Navigator>
  );
}

function GarminWearableStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GarminWearableHome" component={GarminWearableScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="DebugTest" component={DebugTestScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigation
function MainTabs() {
  return (
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
          } else if (route.name === 'Garmin') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
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
        name="Garmin" 
        component={GarminWearableStack}
        options={{ tabBarLabel: 'Garmin' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  console.log('🚀 Full Praxiom Health App Starting with HIPAA Compliance...');
  
  return (
    <ErrorBoundary>
      <AppContextProvider>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent" 
          translucent={true} 
        />
        
        <View style={styles.background}>
          <NavigationContainer theme={MyTheme}>
            {/* Root Navigator for Authentication Flow */}
            <RootStack.Navigator 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right'
              }}
              initialRouteName="Auth"
            >
              <RootStack.Screen 
                name="Auth" 
                component={AuthScreen}
                options={{ gestureEnabled: false }}
              />
              <RootStack.Screen 
                name="Main" 
                component={MainTabs}
                options={{ gestureEnabled: false }}
              />
            </RootStack.Navigator>
          </NavigationContainer>
        </View>
      </AppContextProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});

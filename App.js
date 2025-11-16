import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContextProvider } from './AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import Tier1BiomarkerInputScreen from './screens/Tier1BiomarkerInputScreen';
import Tier2BiomarkerInputScreen from './screens/Tier2BiomarkerInputScreen';
import ReportScreen from './screens/ReportScreen';
import DNATestScreen from './screens/DNATestScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';
import BiomarkerHistoryScreen from './screens/BiomarkerHistoryScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import ProfileScreen from './screens/ProfileScreen';
import TestScreen from './screens/TestScreen'; // ✅ ADDED: Test screen for watch communication

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
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="DNATest" component={DNATestScreen} />
      <Stack.Screen name="HistoricalData" component={HistoricalDataScreen} />
      <Stack.Screen name="BiomarkerHistory" component={BiomarkerHistoryScreen} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// ✅ ADDED: Watch Stack with TestScreen
function WatchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WatchHome" component={WatchScreen} />
      <Stack.Screen name="Test" component={TestScreen} />
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppContextProvider>
        <ImageBackground
          source={require('./assets/praxiom_background.png')}
          style={styles.backgroundImage}
          onError={() => console.log('Background image error, using fallback')}
        >
          <NavigationContainer theme={MyTheme}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;
                  if (route.name === 'Dashboard') {
                    iconName = focused ? 'home' : 'home-outline';
                  } else if (route.name === 'Watch') {
                    iconName = focused ? 'watch' : 'watch-outline';
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
              <Tab.Screen name="Dashboard" component={DashboardStack} />
              <Tab.Screen name="Watch" component={WatchStack} />
              <Tab.Screen name="Settings" component={SettingsStack} />
            </Tab.Navigator>
          </NavigationContainer>
        </ImageBackground>
      </AppContextProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
  },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AppContextProvider } from './AppContext';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import Tier1BiomarkerInputScreen from './screens/Tier1BiomarkerInputScreen';
import Tier2BiomarkerInputScreen from './screens/Tier2BiomarkerInputScreen';
import BiomarkerHistoryScreen from './screens/BiomarkerHistoryScreen';
import ReportScreen from './screens/ReportScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';
import DNATestScreen from './screens/DNATestScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dashboard Stack - for internal navigation
function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Tier1BiomarkerInput" component={Tier1BiomarkerInputScreen} />
      <Stack.Screen name="Tier2BiomarkerInput" component={Tier2BiomarkerInputScreen} />
      <Stack.Screen name="BiomarkerHistory" component={BiomarkerHistoryScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} />
    </Stack.Navigator>
  );
}

// Watch Stack
function WatchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WatchMain" component={WatchScreen} />
    </Stack.Navigator>
  );
}

// Settings Stack
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="HistoricalData" component={HistoricalDataScreen} />
      <Stack.Screen name="DNATest" component={DNATestScreen} />
      <Stack.Screen name="BiomarkerInput" component={BiomarkerInputScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <NavigationContainer>
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
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#FF6B00',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardStack}
            options={{
              tabBarLabel: 'Dashboard',
            }}
          />
          <Tab.Screen
            name="Watch"
            component={WatchStack}
            options={{
              tabBarLabel: 'Watch',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStack}
            options={{
              tabBarLabel: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AppContextProvider>
  );
}
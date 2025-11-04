import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import Tier1BiomarkerInputScreen from './screens/Tier1BiomarkerInputScreen';
import Tier2BiomarkerInputScreen from './screens/Tier2BiomarkerInputScreen';
import WatchScreen from './screens/WatchScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack Navigator
function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{ title: 'Praxiom Health' }}
      />
      <Stack.Screen 
        name="Tier1Input" 
        component={Tier1BiomarkerInputScreen}
        options={{ title: 'Tier 1 Biomarkers' }}
      />
      <Stack.Screen 
        name="Tier2Input" 
        component={Tier2BiomarkerInputScreen}
        options={{ title: 'Tier 2 Assessment' }}
      />
      <Stack.Screen 
        name="Historical" 
        component={HistoricalDataScreen}
        options={{ title: 'Historical Data' }}
      />
      <Stack.Screen 
        name="Comparison" 
        component={ComparisonScreen}
        options={{ title: 'Compare Data' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'analytics' : 'analytics-outline';
            } else if (route.name === 'Watch') {
              iconName = focused ? 'watch' : 'watch-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#00d4ff',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#2a2a3e',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardStack} />
        <Tab.Screen name="Watch" component={WatchScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;

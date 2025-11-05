import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import DNATestScreen from './screens/DNATestScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack Navigator (includes input screens)
function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#00CFC1',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BiomarkerInput" 
        component={BiomarkerInputScreen}
        options={{ title: 'Biomarker Input' }}
      />
      <Stack.Screen 
        name="DNATest" 
        component={DNATestScreen}
        options={{ title: 'DNA Methylation Test' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Watch') {
              iconName = focused ? 'watch' : 'watch-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#00CFC1',
          tabBarInactiveTintColor: '#888888',
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: 'rgba(0, 207, 193, 0.2)',
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

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarStyle: { backgroundColor: '#1a1a1a' },
          tabBarActiveTintColor: '#FF6B35',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            title: 'Praxiom Health',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Tab.Screen 
          name="Watch" 
          component={WatchScreen}
          options={{
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

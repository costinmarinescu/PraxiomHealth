import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContextProvider } from './AppContext';
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';

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
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <ImageBackground 
        source={require('./assets/praxiom_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
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
            <Tab.Screen name="Watch" component={WatchScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ImageBackground>
    </AppContextProvider>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

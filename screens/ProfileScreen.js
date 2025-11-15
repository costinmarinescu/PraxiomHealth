/**
 * ProfileScreen.js - FIXED VERSION
 * 
 * Simple, reliable date of birth input using text fields
 * Avoids calendar picker issues entirely
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';

export default function ProfileScreen({ navigation }) {
  const { dispatch } = useContext(AppContext);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // DOB state - using separate fields for year, month, day
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  
  // Load saved profile
  useEffect(() => {
    loadProfile();
  }, []);

  // Calculate age whenever DOB fields change
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      const year = parseInt(birthYear);
      const month = parseInt(birthMonth);
      const day = parseInt(birthDay);

      if (year >= 1920 && year <= new Date().getFullYear() &&
          month >= 1 && month <= 12 &&
          day >= 1 && day <= 31) {
        const age = calculateAgeFromDate(year, month, day);
        setCalculatedAge(age);
      } else {
        setCalculatedAge(null);
      }
    } else {
      setCalculatedAge(null);
    }
  }, [birthYear, birthMonth, birthDay]);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        setName(profile.name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        
        // Load DOB if available
        if (profile.birthYear) {
          setBirthYear(profile.birthYear.toString());
          setBirthMonth(profile.birthMonth.toString());
          setBirthDay(profile.birthDay.toString());
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateAgeFromDate = (year, month, day) => {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateDOB = () => {
    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    const day = parseInt(birthDay);

    const currentYear = new Date().getFullYear();

    if (!birthYear || !birthMonth || !birthDay) {
      Alert.alert('Invalid Date', 'Please enter your complete date of birth');
      return false;
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      Alert.alert('Invalid Date', 'Please enter valid numbers');
      return false;
    }

    if (year < 1920 || year > currentYear) {
      Alert.alert('Invalid Year', `Year must be between 1920 and ${currentYear}`);
      return false;
    }

    if (month < 1 || month > 12) {
      Alert.alert('Invalid Month', 'Month must be between 1 and 12');
      return false;
    }

    if (day < 1 || day > 31) {
      Alert.alert('Invalid Day', 'Day must be between 1 and 31');
      return false;
    }

    // Check if date is valid
    const testDate = new Date(year, month - 1, day);
    if (testDate.getMonth() !== month - 1) {
      Alert.alert('Invalid Date', 'This date does not exist (e.g., Feb 31)');
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateDOB()) {
      return;
    }

    try {
      const age = calculatedAge;
      
      const profile = {
        name,
        email,
        phone,
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        age,
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      
      // Update AppContext with chronological age
      dispatch({
        type: 'UPDATE_HEALTH_DATA',
        payload: {
          chronologicalAge: age,
        },
      });

      console.log('✅ Profile saved');
      console.log('   Name:', name);
      console.log('   DOB:', `${birthYear}-${birthMonth}-${birthDay}`);
      console.log('   Age:', age);

      Alert.alert(
        '✅ Profile Saved',
        `Your profile has been saved.\n\nAge: ${age} years`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Profile</Text>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Date of Birth - SIMPLIFIED VERSION */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <Text style={styles.helpText}>Enter your birth date (numbers only)</Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Year</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="1990"
                value={birthYear}
                onChangeText={setBirthYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Month</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="12"
                value={birthMonth}
                onChangeText={setBirthMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Day</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="25"
                value={birthDay}
                onChangeText={setBirthDay}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          {calculatedAge !== null && (
            <View style={styles.ageDisplay}>
              <Text style={styles.ageText}>
                ✅ Age: {calculatedAge} years
              </Text>
            </View>
          )}

          {birthYear && birthMonth && birthDay && calculatedAge === null && (
            <View style={styles.errorDisplay}>
              <Text style={styles.errorText}>
                ⚠️ Invalid date
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateField: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
  },
  ageDisplay: {
    backgroundColor: '#e6f7f5',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#00CFC1',
  },
  ageText: {
    fontSize: 16,
    color: '#00CFC1',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorDisplay: {
    backgroundColor: '#fee',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});

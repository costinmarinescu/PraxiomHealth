import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(',');
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ? values[index].trim() : '';
    });
    data.push(entry);
  }

  return data;
}

// Parse JSON data
function parseJSON(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

class WearableDataService {
  
  // Import data from file (supports CSV and JSON)
  async importData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', 'text/plain'],
        copyToCacheDirectory: true
      });

      if (result.type === 'cancel') {
        return null;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.uri);
      const fileName = result.name.toLowerCase();
      
      let parsedData;
      
      if (fileName.endsWith('.csv')) {
        parsedData = parseCSV(fileContent);
      } else if (fileName.endsWith('.json')) {
        parsedData = parseJSON(fileContent);
      } else {
        // Try to parse as CSV first, then JSON
        try {
          parsedData = parseCSV(fileContent);
        } catch {
          parsedData = parseJSON(fileContent);
        }
      }

      if (!parsedData) {
        throw new Error('Could not parse file data');
      }

      return this.processWearableData(parsedData, fileName);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Process data from different wearables
  processWearableData(data, fileName) {
    let processedData = {
      source: 'Unknown',
      heartRate: [],
      steps: [],
      sleep: [],
      calories: [],
      rawData: data
    };

    // Detect source from filename
    if (fileName.includes('garmin')) {
      processedData.source = 'Garmin';
      processedData = this.processGarminData(data, processedData);
    } else if (fileName.includes('fitbit')) {
      processedData.source = 'Fitbit';
      processedData = this.processFitbitData(data, processedData);
    } else if (fileName.includes('apple') || fileName.includes('health')) {
      processedData.source = 'Apple Health';
      processedData = this.processAppleHealthData(data, processedData);
    } else {
      // Generic processing
      processedData = this.processGenericData(data, processedData);
    }

    return processedData;
  }

  // Process Garmin data
  processGarminData(data, processedData) {
    if (Array.isArray(data)) {
      data.forEach(entry => {
        if (entry.heartRate || entry['Heart Rate']) {
          processedData.heartRate.push({
            timestamp: entry.timestamp || entry.date,
            value: parseInt(entry.heartRate || entry['Heart Rate'])
          });
        }
        if (entry.steps || entry.Steps) {
          processedData.steps.push({
            timestamp: entry.timestamp || entry.date,
            value: parseInt(entry.steps || entry.Steps)
          });
        }
      });
    }
    return processedData;
  }

  // Process Fitbit data
  processFitbitData(data, processedData) {
    if (Array.isArray(data)) {
      data.forEach(entry => {
        if (entry['Heart Rate'] || entry.heart_rate) {
          processedData.heartRate.push({
            timestamp: entry.Time || entry.timestamp,
            value: parseInt(entry['Heart Rate'] || entry.heart_rate)
          });
        }
        if (entry.Steps || entry.steps) {
          processedData.steps.push({
            timestamp: entry.Time || entry.timestamp,
            value: parseInt(entry.Steps || entry.steps)
          });
        }
      });
    }
    return processedData;
  }

  // Process Apple Health data
  processAppleHealthData(data, processedData) {
    // Apple Health exports are usually complex XML, but if converted to JSON
    if (Array.isArray(data)) {
      data.forEach(entry => {
        const type = entry.type || entry['@type'];
        
        if (type && type.includes('HeartRate')) {
          processedData.heartRate.push({
            timestamp: entry.startDate,
            value: parseFloat(entry.value)
          });
        }
        if (type && type.includes('StepCount')) {
          processedData.steps.push({
            timestamp: entry.startDate,
            value: parseFloat(entry.value)
          });
        }
      });
    }
    return processedData;
  }

  // Generic data processing
  processGenericData(data, processedData) {
    if (!Array.isArray(data)) return processedData;

    data.forEach(entry => {
      // Try to find heart rate data
      const hrKeys = ['heartRate', 'heart_rate', 'hr', 'bpm', 'pulse'];
      for (const key of hrKeys) {
        if (entry[key]) {
          processedData.heartRate.push({
            timestamp: entry.timestamp || entry.date || entry.time,
            value: parseInt(entry[key])
          });
          break;
        }
      }

      // Try to find steps data
      const stepKeys = ['steps', 'step_count', 'stepCount'];
      for (const key of stepKeys) {
        if (entry[key]) {
          processedData.steps.push({
            timestamp: entry.timestamp || entry.date || entry.time,
            value: parseInt(entry[key])
          });
          break;
        }
      }

      // Try to find sleep data
      const sleepKeys = ['sleep', 'sleep_duration', 'sleepDuration'];
      for (const key of sleepKeys) {
        if (entry[key]) {
          processedData.sleep.push({
            timestamp: entry.timestamp || entry.date || entry.time,
            value: parseInt(entry[key])
          });
          break;
        }
      }
    });

    return processedData;
  }

  // Calculate health metrics from imported data
  calculateHealthMetrics(importedData) {
    const metrics = {
      avgHeartRate: 0,
      totalSteps: 0,
      avgSleep: 0,
      fitnessScore: 0
    };

    // Calculate average heart rate
    if (importedData.heartRate.length > 0) {
      const sum = importedData.heartRate.reduce((acc, item) => acc + item.value, 0);
      metrics.avgHeartRate = Math.round(sum / importedData.heartRate.length);
    }

    // Calculate total steps
    if (importedData.steps.length > 0) {
      metrics.totalSteps = importedData.steps.reduce((acc, item) => acc + item.value, 0);
    }

    // Calculate average sleep
    if (importedData.sleep.length > 0) {
      const sum = importedData.sleep.reduce((acc, item) => acc + item.value, 0);
      metrics.avgSleep = Math.round(sum / importedData.sleep.length);
    }

    // Calculate fitness score (simple algorithm)
    let fitnessScore = 0;
    
    // Heart rate component (30 points) - optimal resting HR: 60-70 bpm
    if (metrics.avgHeartRate > 0) {
      if (metrics.avgHeartRate >= 60 && metrics.avgHeartRate <= 70) {
        fitnessScore += 30;
      } else if (metrics.avgHeartRate >= 50 && metrics.avgHeartRate < 60) {
        fitnessScore += 25;
      } else if (metrics.avgHeartRate > 70 && metrics.avgHeartRate <= 80) {
        fitnessScore += 20;
      } else {
        fitnessScore += 10;
      }
    }

    // Steps component (40 points) - target: 10,000+ steps/day
    const avgDailySteps = metrics.totalSteps / (importedData.steps.length || 1);
    if (avgDailySteps >= 10000) {
      fitnessScore += 40;
    } else if (avgDailySteps >= 7500) {
      fitnessScore += 30;
    } else if (avgDailySteps >= 5000) {
      fitnessScore += 20;
    } else {
      fitnessScore += 10;
    }

    // Sleep component (30 points) - target: 7-9 hours
    if (metrics.avgSleep >= 420 && metrics.avgSleep <= 540) { // 7-9 hours in minutes
      fitnessScore += 30;
    } else if (metrics.avgSleep >= 360 && metrics.avgSleep < 420) {
      fitnessScore += 20;
    } else {
      fitnessScore += 10;
    }

    metrics.fitnessScore = Math.min(100, fitnessScore);

    return metrics;
  }
}

export default new WearableDataService();

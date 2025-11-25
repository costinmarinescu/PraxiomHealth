/**
 * NotificationService.js - Android System Notifications for Praxiom Health
 * 
 * Features:
 * - Android system notifications
 * - Phone call/SMS notifications forwarding to watch
 * - App notification relay (like Gadgetbridge)
 * - Configurable notification channels
 * - Bio-Age alerts and reminders
 */

// Temporary: Push notifications disabled to fix build
const Notifications = {
  setNotificationHandler: () => {},
  scheduleNotificationAsync: async (content) => ({ id: 'local-' + Date.now() }),
  cancelScheduledNotificationAsync: async () => {},
  getAllScheduledNotificationsAsync: async () => [],
  cancelAllScheduledNotificationsAsync: async () => {},
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
};
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import WearableService from './WearableService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  /**
   * Initialize notification system
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Check if physical device
      if (!Device.isDevice) {
        console.log('⚠️ Notifications require physical device');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in Settings to receive health alerts and sync notifications with your watch.'
        );
        return false;
      }

      // Configure notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      // Setup listeners
      this.setupListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  async setupNotificationChannels() {
    try {
      // Bio-Age Alerts Channel
      await Notifications.setNotificationChannelAsync('bioage-alerts', {
        name: 'Bio-Age Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        description: 'Important alerts about biological age changes and health metrics',
      });

      // Health Reminders Channel
      await Notifications.setNotificationChannelAsync('health-reminders', {
        name: 'Health Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#00CFC1',
        description: 'Reminders for biomarker assessments and health activities',
      });

      // Watch Sync Channel
      await Notifications.setNotificationChannelAsync('watch-sync', {
        name: 'Watch Sync',
        importance: Notifications.AndroidImportance.LOW,
        description: 'Status updates for PineTime watch synchronization',
      });

      // Phone Notifications (for relay to watch)
      await Notifications.setNotificationChannelAsync('phone-relay', {
        name: 'Phone Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00CFC1',
        sound: 'default',
        description: 'Phone calls, SMS, and app notifications relayed to watch',
      });

      console.log('✅ Notification channels configured');
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  setupListeners() {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received (forward to watch if enabled)
   */
  async handleNotificationReceived(notification) {
    try {
      const { title, body, data } = notification.request.content;
      
      // Forward to PineTime watch via BLE
      if (WearableService && data?.forwardToWatch !== false) {
        await this.forwardToWatch({
          title: title || 'Notification',
          body: body || '',
          category: data?.category || 'generic',
        });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  /**
   * Handle notification tap response
   */
  handleNotificationResponse(response) {
    const { notification } = response;
    const data = notification.request.content.data;
    
    // Navigate based on notification data
    if (data?.screen) {
      console.log('Navigate to:', data.screen);
      // Navigation logic here (requires navigation ref)
    }
  }

  /**
   * Forward notification to PineTime watch
   */
  async forwardToWatch(notification) {
    try {
      // Check if watch is connected
      if (!WearableService.isConnected) {
        return false;
      }

      // Send notification data via BLE
      const message = {
        type: 'notification',
        title: notification.title,
        body: notification.body,
        category: notification.category,
        timestamp: Date.now(),
      };

      await WearableService.sendNotification(message);
      console.log('📤 Notification forwarded to watch');
      return true;
    } catch (error) {
      console.error('Error forwarding to watch:', error);
      return false;
    }
  }

  // ==================== BIO-AGE NOTIFICATIONS ====================

  /**
   * Send bio-age alert
   */
  async sendBioAgeAlert(bioAge, chronologicalAge, deviation) {
    try {
      let title, body, color;

      if (deviation > 5) {
        title = '⚠️ Bio-Age Alert';
        body = `Your biological age (${bioAge.toFixed(1)}) is ${Math.abs(deviation).toFixed(1)} years older than your chronological age. Consider upgrading to Tier 2 for personalized interventions.`;
        color = '#FF6B35';
      } else if (deviation < -3) {
        title = '🎉 Great Progress!';
        body = `Your biological age (${bioAge.toFixed(1)}) is ${Math.abs(deviation).toFixed(1)} years younger than your chronological age. Keep up the healthy lifestyle!`;
        color = '#47C83E';
      } else {
        return; // No alert for neutral deviations
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            screen: 'Dashboard',
            bioAge,
            deviation,
            forwardToWatch: true,
          },
          color,
          sound: 'default',
        },
        trigger: null, // Immediate
      });

      console.log('✅ Bio-Age alert sent');
    } catch (error) {
      console.error('Error sending bio-age alert:', error);
    }
  }

  /**
   * Send score threshold warning
   */
  async sendScoreWarning(scoreName, scoreValue) {
    try {
      if (scoreValue >= 75) return; // Only warn for low scores

      const title = '⚠️ Low Health Score';
      const body = `Your ${scoreName} is ${scoreValue}% (below 75%). Consider taking action to improve your health metrics.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            screen: 'Dashboard',
            score: scoreName,
            value: scoreValue,
            forwardToWatch: true,
          },
          color: '#FFB800',
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending score warning:', error);
    }
  }

  /**
   * Schedule reminder for biomarker assessment
   */
  async scheduleAssessmentReminder(days = 30) {
    try {
      const trigger = {
        seconds: days * 24 * 60 * 60, // Convert days to seconds
        repeats: false,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Time for Bio-Age Assessment',
          body: 'It\'s been 30 days since your last biomarker assessment. Schedule your next evaluation to track your progress.',
          data: { 
            screen: 'Tier1BiomarkerInput',
            forwardToWatch: false,
          },
          color: '#00CFC1',
        },
        trigger,
      });

      console.log(`✅ Assessment reminder scheduled for ${days} days`);
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  }

  // ==================== WATCH SYNC NOTIFICATIONS ====================

  /**
   * Notify watch connected
   */
  async notifyWatchConnected(deviceName) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⌚ Watch Connected',
          body: `${deviceName} is now syncing with Praxiom Health`,
          data: { forwardToWatch: false },
          categoryIdentifier: 'watch-sync',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending watch notification:', error);
    }
  }

  /**
   * Notify bio-age synced to watch
   */
  async notifyBioAgeSynced(bioAge) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Bio-Age Synced',
          body: `Your biological age (${bioAge.toFixed(1)} years) has been updated on your watch`,
          data: { forwardToWatch: false },
          categoryIdentifier: 'watch-sync',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending sync notification:', error);
    }
  }

  // ==================== PHONE NOTIFICATION RELAY ====================

  /**
   * Relay incoming phone call to watch
   */
  async relayPhoneCall(callerName, callerNumber) {
    try {
      const message = {
        type: 'call',
        caller: callerName || callerNumber || 'Unknown',
        timestamp: Date.now(),
      };

      await this.forwardToWatch(message);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📞 Incoming Call',
          body: `${message.caller}`,
          data: { 
            type: 'call',
            forwardToWatch: true,
          },
          categoryIdentifier: 'phone-relay',
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error relaying phone call:', error);
    }
  }

  /**
   * Relay SMS to watch
   */
  async relaySMS(sender, message) {
    try {
      const notification = {
        type: 'sms',
        title: sender || 'New Message',
        body: message,
        timestamp: Date.now(),
      };

      await this.forwardToWatch(notification);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💬 New Message',
          body: `${sender}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          data: { 
            type: 'sms',
            forwardToWatch: true,
          },
          categoryIdentifier: 'phone-relay',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error relaying SMS:', error);
    }
  }

  /**
   * Relay app notification to watch
   */
  async relayAppNotification(appName, title, body) {
    try {
      const notification = {
        type: 'app',
        app: appName,
        title,
        body,
        timestamp: Date.now(),
      };

      await this.forwardToWatch(notification);
    } catch (error) {
      console.error('Error relaying app notification:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Cleanup on service destruction
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new NotificationService();

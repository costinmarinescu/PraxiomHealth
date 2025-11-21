import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import CryptoJS from 'crypto-js';

/**
 * Garmin API Configuration
 * Get your credentials from: https://developer.garmin.com/
 */
const GARMIN_CONFIG = {
  // These will be set by the user in the UI
  consumerKey: null,
  consumerSecret: null,
  
  // API Endpoints
  requestTokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
  authorizeUrl: 'https://connect.garmin.com/oauthConfirm',
  accessTokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  
  // Health API endpoints
  dailySummaryUrl: 'https://apis.garmin.com/wellness-api/rest/dailies',
  heartRateUrl: 'https://apis.garmin.com/wellness-api/rest/heartRates',
  stressUrl: 'https://apis.garmin.com/wellness-api/rest/epochs',
  
  // Callback URL - must match your app's deep link scheme
  callbackUrl: 'praxiom://garmin/callback'
};

class GarminService {
  constructor() {
    this.accessToken = null;
    this.accessTokenSecret = null;
    this.userId = null;
  }

  /**
   * Initialize service with consumer credentials
   */
  initialize(consumerKey, consumerSecret) {
    GARMIN_CONFIG.consumerKey = consumerKey;
    GARMIN_CONFIG.consumerSecret = consumerSecret;
  }

  /**
   * Generate OAuth signature
   * Implements OAuth 1.0a signature generation
   */
  generateSignature(method, url, params, tokenSecret = '') {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams)
    ].join('&');

    // Create signing key
    const signingKey = `${encodeURIComponent(GARMIN_CONFIG.consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    // Generate HMAC-SHA1 signature
    const signature = CryptoJS.HmacSHA1(signatureBaseString, signingKey);
    return CryptoJS.enc.Base64.stringify(signature);
  }

  /**
   * Generate OAuth parameters
   */
  generateOAuthParams(additionalParams = {}) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    return {
      oauth_consumer_key: GARMIN_CONFIG.consumerKey,
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: '1.0',
      oauth_callback: GARMIN_CONFIG.callbackUrl,
      ...additionalParams
    };
  }

  /**
   * Step 1: Get Request Token
   */
  async getRequestToken() {
    try {
      const params = this.generateOAuthParams();
      params.oauth_signature = this.generateSignature(
        'POST',
        GARMIN_CONFIG.requestTokenUrl,
        params
      );

      // Build authorization header
      const authHeader = 'OAuth ' + Object.keys(params)
        .map(key => `${key}="${encodeURIComponent(params[key])}"`)
        .join(', ');

      const response = await fetch(GARMIN_CONFIG.requestTokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to get request token: ${responseText}`);
      }

      // Parse response (format: oauth_token=xxx&oauth_token_secret=yyy)
      const params_response = new URLSearchParams(responseText);
      const requestToken = params_response.get('oauth_token');
      const requestTokenSecret = params_response.get('oauth_token_secret');

      if (!requestToken || !requestTokenSecret) {
        throw new Error('Invalid request token response');
      }

      return { requestToken, requestTokenSecret };
    } catch (error) {
      console.error('Error getting request token:', error);
      throw error;
    }
  }

  /**
   * Step 2: Authorize User (opens browser)
   */
  async authorizeUser(requestToken) {
    try {
      const authUrl = `${GARMIN_CONFIG.authorizeUrl}?oauth_token=${requestToken}`;
      
      // Open browser for user authorization
      const canOpen = await Linking.canOpenURL(authUrl);
      if (canOpen) {
        await Linking.openURL(authUrl);
        return true;
      } else {
        throw new Error('Cannot open authorization URL');
      }
    } catch (error) {
      console.error('Error authorizing user:', error);
      throw error;
    }
  }

  /**
   * Step 3: Exchange verifier for Access Token
   */
  async getAccessToken(requestToken, requestTokenSecret, verifier) {
    try {
      const params = this.generateOAuthParams({
        oauth_token: requestToken,
        oauth_verifier: verifier
      });

      // Remove callback from params for access token request
      delete params.oauth_callback;

      params.oauth_signature = this.generateSignature(
        'POST',
        GARMIN_CONFIG.accessTokenUrl,
        params,
        requestTokenSecret
      );

      const authHeader = 'OAuth ' + Object.keys(params)
        .map(key => `${key}="${encodeURIComponent(params[key])}"`)
        .join(', ');

      const response = await fetch(GARMIN_CONFIG.accessTokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to get access token: ${responseText}`);
      }

      const params_response = new URLSearchParams(responseText);
      const accessToken = params_response.get('oauth_token');
      const accessTokenSecret = params_response.get('oauth_token_secret');
      const userId = params_response.get('user_id');

      if (!accessToken || !accessTokenSecret) {
        throw new Error('Invalid access token response');
      }

      // Store tokens
      this.accessToken = accessToken;
      this.accessTokenSecret = accessTokenSecret;
      this.userId = userId;

      // Save to persistent storage
      await AsyncStorage.setItem('garmin_access_token', accessToken);
      await AsyncStorage.setItem('garmin_access_token_secret', accessTokenSecret);
      await AsyncStorage.setItem('garmin_user_id', userId || '');

      return { accessToken, accessTokenSecret, userId };
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Complete OAuth flow
   * Returns: { success: true/false, error?: string }
   */
  async authenticate() {
    try {
      // Check if we already have valid tokens
      const existingToken = await AsyncStorage.getItem('garmin_access_token');
      const existingSecret = await AsyncStorage.getItem('garmin_access_token_secret');
      
      if (existingToken && existingSecret) {
        this.accessToken = existingToken;
        this.accessTokenSecret = existingSecret;
        this.userId = await AsyncStorage.getItem('garmin_user_id');
        return { success: true };
      }

      // Step 1: Get Request Token
      const { requestToken, requestTokenSecret } = await this.getRequestToken();

      // Step 2: Open browser for user authorization
      await this.authorizeUser(requestToken);

      // Step 3 happens after user returns from browser with verifier
      // This is handled by handleAuthCallback()

      // Store request token secret temporarily for step 3
      await AsyncStorage.setItem('garmin_request_token_secret', requestTokenSecret);
      await AsyncStorage.setItem('garmin_request_token', requestToken);

      return { success: true, needsVerifier: true };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle OAuth callback after user authorization
   * Should be called when app receives deep link with verifier
   */
  async handleAuthCallback(url) {
    try {
      // Parse callback URL: praxiom://garmin/callback?oauth_token=xxx&oauth_verifier=yyy
      const params = new URLSearchParams(url.split('?')[1]);
      const requestToken = params.get('oauth_token');
      const verifier = params.get('oauth_verifier');

      if (!requestToken || !verifier) {
        throw new Error('Missing oauth_token or oauth_verifier in callback');
      }

      // Retrieve stored request token secret
      const requestTokenSecret = await AsyncStorage.getItem('garmin_request_token_secret');
      if (!requestTokenSecret) {
        throw new Error('Request token secret not found');
      }

      // Exchange for access token
      await this.getAccessToken(requestToken, requestTokenSecret, verifier);

      // Clean up temporary storage
      await AsyncStorage.removeItem('garmin_request_token');
      await AsyncStorage.removeItem('garmin_request_token_secret');

      return { success: true };
    } catch (error) {
      console.error('Error handling auth callback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.accessToken && this.accessTokenSecret);
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(method, url, body = null) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please connect your Garmin account first.');
    }

    try {
      const params = this.generateOAuthParams({
        oauth_token: this.accessToken
      });
      
      delete params.oauth_callback;

      params.oauth_signature = this.generateSignature(
        method,
        url,
        params,
        this.accessTokenSecret
      );

      const authHeader = 'OAuth ' + Object.keys(params)
        .map(key => `${key}="${encodeURIComponent(params[key])}"`)
        .join(', ');

      const options = {
        method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Fetch health data from Garmin
   */
  async getHealthData() {
    try {
      const uploadDate = this.getTodayDate();
      
      // Fetch daily summary (steps, VO2 max, body battery)
      const dailySummaryUrl = `${GARMIN_CONFIG.dailySummaryUrl}?uploadStartTimeInSeconds=${Math.floor(Date.now() / 1000) - 86400}&uploadEndTimeInSeconds=${Math.floor(Date.now() / 1000)}`;
      const dailySummary = await this.makeAuthenticatedRequest('GET', dailySummaryUrl);

      // Fetch heart rate data
      const heartRateUrl = `${GARMIN_CONFIG.heartRateUrl}?uploadStartTimeInSeconds=${Math.floor(Date.now() / 1000) - 86400}&uploadEndTimeInSeconds=${Math.floor(Date.now() / 1000)}`;
      const heartRateData = await this.makeAuthenticatedRequest('GET', heartRateUrl);

      // Fetch stress data
      const stressUrl = `${GARMIN_CONFIG.stressUrl}?uploadStartTimeInSeconds=${Math.floor(Date.now() / 1000) - 86400}&uploadEndTimeInSeconds=${Math.floor(Date.now() / 1000)}`;
      const stressData = await this.makeAuthenticatedRequest('GET', stressUrl);

      // Process and combine data
      const latestData = {
        heartRate: this.extractLatestHeartRate(heartRateData),
        hrv: this.extractHRV(heartRateData),
        steps: dailySummary?.[0]?.totalSteps || 0,
        vo2Max: dailySummary?.[0]?.vo2Max || null,
        stressLevel: this.extractStressLevel(stressData),
        bodyBattery: dailySummary?.[0]?.bodyBatteryMostRecentValue || null,
        respirationRate: dailySummary?.[0]?.avgRespirationRate || null,
        lastSync: new Date().toISOString()
      };

      return latestData;
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  }

  /**
   * Extract latest heart rate from data
   */
  extractLatestHeartRate(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const latestEntry = data[data.length - 1];
    return latestEntry?.heartRateValues?.[0]?.heartRate || 
           latestEntry?.restingHeartRate ||
           null;
  }

  /**
   * Extract HRV from heart rate data
   */
  extractHRV(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    // HRV is typically in the heart rate variability field
    const latestEntry = data[data.length - 1];
    return latestEntry?.heartRateVariabilityValues?.[0]?.hrv ||
           latestEntry?.hrvValue ||
           null;
  }

  /**
   * Extract stress level
   */
  extractStressLevel(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const latestEntry = data[data.length - 1];
    return latestEntry?.stressValueDescriptor ||
           latestEntry?.overallStressLevel ||
           null;
  }

  /**
   * Disconnect and clear tokens
   */
  async disconnect() {
    try {
      this.accessToken = null;
      this.accessTokenSecret = null;
      this.userId = null;

      await AsyncStorage.removeItem('garmin_access_token');
      await AsyncStorage.removeItem('garmin_access_token_secret');
      await AsyncStorage.removeItem('garmin_user_id');

      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isAuthenticated(),
      userId: this.userId,
      hasCredentials: !!(GARMIN_CONFIG.consumerKey && GARMIN_CONFIG.consumerSecret)
    };
  }
}

export default new GarminService();

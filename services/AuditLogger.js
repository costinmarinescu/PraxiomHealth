/**
 * AuditLogger.js - HIPAA-Compliant Audit Logging Service
 * 
 * Tracks all security-relevant events for HIPAA compliance:
 * - Authentication attempts (success/failure)
 * - Data access events
 * - Data modifications
 * - System errors
 * - Session management
 * 
 * Audit logs are encrypted and tamper-evident
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import EncryptionService from './EncryptionService';

class AuditLogger {
  constructor() {
    this.logQueue = [];
    this.isInitialized = false;
    this.deviceId = null;
  }

  /**
   * Initialize the audit logger
   */
  async initialize() {
    try {
      // Get or generate device ID
      let deviceId = await SecureStore.getItemAsync('device_audit_id');
      if (!deviceId) {
        deviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Device.modelName}-${Device.osVersion}-${Date.now()}`
        );
        await SecureStore.setItemAsync('device_audit_id', deviceId);
      }
      this.deviceId = deviceId;
      
      // Load existing audit logs
      await this.loadLogs();
      
      this.isInitialized = true;
      console.log('✅ Audit logger initialized');
      
      // Process any queued logs
      await this.processQueue();
    } catch (error) {
      console.error('❌ Audit logger initialization failed:', error);
      // Don't throw - audit logging should not break the app
    }
  }

  /**
   * Log an audit event
   * 
   * @param {string} eventType - Type of event (e.g., AUTH_SUCCESS, DATA_ACCESS, etc.)
   * @param {object} details - Event details
   */
  async log(eventType, details = {}) {
    try {
      const logEntry = {
        id: await this.generateLogId(),
        timestamp: new Date().toISOString(),
        unixTime: Date.now(),
        eventType,
        deviceId: this.deviceId,
        deviceInfo: {
          model: Device.modelName,
          os: Device.osName,
          osVersion: Device.osVersion,
          appVersion: '1.0.0' // Should come from app.json
        },
        details,
        hash: null // Will be set after hashing
      };

      // Generate hash for tamper detection
      logEntry.hash = await this.generateLogHash(logEntry);

      // Queue or process immediately
      if (!this.isInitialized) {
        this.logQueue.push(logEntry);
      } else {
        await this.saveLog(logEntry);
      }

      // For critical events, also send to remote server (if configured)
      if (this.isCriticalEvent(eventType)) {
        await this.sendToRemoteAudit(logEntry);
      }

      return logEntry.id;
    } catch (error) {
      console.error('Audit logging error:', error);
      // Audit logging errors should not break the app
      return null;
    }
  }

  /**
   * Generate unique log ID
   */
  async generateLogId() {
    const random = await Crypto.getRandomBytesAsync(8);
    const hex = Array.from(random)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `LOG-${Date.now()}-${hex}`;
  }

  /**
   * Generate hash for log entry (for tamper detection)
   */
  async generateLogHash(logEntry) {
    const dataToHash = JSON.stringify({
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      eventType: logEntry.eventType,
      deviceId: logEntry.deviceId,
      details: logEntry.details
    });
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataToHash
    );
  }

  /**
   * Verify log integrity
   */
  async verifyLogIntegrity(logEntry) {
    const originalHash = logEntry.hash;
    const currentHash = await this.generateLogHash(logEntry);
    return originalHash === currentHash;
  }

  /**
   * Save log entry to secure storage
   */
  async saveLog(logEntry) {
    try {
      // Get existing logs
      const logs = await this.loadLogs();
      
      // Add new log
      logs.push(logEntry);
      
      // Limit log size (keep last 10,000 entries)
      if (logs.length > 10000) {
        // Archive old logs before removing
        await this.archiveLogs(logs.slice(0, logs.length - 10000));
        logs.splice(0, logs.length - 10000);
      }
      
      // Encrypt and save
      const encrypted = await EncryptionService.encryptObject(logs);
      await SecureStore.setItemAsync('audit_logs', encrypted);
      
      // Update index for quick queries
      await this.updateLogIndex(logEntry);
    } catch (error) {
      console.error('Failed to save audit log:', error);
      // Try to save to emergency backup
      await this.saveEmergencyLog(logEntry);
    }
  }

  /**
   * Load audit logs from storage
   */
  async loadLogs() {
    try {
      const encrypted = await SecureStore.getItemAsync('audit_logs');
      if (encrypted) {
        const logs = await EncryptionService.decryptObject(encrypted);
        return logs || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  }

  /**
   * Update log index for quick queries
   */
  async updateLogIndex(logEntry) {
    try {
      const indexKey = `audit_index_${logEntry.eventType}`;
      let index = await AsyncStorage.getItem(indexKey);
      index = index ? JSON.parse(index) : [];
      
      index.push({
        id: logEntry.id,
        timestamp: logEntry.timestamp,
        summary: this.generateEventSummary(logEntry)
      });
      
      // Keep index size manageable
      if (index.length > 1000) {
        index = index.slice(-1000);
      }
      
      await AsyncStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update log index:', error);
    }
  }

  /**
   * Generate event summary for index
   */
  generateEventSummary(logEntry) {
    switch (logEntry.eventType) {
      case 'AUTH_SUCCESS':
        return `Successful login via ${logEntry.details.method}`;
      case 'AUTH_FAILED':
        return `Failed login attempt via ${logEntry.details.method}`;
      case 'DATA_ACCESS':
        return `Accessed ${logEntry.details.dataType}`;
      case 'DATA_MODIFIED':
        return `Modified ${logEntry.details.dataType}`;
      case 'SESSION_EXPIRED':
        return `Session expired after ${logEntry.details.timeSinceAuth}ms`;
      case 'LOGOUT':
        return `Logout (${logEntry.details.reason})`;
      default:
        return logEntry.eventType;
    }
  }

  /**
   * Process queued logs
   */
  async processQueue() {
    if (this.logQueue.length === 0) return;
    
    console.log(`Processing ${this.logQueue.length} queued audit logs...`);
    
    for (const logEntry of this.logQueue) {
      await this.saveLog(logEntry);
    }
    
    this.logQueue = [];
  }

  /**
   * Check if event is critical
   */
  isCriticalEvent(eventType) {
    const criticalEvents = [
      'AUTH_FAILED',
      'DATA_BREACH_SUSPECTED',
      'ENCRYPTION_ERROR',
      'MULTIPLE_FAILED_LOGINS',
      'UNAUTHORIZED_ACCESS',
      'DATA_EXPORT',
      'ACCOUNT_LOCKED'
    ];
    
    return criticalEvents.includes(eventType);
  }

  /**
   * Send critical events to remote audit server
   */
  async sendToRemoteAudit(logEntry) {
    // In production, implement secure transmission to HIPAA-compliant audit server
    // This is a placeholder for the remote audit capability
    
    try {
      // Example: Send to your secure audit endpoint
      /*
      const response = await fetch('https://your-audit-server.com/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.deviceId,
          'X-Timestamp': logEntry.timestamp
        },
        body: JSON.stringify({
          log: logEntry,
          signature: await this.signLog(logEntry)
        })
      });
      */
      
      console.log('📡 Critical event logged:', logEntry.eventType);
    } catch (error) {
      console.error('Failed to send to remote audit:', error);
      // Store for later transmission
      await this.queueForRemote(logEntry);
    }
  }

  /**
   * Queue logs for remote transmission when connection is restored
   */
  async queueForRemote(logEntry) {
    try {
      let queue = await AsyncStorage.getItem('remote_audit_queue');
      queue = queue ? JSON.parse(queue) : [];
      queue.push(logEntry);
      await AsyncStorage.setItem('remote_audit_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue for remote:', error);
    }
  }

  /**
   * Archive old logs
   */
  async archiveLogs(logsToArchive) {
    try {
      const archiveKey = `audit_archive_${Date.now()}`;
      const encrypted = await EncryptionService.encryptObject(logsToArchive);
      await SecureStore.setItemAsync(archiveKey, encrypted);
      
      // Track archive in index
      let archiveIndex = await AsyncStorage.getItem('audit_archives');
      archiveIndex = archiveIndex ? JSON.parse(archiveIndex) : [];
      archiveIndex.push({
        key: archiveKey,
        timestamp: new Date().toISOString(),
        count: logsToArchive.length,
        startDate: logsToArchive[0].timestamp,
        endDate: logsToArchive[logsToArchive.length - 1].timestamp
      });
      await AsyncStorage.setItem('audit_archives', JSON.stringify(archiveIndex));
    } catch (error) {
      console.error('Failed to archive logs:', error);
    }
  }

  /**
   * Save emergency log (when primary storage fails)
   */
  async saveEmergencyLog(logEntry) {
    try {
      const emergencyKey = `emergency_log_${Date.now()}`;
      await AsyncStorage.setItem(emergencyKey, JSON.stringify(logEntry));
      console.warn('⚠️ Saved emergency audit log:', emergencyKey);
    } catch (error) {
      console.error('❌ Emergency log save failed:', error);
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters = {}) {
    try {
      const logs = await this.loadLogs();
      
      let filtered = logs;
      
      // Apply filters
      if (filters.eventType) {
        filtered = filtered.filter(log => log.eventType === filters.eventType);
      }
      
      if (filters.startDate) {
        const startTime = new Date(filters.startDate).getTime();
        filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= startTime);
      }
      
      if (filters.endDate) {
        const endTime = new Date(filters.endDate).getTime();
        filtered = filtered.filter(log => new Date(log.timestamp).getTime() <= endTime);
      }
      
      if (filters.deviceId) {
        filtered = filtered.filter(log => log.deviceId === filters.deviceId);
      }
      
      // Verify integrity
      const results = [];
      for (const log of filtered) {
        const isValid = await this.verifyLogIntegrity(log);
        results.push({
          ...log,
          integrityValid: isValid
        });
      }
      
      return results;
    } catch (error) {
      console.error('Failed to query logs:', error);
      return [];
    }
  }

  /**
   * Generate audit report
   */
  async generateReport(startDate, endDate) {
    try {
      const logs = await this.queryLogs({ startDate, endDate });
      
      const report = {
        generatedAt: new Date().toISOString(),
        deviceId: this.deviceId,
        period: { startDate, endDate },
        totalEvents: logs.length,
        eventSummary: {},
        suspiciousActivity: [],
        integrityIssues: []
      };
      
      // Analyze logs
      for (const log of logs) {
        // Count event types
        report.eventSummary[log.eventType] = (report.eventSummary[log.eventType] || 0) + 1;
        
        // Check for suspicious activity
        if (log.eventType === 'AUTH_FAILED' && log.details.attempts > 3) {
          report.suspiciousActivity.push(log);
        }
        
        // Check integrity
        if (!log.integrityValid) {
          report.integrityIssues.push(log.id);
        }
      }
      
      // Encrypt report
      const encryptedReport = await EncryptionService.encryptObject(report);
      
      return {
        encrypted: encryptedReport,
        summary: {
          totalEvents: report.totalEvents,
          eventTypes: Object.keys(report.eventSummary).length,
          suspiciousEvents: report.suspiciousActivity.length,
          integrityIssues: report.integrityIssues.length
        }
      };
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw error;
    }
  }

  /**
   * Clear old logs (with retention policy)
   */
  async clearOldLogs(retentionDays = 180) {
    try {
      const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      const logs = await this.loadLogs();
      
      const logsToArchive = logs.filter(log => new Date(log.timestamp).getTime() < cutoffDate);
      const logsToKeep = logs.filter(log => new Date(log.timestamp).getTime() >= cutoffDate);
      
      if (logsToArchive.length > 0) {
        await this.archiveLogs(logsToArchive);
        
        // Save remaining logs
        const encrypted = await EncryptionService.encryptObject(logsToKeep);
        await SecureStore.setItemAsync('audit_logs', encrypted);
        
        console.log(`✅ Archived ${logsToArchive.length} old audit logs`);
      }
      
      return {
        archived: logsToArchive.length,
        retained: logsToKeep.length
      };
    } catch (error) {
      console.error('Failed to clear old logs:', error);
      throw error;
    }
  }
}

// Export singleton instance
const auditLogger = new AuditLogger();

// Auto-initialize on first import
auditLogger.initialize().catch(console.error);

export default auditLogger;

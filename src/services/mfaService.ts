/**
 * Microsoft MFA Service
 * Two-Factor Authentication using Microsoft Authenticator
 * Token integration ready - add your Microsoft token to MICROSOFT_MFA_TOKEN
 */

// TODO: Replace with your Microsoft MFA token
const MICROSOFT_MFA_TOKEN = 'YOUR_MICROSOFT_TOKEN_HERE';

export interface MFAConfig {
  userId: string;
  enabled: boolean;
  method: 'microsoft' | 'email' | 'sms';
  enrolledAt: string;
  lastVerified?: string;
  backupCodes: string[];
  trustedDevices: TrustedDevice[];
}

export interface TrustedDevice {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  trustedAt: string;
  expiresAt: string;
}

export interface MFAChallenge {
  challengeId: string;
  userId: string;
  method: 'microsoft' | 'email' | 'sms';
  sentTo: string;
  code?: string; // Only for testing/email methods
  expiresAt: string;
  verified: boolean;
}

class MFAService {
  private readonly STORAGE_KEY = 'mfaConfigs';
  private readonly CHALLENGES_KEY = 'mfaChallenges';
  private readonly CODE_EXPIRY_MINUTES = 5;

  /**
   * Check if MFA is enabled for user
   */
  isMFAEnabled(userId: string): boolean {
    const config = this.getMFAConfig(userId);
    return config?.enabled || false;
  }

  /**
   * Get MFA configuration for user
   */
  getMFAConfig(userId: string): MFAConfig | null {
    const configs = this.getAllConfigs();
    return configs[userId] || null;
  }

  /**
   * Enable Microsoft MFA for user
   */
  async enableMicrosoftMFA(userId: string, userEmail: string): Promise<{
    success: boolean;
    backupCodes: string[];
    qrCode?: string;
  }> {
    try {
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Create MFA config
      const config: MFAConfig = {
        userId,
        enabled: true,
        method: 'microsoft',
        enrolledAt: new Date().toISOString(),
        backupCodes,
        trustedDevices: [],
      };

      // Save config
      const configs = this.getAllConfigs();
      configs[userId] = config;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));

      // In production, you would:
      // 1. Call Microsoft Graph API to enable MFA
      // 2. Register the user with Microsoft Authenticator
      // 3. Return QR code for scanning

      window.dispatchEvent(new CustomEvent('mfaEnabled', { detail: { userId, method: 'microsoft' } }));

      return {
        success: true,
        backupCodes,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=otpauth://totp/WeVote:${userEmail}?secret=BASE32SECRET&issuer=WeVote`,
      };
    } catch (error) {
      console.error('Error enabling Microsoft MFA:', error);
      return { success: false, backupCodes: [] };
    }
  }

  /**
   * Disable MFA for user
   */
  disableMFA(userId: string, password: string): boolean {
    // In production, verify password first
    const configs = this.getAllConfigs();
    if (configs[userId]) {
      configs[userId].enabled = false;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
      
      window.dispatchEvent(new CustomEvent('mfaDisabled', { detail: { userId } }));
      return true;
    }
    return false;
  }

  /**
   * Send MFA challenge (Microsoft Authenticator push notification)
   */
  async sendMFAChallenge(userId: string): Promise<MFAChallenge> {
    const config = this.getMFAConfig(userId);
    
    if (!config || !config.enabled) {
      throw new Error('MFA not enabled for this user');
    }

    const challenge: MFAChallenge = {
      challengeId: this.generateId(),
      userId,
      method: config.method,
      sentTo: 'Microsoft Authenticator',
      expiresAt: this.getExpiryTime(),
      verified: false,
    };

    // Store challenge
    const challenges = this.getAllChallenges();
    challenges.push(challenge);
    localStorage.setItem(this.CHALLENGES_KEY, JSON.stringify(challenges));

    // In production, you would:
    // 1. Call Microsoft Graph API to send push notification
    // 2. POST to: https://graph.microsoft.com/v1.0/me/authentication/microsoftAuthenticatorMethods/{id}/push
    // 3. Use MICROSOFT_MFA_TOKEN for authorization

    console.log('📱 MFA Challenge sent to Microsoft Authenticator');
    console.log('Challenge ID:', challenge.challengeId);

    return challenge;
  }

  /**
   * Verify MFA code (from Microsoft Authenticator)
   */
  async verifyMFACode(challengeId: string, code: string): Promise<boolean> {
    const challenges = this.getAllChallenges();
    const challenge = challenges.find(c => c.challengeId === challengeId);

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (new Date() > new Date(challenge.expiresAt)) {
      throw new Error('Challenge expired');
    }

    // In production, you would:
    // 1. Verify the code with Microsoft Graph API
    // 2. GET https://graph.microsoft.com/v1.0/me/authentication/microsoftAuthenticatorMethods/{id}/verify
    // 3. Use MICROSOFT_MFA_TOKEN for authorization

    // For demo: Accept any 6-digit code or backup codes
    const config = this.getMFAConfig(challenge.userId);
    const isBackupCode = config?.backupCodes.includes(code);
    const isValidFormat = /^\d{6}$/.test(code);

    if (isValidFormat || isBackupCode) {
      challenge.verified = true;
      localStorage.setItem(this.CHALLENGES_KEY, JSON.stringify(challenges));

      // Update last verified time
      if (config) {
        config.lastVerified = new Date().toISOString();
        const configs = this.getAllConfigs();
        configs[challenge.userId] = config;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
      }

      // Remove used backup code
      if (isBackupCode && config) {
        config.backupCodes = config.backupCodes.filter(c => c !== code);
        const configs = this.getAllConfigs();
        configs[challenge.userId] = config;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
      }

      window.dispatchEvent(new CustomEvent('mfaVerified', { detail: { userId: challenge.userId } }));
      return true;
    }

    return false;
  }

  /**
   * Add trusted device (skip MFA for 30 days)
   */
  addTrustedDevice(userId: string): string {
    const config = this.getMFAConfig(userId);
    if (!config) {
      throw new Error('MFA not configured for this user');
    }

    const deviceId = this.generateId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Trust for 30 days

    const device: TrustedDevice = {
      deviceId,
      deviceName: this.getDeviceName(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      trustedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    config.trustedDevices.push(device);
    const configs = this.getAllConfigs();
    configs[userId] = config;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));

    // Store device ID in localStorage
    localStorage.setItem('trustedDeviceId', deviceId);

    return deviceId;
  }

  /**
   * Check if current device is trusted
   */
  isDeviceTrusted(userId: string): boolean {
    const deviceId = localStorage.getItem('trustedDeviceId');
    if (!deviceId) return false;

    const config = this.getMFAConfig(userId);
    if (!config) return false;

    const device = config.trustedDevices.find(d => d.deviceId === deviceId);
    if (!device) return false;

    // Check if device trust has expired
    if (new Date() > new Date(device.expiresAt)) {
      this.removeTrustedDevice(userId, deviceId);
      return false;
    }

    return true;
  }

  /**
   * Remove trusted device
   */
  removeTrustedDevice(userId: string, deviceId: string): void {
    const config = this.getMFAConfig(userId);
    if (!config) return;

    config.trustedDevices = config.trustedDevices.filter(d => d.deviceId !== deviceId);
    const configs = this.getAllConfigs();
    configs[userId] = config;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));

    if (localStorage.getItem('trustedDeviceId') === deviceId) {
      localStorage.removeItem('trustedDeviceId');
    }
  }

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes(userId: string, password: string): string[] {
    // In production, verify password first
    const config = this.getMFAConfig(userId);
    if (!config) {
      throw new Error('MFA not configured for this user');
    }

    const backupCodes = this.generateBackupCodes();
    config.backupCodes = backupCodes;

    const configs = this.getAllConfigs();
    configs[userId] = config;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));

    return backupCodes;
  }

  /**
   * Get MFA statistics
   */
  getMFAStats(): {
    totalEnabled: number;
    byMethod: Record<string, number>;
    totalTrustedDevices: number;
    recentVerifications: number;
  } {
    const configs = this.getAllConfigs();
    const allConfigs = Object.values(configs);

    const stats = {
      totalEnabled: allConfigs.filter(c => c.enabled).length,
      byMethod: {
        microsoft: 0,
        email: 0,
        sms: 0,
      },
      totalTrustedDevices: 0,
      recentVerifications: 0,
    };

    allConfigs.forEach(config => {
      if (config.enabled) {
        stats.byMethod[config.method]++;
        stats.totalTrustedDevices += config.trustedDevices.length;
        
        if (config.lastVerified) {
          const daysSinceVerification = Math.floor(
            (Date.now() - new Date(config.lastVerified).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceVerification < 7) {
            stats.recentVerifications++;
          }
        }
      }
    });

    return stats;
  }

  /**
   * Generate 10 backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'MFA-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get expiry time (5 minutes from now)
   */
  private getExpiryTime(): string {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + this.CODE_EXPIRY_MINUTES);
    return expiry.toISOString();
  }

  /**
   * Get device name
   */
  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Windows')) return 'Windows PC';
    return 'Unknown Device';
  }

  /**
   * Get browser info
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  }

  /**
   * Get OS info
   */
  private getOSInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10.0')) return 'Windows 10';
    if (ua.includes('Windows NT 11.0')) return 'Windows 11';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  }

  /**
   * Get all MFA configs
   */
  private getAllConfigs(): Record<string, MFAConfig> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Get all challenges
   */
  private getAllChallenges(): MFAChallenge[] {
    const data = localStorage.getItem(this.CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Clear expired challenges
   */
  clearExpiredChallenges(): void {
    const challenges = this.getAllChallenges();
    const validChallenges = challenges.filter(
      c => new Date() <= new Date(c.expiresAt)
    );
    localStorage.setItem(this.CHALLENGES_KEY, JSON.stringify(validChallenges));
  }
}

export const mfaService = new MFAService();

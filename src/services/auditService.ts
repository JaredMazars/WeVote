/**
 * Audit Service
 * Comprehensive audit logging for compliance and security
 */

export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_reset'
  | 'vote.cast'
  | 'vote.verified'
  | 'proxy.assigned'
  | 'proxy.revoked'
  | 'meeting.created'
  | 'meeting.started'
  | 'meeting.ended'
  | 'candidate.registered'
  | 'resolution.created'
  | 'resolution.published'
  | 'qa.submitted'
  | 'qa.approved'
  | 'qa.answered'
  | 'document.uploaded'
  | 'document.accessed'
  | 'settings.changed'
  | 'admin.access'
  | 'data.exported'
  | 'security.alert';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  sessionId: string;
}

export interface AuditStats {
  total: number;
  byType: Record<AuditEventType, number>;
  bySeverity: Record<AuditSeverity, number>;
  byUser: { userId: string; userName: string; count: number }[];
  recentAlerts: AuditLog[];
}

class AuditService {
  private readonly STORAGE_KEY = 'auditLogs';
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Log an audit event
   */
  logEvent(
    userId: string,
    userName: string,
    eventType: AuditEventType,
    description: string,
    metadata: Record<string, any> = {},
    severity: AuditSeverity = 'low'
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      eventType,
      severity,
      description,
      ipAddress: this.getIPAddress(),
      userAgent: navigator.userAgent,
      metadata,
      sessionId: this.sessionId,
    };

    const logs = this.getAllLogs();
    logs.push(log);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));

    // Dispatch event for real-time monitoring
    window.dispatchEvent(new CustomEvent('auditLogCreated', { detail: log }));

    // Check for security alerts
    if (severity === 'critical') {
      this.handleSecurityAlert(log);
    }
  }

  /**
   * Get all audit logs
   */
  getAllLogs(): AuditLog[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const dummyLogs = this.getDummyLogs();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dummyLogs));
      return dummyLogs;
    }
    return JSON.parse(data);
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(filters: {
    userId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }): AuditLog[] {
    let logs = this.getAllLogs();

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters.eventType) {
      logs = logs.filter(log => log.eventType === filters.eventType);
    }

    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      logs = logs.filter(
        log =>
          log.description.toLowerCase().includes(term) ||
          log.userName.toLowerCase().includes(term) ||
          log.eventType.toLowerCase().includes(term)
      );
    }

    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get audit statistics
   */
  getStats(): AuditStats {
    const logs = this.getAllLogs();

    const stats: AuditStats = {
      total: logs.length,
      byType: {} as Record<AuditEventType, number>,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byUser: [],
      recentAlerts: [],
    };

    // Count by type
    logs.forEach(log => {
      stats.byType[log.eventType] = (stats.byType[log.eventType] || 0) + 1;
      stats.bySeverity[log.severity]++;
    });

    // Count by user
    const userMap = new Map<string, { userName: string; count: number }>();
    logs.forEach(log => {
      const existing = userMap.get(log.userId);
      if (existing) {
        existing.count++;
      } else {
        userMap.set(log.userId, { userName: log.userName, count: 1 });
      }
    });

    stats.byUser = Array.from(userMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent critical alerts
    stats.recentAlerts = logs
      .filter(log => log.severity === 'critical' || log.severity === 'high')
      .slice(0, 10);

    return stats;
  }

  /**
   * Get user activity timeline
   */
  getUserTimeline(userId: string): AuditLog[] {
    return this.getLogs({ userId });
  }

  /**
   * Export audit logs
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getAllLogs();

    if (format === 'csv') {
      const headers = [
        'Timestamp',
        'User',
        'Event Type',
        'Severity',
        'Description',
        'IP Address',
        'Session ID',
      ];

      const rows = logs.map(log => [
        log.timestamp,
        log.userName,
        log.eventType,
        log.severity,
        log.description,
        log.ipAddress,
        log.sessionId,
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');
    }

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalLogs: logs.length,
        logs,
      },
      null,
      2
    );
  }

  /**
   * Clear old logs (data retention)
   */
  clearLogsOlderThan(days: number): number {
    const logs = this.getAllLogs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    const filteredLogs = logs.filter(log => log.timestamp >= cutoffISO);
    const removedCount = logs.length - filteredLogs.length;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredLogs));

    return removedCount;
  }

  /**
   * Clear all logs (testing only)
   */
  clearAllLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'AUD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'SES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get IP address (simulated)
   */
  private getIPAddress(): string {
    // In real implementation, this would come from backend
    // For now, simulate with dummy IP
    return '192.168.1.' + Math.floor(Math.random() * 255);
  }

  /**
   * Handle security alert
   */
  private handleSecurityAlert(log: AuditLog): void {
    // In real implementation, this would:
    // 1. Send email to security team
    // 2. Trigger Slack/Teams notification
    // 3. Log to SIEM system
    // 4. Potentially lock account if multiple alerts
    console.warn('🚨 SECURITY ALERT:', log);
    
    // Dispatch critical alert event
    window.dispatchEvent(new CustomEvent('securityAlert', { detail: log }));
  }

  /**
   * Get dummy audit logs for testing
   */
  private getDummyLogs(): AuditLog[] {
    const now = new Date();
    const sessionId = 'SES-' + Date.now();

    return [
      {
        id: 'AUD-001',
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
        userId: 'USR-001',
        userName: 'John Smith',
        eventType: 'user.login',
        severity: 'low',
        description: 'User logged in successfully',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        metadata: { method: 'email', mfaUsed: true },
        sessionId,
      },
      {
        id: 'AUD-002',
        timestamp: new Date(now.getTime() - 3000000).toISOString(),
        userId: 'USR-001',
        userName: 'John Smith',
        eventType: 'vote.cast',
        severity: 'medium',
        description: 'Vote cast for candidate election',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        metadata: { voteType: 'candidate', candidateId: 'CAND-001', voteId: 'V-123' },
        sessionId,
      },
      {
        id: 'AUD-003',
        timestamp: new Date(now.getTime() - 2400000).toISOString(),
        userId: 'USR-001',
        userName: 'John Smith',
        eventType: 'vote.verified',
        severity: 'low',
        description: 'Vote verified on blockchain',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        metadata: { voteId: 'V-123', blockNumber: 42, hash: 'abc123...' },
        sessionId,
      },
      {
        id: 'AUD-004',
        timestamp: new Date(now.getTime() - 1800000).toISOString(),
        userId: 'USR-002',
        userName: 'Sarah Johnson',
        eventType: 'proxy.assigned',
        severity: 'medium',
        description: 'Proxy voting rights assigned',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)...',
        metadata: { proxyTo: 'USR-003', proxyType: 'discretionary' },
        sessionId: 'SES-789',
      },
      {
        id: 'AUD-005',
        timestamp: new Date(now.getTime() - 1200000).toISOString(),
        userId: 'ADM-001',
        userName: 'Admin User',
        eventType: 'meeting.created',
        severity: 'medium',
        description: 'New AGM meeting created',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
        metadata: { meetingId: 'MTG-001', meetingTitle: 'AGM 2025' },
        sessionId: 'SES-456',
      },
      {
        id: 'AUD-006',
        timestamp: new Date(now.getTime() - 900000).toISOString(),
        userId: 'USR-003',
        userName: 'Michael Chen',
        eventType: 'qa.submitted',
        severity: 'low',
        description: 'Question submitted for AGM',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        metadata: { questionId: 'Q-001', meetingId: 'MTG-001' },
        sessionId: 'SES-321',
      },
      {
        id: 'AUD-007',
        timestamp: new Date(now.getTime() - 600000).toISOString(),
        userId: 'ADM-001',
        userName: 'Admin User',
        eventType: 'data.exported',
        severity: 'high',
        description: 'Voter data exported to PDF',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
        metadata: { exportType: 'vote-results', format: 'pdf' },
        sessionId: 'SES-456',
      },
      {
        id: 'AUD-008',
        timestamp: new Date(now.getTime() - 300000).toISOString(),
        userId: 'USR-999',
        userName: 'Unknown User',
        eventType: 'security.alert',
        severity: 'critical',
        description: 'Multiple failed login attempts detected',
        ipAddress: '203.0.113.45',
        userAgent: 'Python-requests/2.28.0',
        metadata: { attempts: 5, reason: 'invalid_password' },
        sessionId: 'SES-999',
      },
      {
        id: 'AUD-009',
        timestamp: new Date(now.getTime() - 180000).toISOString(),
        userId: 'ADM-001',
        userName: 'Admin User',
        eventType: 'admin.access',
        severity: 'high',
        description: 'Admin dashboard accessed',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
        metadata: { section: 'user-management' },
        sessionId: 'SES-456',
      },
      {
        id: 'AUD-010',
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        userId: 'USR-004',
        userName: 'Emily Davis',
        eventType: 'document.accessed',
        severity: 'low',
        description: 'AGM agenda document viewed',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)...',
        metadata: { documentId: 'DOC-001', documentTitle: 'AGM Agenda 2025.pdf' },
        sessionId: 'SES-654',
      },
    ];
  }
}

export const auditService = new AuditService();

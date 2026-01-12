// Quorum Management Service
// Handles quorum calculation, enforcement, and real-time tracking

export interface QuorumConfig {
  meetingId: string;
  requiredPercentage: number; // e.g., 50 = 50%
  requiredCount?: number; // Optional: fixed number instead of percentage
  eligibleVoters: number;
  countProxies: boolean; // Whether to count proxy votes toward quorum
}

export interface QuorumStatus {
  meetingId: string;
  required: number;
  present: number;
  percentage: number;
  met: boolean;
  shortfall: number;
  timestamp: string;
  attendees: Array<{
    userId: string;
    userName: string;
    checkedInAt: string;
    isProxy: boolean;
    voteWeight: number;
  }>;
}

class QuorumService {
  private readonly STORAGE_KEY = 'quorumConfigs';
  private readonly STATUS_KEY = 'quorumStatus';

  /**
   * Set quorum requirements for a meeting
   */
  setQuorumConfig(config: QuorumConfig): void {
    const configs = this.getAllConfigs();
    configs[config.meetingId] = config;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
  }

  /**
   * Get quorum config for a specific meeting
   */
  getQuorumConfig(meetingId: string): QuorumConfig | null {
    const configs = this.getAllConfigs();
    return configs[meetingId] || null;
  }

  /**
   * Get all quorum configurations
   */
  getAllConfigs(): Record<string, QuorumConfig> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Calculate current quorum status
   */
  calculateQuorumStatus(meetingId: string): QuorumStatus | null {
    const config = this.getQuorumConfig(meetingId);
    if (!config) {
      console.warn(`No quorum config found for meeting: ${meetingId}`);
      return null;
    }

    // Get meeting attendees
    const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    const meeting = meetings.find((m: any) => m.id === meetingId);
    
    if (!meeting) {
      console.warn(`Meeting not found: ${meetingId}`);
      return null;
    }

    const attendees = meeting.attendees || [];
    const present = attendees.length;

    // Calculate required count
    let required: number;
    if (config.requiredCount) {
      required = config.requiredCount;
    } else {
      required = Math.ceil((config.eligibleVoters * config.requiredPercentage) / 100);
    }

    // Calculate percentage
    const percentage = config.eligibleVoters > 0 
      ? (present / config.eligibleVoters) * 100 
      : 0;

    const status: QuorumStatus = {
      meetingId,
      required,
      present,
      percentage: Math.round(percentage * 100) / 100,
      met: present >= required,
      shortfall: Math.max(0, required - present),
      timestamp: new Date().toISOString(),
      attendees: attendees.map((a: any) => ({
        userId: a.userId,
        userName: a.userName,
        checkedInAt: a.checkedInAt,
        isProxy: a.isProxy || false,
        voteWeight: a.voteWeight || 1
      }))
    };

    // Save status
    this.saveQuorumStatus(meetingId, status);

    return status;
  }

  /**
   * Check if voting is allowed (quorum met)
   */
  canStartVoting(meetingId: string): { allowed: boolean; reason?: string } {
    const status = this.calculateQuorumStatus(meetingId);
    
    if (!status) {
      return {
        allowed: false,
        reason: 'No quorum configuration found for this meeting'
      };
    }

    if (!status.met) {
      return {
        allowed: false,
        reason: `Quorum not met. Need ${status.shortfall} more attendee(s). Currently ${status.present}/${status.required}`
      };
    }

    return { allowed: true };
  }

  /**
   * Enforce quorum before allowing an action
   */
  enforceQuorum(meetingId: string): void {
    const result = this.canStartVoting(meetingId);
    if (!result.allowed) {
      throw new Error(result.reason || 'Quorum not met');
    }
  }

  /**
   * Save quorum status to localStorage
   */
  private saveQuorumStatus(meetingId: string, status: QuorumStatus): void {
    const allStatus = this.getAllStatus();
    allStatus[meetingId] = status;
    localStorage.setItem(this.STATUS_KEY, JSON.stringify(allStatus));
  }

  /**
   * Get all quorum status records
   */
  getAllStatus(): Record<string, QuorumStatus> {
    const data = localStorage.getItem(this.STATUS_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Get quorum status for a specific meeting
   */
  getQuorumStatus(meetingId: string): QuorumStatus | null {
    const allStatus = this.getAllStatus();
    return allStatus[meetingId] || null;
  }

  /**
   * Initialize default quorum config for a meeting
   */
  initializeDefaultQuorum(meetingId: string, eligibleVoters: number): void {
    const existing = this.getQuorumConfig(meetingId);
    if (!existing) {
      this.setQuorumConfig({
        meetingId,
        requiredPercentage: 50, // Default: 50% quorum
        eligibleVoters,
        countProxies: true
      });
    }
  }

  /**
   * Get real-time quorum updates (call periodically)
   */
  getQuorumUpdates(): QuorumStatus[] {
    const configs = this.getAllConfigs();
    const updates: QuorumStatus[] = [];

    Object.keys(configs).forEach(meetingId => {
      const status = this.calculateQuorumStatus(meetingId);
      if (status) {
        updates.push(status);
      }
    });

    return updates;
  }

  /**
   * Check if quorum was lost during meeting
   */
  checkQuorumLoss(meetingId: string): boolean {
    const status = this.calculateQuorumStatus(meetingId);
    if (!status) return false;

    const previousStatus = this.getQuorumStatus(meetingId);
    
    // If quorum was previously met but now lost
    if (previousStatus?.met && !status.met) {
      return true;
    }

    return false;
  }

  /**
   * Get quorum achievement history
   */
  getQuorumHistory(meetingId: string): Array<{
    timestamp: string;
    present: number;
    required: number;
    met: boolean;
  }> {
    const historyKey = `quorum_history_${meetingId}`;
    const data = localStorage.getItem(historyKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Record quorum status change
   */
  recordQuorumChange(meetingId: string, status: QuorumStatus): void {
    const historyKey = `quorum_history_${meetingId}`;
    const history = this.getQuorumHistory(meetingId);
    
    history.push({
      timestamp: status.timestamp,
      present: status.present,
      required: status.required,
      met: status.met
    });

    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  /**
   * Clear quorum data for a meeting
   */
  clearMeetingQuorum(meetingId: string): void {
    const configs = this.getAllConfigs();
    delete configs[meetingId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));

    const status = this.getAllStatus();
    delete status[meetingId];
    localStorage.setItem(this.STATUS_KEY, JSON.stringify(status));

    localStorage.removeItem(`quorum_history_${meetingId}`);
  }
}

export const quorumService = new QuorumService();

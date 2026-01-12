/**
 * Email Notification Service
 * FREE implementation using mailto: links and local storage queuing
 * For production, integrate with EmailJS (free tier: 200 emails/month)
 */

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'vote-confirmation' | 'meeting-reminder' | 'proxy-assignment' | 'results-notification';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

class EmailService {
  private readonly STORAGE_KEY = 'emailNotifications';

  /**
   * Queue an email notification
   */
  queueEmail(notification: Omit<EmailNotification, 'id' | 'status' | 'createdAt'>): EmailNotification {
    const email: EmailNotification = {
      ...notification,
      id: `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const queue = this.getEmailQueue();
    queue.push(email);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));

    return email;
  }

  /**
   * Get all queued emails
   */
  getEmailQueue(): EmailNotification[] {
    const queue = localStorage.getItem(this.STORAGE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  /**
   * Send email using mailto: (opens user's email client)
   */
  sendEmail(emailId: string): void {
    const queue = this.getEmailQueue();
    const email = queue.find(e => e.id === emailId);

    if (!email) {
      console.error('Email not found');
      return;
    }

    // Create mailto link
    const mailtoLink = `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    
    // Open email client
    window.location.href = mailtoLink;

    // Mark as sent
    email.status = 'sent';
    email.sentAt = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));

    // Dispatch event
    window.dispatchEvent(new CustomEvent('emailSent', { detail: email }));
  }

  /**
   * Generate vote confirmation email
   */
  generateVoteConfirmationEmail(data: {
    voterName: string;
    voterEmail: string;
    voteId: string;
    candidateName?: string;
    resolutionTitle?: string;
    timestamp: string;
    verificationUrl: string;
  }): Omit<EmailNotification, 'id' | 'status' | 'createdAt'> {
    const voteType = data.candidateName ? 'Candidate' : 'Resolution';
    const voteFor = data.candidateName || data.resolutionTitle;

    return {
      to: data.voterEmail,
      type: 'vote-confirmation',
      subject: '✅ Vote Confirmation - WeVote',
      body: `Dear ${data.voterName},

Your vote has been successfully recorded and verified.

Vote Details:
- Vote ID: ${data.voteId}
- Type: ${voteType} Voting
- Vote For: ${voteFor}
- Timestamp: ${new Date(data.timestamp).toLocaleString()}

🔒 Blockchain Verification:
Your vote has been cryptographically verified and recorded on the blockchain.

Verify your vote at any time:
${data.verificationUrl}

Thank you for participating in this voting session.

Best regards,
WeVote Platform

---
This is an automated message. Please do not reply to this email.`,
    };
  }

  /**
   * Generate meeting reminder email
   */
  generateMeetingReminderEmail(data: {
    attendeeName: string;
    attendeeEmail: string;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    meetingUrl?: string;
  }): Omit<EmailNotification, 'id' | 'status' | 'createdAt'> {
    return {
      to: data.attendeeEmail,
      type: 'meeting-reminder',
      subject: `⏰ Meeting Reminder: ${data.meetingTitle} - WeVote`,
      body: `Dear ${data.attendeeName},

This is a reminder for the upcoming meeting:

Meeting Details:
- Title: ${data.meetingTitle}
- Date: ${data.meetingDate}
- Time: ${data.meetingTime}
${data.meetingUrl ? `- Join URL: ${data.meetingUrl}` : ''}

Please ensure you are available and prepared to participate.

Important:
- Voting will be enabled during the scheduled time window
- Your vote allocation: Check your profile for details
- Proxy assignments: Review before the meeting starts

Best regards,
WeVote Platform

---
This is an automated message. Please do not reply to this email.`,
    };
  }

  /**
   * Generate proxy assignment notification email
   */
  generateProxyNotificationEmail(data: {
    proxyHolderName: string;
    proxyHolderEmail: string;
    appointorName: string;
    proxyType: string;
    votes: number;
  }): Omit<EmailNotification, 'id' | 'status' | 'createdAt'> {
    return {
      to: data.proxyHolderEmail,
      type: 'proxy-assignment',
      subject: '🔑 Proxy Assignment Notification - WeVote',
      body: `Dear ${data.proxyHolderName},

You have been assigned as a proxy holder.

Proxy Details:
- Assigned by: ${data.appointorName}
- Proxy Type: ${data.proxyType}
- Votes Delegated: ${data.votes}

Responsibilities:
${data.proxyType === 'Discretionary' ? 
  '- You may vote at your discretion on behalf of the appointor' :
  '- You must follow specific voting instructions provided by the appointor'}

Please log in to WeVote to review your proxy responsibilities and vote accordingly during the AGM session.

Best regards,
WeVote Platform

---
This is an automated message. Please do not reply to this email.`,
    };
  }

  /**
   * Generate results notification email
   */
  generateResultsNotificationEmail(data: {
    recipientName: string;
    recipientEmail: string;
    meetingTitle: string;
    resultsUrl: string;
  }): Omit<EmailNotification, 'id' | 'status' | 'createdAt'> {
    return {
      to: data.recipientEmail,
      type: 'results-notification',
      subject: `📊 Voting Results Published: ${data.meetingTitle} - WeVote`,
      body: `Dear ${data.recipientName},

The voting results for "${data.meetingTitle}" have been published.

View the complete results at:
${data.resultsUrl}

Results include:
- Candidate voting outcomes
- Resolution voting outcomes
- Participation statistics
- Proxy utilization report

All votes have been cryptographically verified and recorded on the blockchain for transparency and auditability.

Thank you for your participation.

Best regards,
WeVote Platform

---
This is an automated message. Please do not reply to this email.`,
    };
  }

  /**
   * Clear email queue
   */
  clearEmailQueue(): void {
    if (confirm('⚠️ Are you sure you want to clear all queued emails?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      alert('✅ Email queue cleared');
    }
  }

  /**
   * Get email statistics
   */
  getEmailStats() {
    const queue = this.getEmailQueue();
    return {
      total: queue.length,
      pending: queue.filter(e => e.status === 'pending').length,
      sent: queue.filter(e => e.status === 'sent').length,
      failed: queue.filter(e => e.status === 'failed').length,
    };
  }
}

export const emailService = new EmailService();

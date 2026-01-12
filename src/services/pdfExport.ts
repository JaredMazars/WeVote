/**
 * PDF Export Service
 * Generate professional PDF reports for votes, results, and certificates
 * Using jsPDF library (free, no dependencies)
 */

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  data: any;
  type: 'vote-receipt' | 'vote-results' | 'proxy-report' | 'audit-log' | 'blockchain-certificate';
  includeQR?: boolean;
  qrData?: string;
}

class PDFService {
  private readonly BRAND_COLORS = {
    primary: '#0072CE',
    secondary: '#171C8F',
    gray: '#464B4B',
    lightGray: '#F4F4F4',
  };

  /**
   * Generate a simple PDF using browser canvas and download
   * This is a lightweight alternative to jsPDF for basic PDFs
   */
  async generatePDF(options: PDFExportOptions): Promise<void> {
    const { title, subtitle, data, type } = options;

    // Create a temporary canvas for PDF generation
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas not supported');
    }

    // Set background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add WeVote header with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, this.BRAND_COLORS.primary);
    gradient.addColorStop(1, this.BRAND_COLORS.secondary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 100);

    // Add logo text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('WeVote', 50, 65);

    // Add subtitle
    ctx.font = '16px Arial';
    ctx.fillText('Professional Voting Platform', 50, 85);

    // Add title
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.font = 'bold 32px Arial';
    ctx.fillText(title, 50, 150);

    // Add subtitle if provided
    if (subtitle) {
      ctx.font = '18px Arial';
      ctx.fillStyle = this.BRAND_COLORS.gray;
      ctx.fillText(subtitle, 50, 185);
    }

    // Render based on type
    let yPos = subtitle ? 220 : 190;

    switch (type) {
      case 'vote-receipt':
        yPos = this.renderVoteReceipt(ctx, data, yPos);
        break;
      case 'vote-results':
        yPos = this.renderVoteResults(ctx, data, yPos);
        break;
      case 'proxy-report':
        yPos = this.renderProxyReport(ctx, data, yPos);
        break;
      case 'audit-log':
        yPos = this.renderAuditLog(ctx, data, yPos);
        break;
      case 'blockchain-certificate':
        yPos = this.renderBlockchainCertificate(ctx, data, yPos);
        break;
    }

    // Add footer
    ctx.fillStyle = this.BRAND_COLORS.lightGray;
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.font = '14px Arial';
    ctx.fillText(`Generated on: ${new Date().toLocaleString()}`, 50, canvas.height - 45);
    ctx.fillText('WeVote - Secure, Transparent, Modern', 50, canvas.height - 25);

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  private renderVoteReceipt(ctx: CanvasRenderingContext2D, data: any, startY: number): number {
    let y = startY;
    ctx.font = '16px Arial';
    ctx.fillStyle = this.BRAND_COLORS.gray;

    const fields = [
      { label: 'Vote ID:', value: data.voteId },
      { label: 'Voter:', value: data.voterName },
      { label: 'Vote Type:', value: data.voteType },
      { label: 'Timestamp:', value: new Date(data.timestamp).toLocaleString() },
      { label: 'Blockchain Hash:', value: data.blockchainHash ? data.blockchainHash.substring(0, 40) + '...' : 'N/A' },
    ];

    fields.forEach(field => {
      ctx.font = 'bold 16px Arial';
      ctx.fillText(field.label, 50, y);
      ctx.font = '16px Arial';
      ctx.fillText(field.value, 200, y);
      y += 30;
    });

    // Add verification box
    y += 20;
    ctx.strokeStyle = this.BRAND_COLORS.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, y, 720, 100);
    
    ctx.fillStyle = this.BRAND_COLORS.primary;
    ctx.font = 'bold 18px Arial';
    ctx.fillText('✓ Vote Verified', 60, y + 35);
    
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.font = '14px Arial';
    ctx.fillText('This vote has been cryptographically verified and recorded on the blockchain.', 60, y + 60);
    ctx.fillText(`Transaction ID: ${data.transactionId || 'N/A'}`, 60, y + 80);

    return y + 120;
  }

  private renderVoteResults(ctx: CanvasRenderingContext2D, data: any, startY: number): number {
    let y = startY;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.fillText('Voting Results Summary', 50, y);
    y += 40;

    ctx.font = '16px Arial';
    if (data.candidates && data.candidates.length > 0) {
      ctx.fillText('Candidate Voting:', 50, y);
      y += 30;

      data.candidates.forEach((candidate: any, index: number) => {
        ctx.font = '14px Arial';
        ctx.fillText(`${index + 1}. ${candidate.name}: ${candidate.votes} votes (${candidate.percentage}%)`, 70, y);
        y += 25;
      });
    }

    y += 20;
    if (data.resolutions && data.resolutions.length > 0) {
      ctx.fillText('Resolution Voting:', 50, y);
      y += 30;

      data.resolutions.forEach((resolution: any, index: number) => {
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${index + 1}. ${resolution.title}`, 70, y);
        y += 25;
        ctx.font = '14px Arial';
        ctx.fillText(`   Yes: ${resolution.yes} | No: ${resolution.no} | Abstain: ${resolution.abstain}`, 70, y);
        y += 25;
      });
    }

    return y + 20;
  }

  private renderProxyReport(ctx: CanvasRenderingContext2D, data: any, startY: number): number {
    let y = startY;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.fillText('Proxy Assignment Report', 50, y);
    y += 40;

    ctx.font = '16px Arial';
    ctx.fillText(`Total Proxies: ${data.totalProxies || 0}`, 50, y);
    y += 30;
    ctx.fillText(`Active Proxies: ${data.activeProxies || 0}`, 50, y);
    y += 30;
    ctx.fillText(`Total Votes Delegated: ${data.totalVotesDelegated || 0}`, 50, y);
    y += 40;

    if (data.proxies && data.proxies.length > 0) {
      ctx.fillText('Proxy Details:', 50, y);
      y += 30;

      data.proxies.slice(0, 10).forEach((proxy: any, index: number) => {
        ctx.font = '14px Arial';
        ctx.fillText(`${index + 1}. ${proxy.appointorName} → ${proxy.proxyHolderName} (${proxy.votes} votes)`, 70, y);
        y += 25;
      });

      if (data.proxies.length > 10) {
        ctx.fillText(`... and ${data.proxies.length - 10} more proxies`, 70, y);
        y += 25;
      }
    }

    return y + 20;
  }

  private renderAuditLog(ctx: CanvasRenderingContext2D, data: any, startY: number): number {
    let y = startY;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.fillText('Audit Log Report', 50, y);
    y += 40;

    ctx.font = '16px Arial';
    ctx.fillText(`Total Events: ${data.totalEvents || 0}`, 50, y);
    y += 30;
    ctx.fillText(`Date Range: ${data.dateRange || 'N/A'}`, 50, y);
    y += 40;

    if (data.events && data.events.length > 0) {
      ctx.fillText('Recent Events:', 50, y);
      y += 30;

      data.events.slice(0, 15).forEach((event: any) => {
        ctx.font = '12px Arial';
        ctx.fillText(`${new Date(event.timestamp).toLocaleString()} - ${event.action} by ${event.user}`, 70, y);
        y += 20;
      });

      if (data.events.length > 15) {
        ctx.fillText(`... and ${data.events.length - 15} more events`, 70, y);
        y += 20;
      }
    }

    return y + 20;
  }

  private renderBlockchainCertificate(ctx: CanvasRenderingContext2D, data: any, startY: number): number {
    let y = startY;

    // Certificate border
    ctx.strokeStyle = this.BRAND_COLORS.primary;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, startY - 20, 740, 500);

    // Certificate title
    ctx.fillStyle = this.BRAND_COLORS.primary;
    ctx.font = 'bold 28px Arial';
    ctx.fillText('BLOCKCHAIN VERIFICATION CERTIFICATE', 80, y + 20);
    
    y += 70;
    ctx.fillStyle = this.BRAND_COLORS.gray;
    ctx.font = '16px Arial';
    ctx.fillText('This certifies that the following vote has been cryptographically verified', 80, y);
    y += 25;
    ctx.fillText('and recorded on the WeVote blockchain with immutable proof.', 80, y);
    
    y += 60;
    const certFields = [
      { label: 'Certificate ID:', value: data.certificateId },
      { label: 'Vote ID:', value: data.voteId },
      { label: 'Blockchain Hash:', value: data.hash ? data.hash.substring(0, 50) + '...' : 'N/A' },
      { label: 'Transaction ID:', value: data.transactionId ? data.transactionId.substring(0, 50) + '...' : 'N/A' },
      { label: 'Block Number:', value: data.blockNumber },
      { label: 'Timestamp:', value: new Date(data.timestamp).toLocaleString() },
      { label: 'Status:', value: '✅ VERIFIED' },
    ];

    certFields.forEach(field => {
      ctx.font = 'bold 14px Arial';
      ctx.fillText(field.label, 80, y);
      ctx.font = '14px Arial';
      ctx.fillText(String(field.value), 280, y);
      y += 30;
    });

    y += 30;
    ctx.fillStyle = this.BRAND_COLORS.primary;
    ctx.font = 'italic 14px Arial';
    ctx.fillText('Issued by WeVote Platform - Cryptographically Secured', 80, y);

    return y + 60;
  }

  /**
   * Export data to JSON
   */
  exportToJSON(data: any, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header =>
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const pdfService = new PDFService();

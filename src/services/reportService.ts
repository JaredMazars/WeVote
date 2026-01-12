import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ==================== INTERFACES ====================

interface Candidate {
  id: string;
  name: string;
  department: string;
  position?: string;
  voteCount: number;
}

interface Resolution {
  id: string;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  category?: string;
  votingRequirement?: string;
  status: string;
}

interface AGMSession {
  startTime?: Date;
  endTime?: Date;
  duration?: string;
  status: 'active' | 'ended' | 'not-started';
}

interface AuditLog {
  id: string;
  action: string;
  userName?: string;
  timestamp: string;
  details?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ReportData {
  candidates: Candidate[];
  resolutions: Resolution[];
  agmSession: AGMSession;
  auditLogs?: AuditLog[];
  totalUsers: number;
  totalVotesCast: number;
  quorumStatus?: {
    required: number;
    present: number;
    percentage: number;
    met: boolean;
  };
  attendance?: {
    checkedIn: number;
    total: number;
    percentage: number;
  };
}

// ==================== PDF GENERATION ====================

class ReportService {
  
  /**
   * Generate comprehensive AGM Results PDF Report
   */
  generateAGMResultsPDF(reportData: ReportData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // ========== HEADER ==========
    // Company Logo/Header
    doc.setFillColor(0, 114, 206); // #0072CE
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('WeVote', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Annual General Meeting - Voting Results Report', 20, 30);

    // ========== REPORT METADATA ==========
    yPosition = 50;
    doc.setTextColor(70, 75, 75);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const reportDate = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    doc.text(`Report Generated: ${reportDate}`, 20, yPosition);
    yPosition += 6;
    doc.text(`AGM Status: ${reportData.agmSession.status.toUpperCase()}`, 20, yPosition);
    
    if (reportData.agmSession.startTime && reportData.agmSession.endTime) {
      yPosition += 6;
      doc.text(`Duration: ${reportData.agmSession.duration || 'N/A'}`, 20, yPosition);
    }

    // ========== EXECUTIVE SUMMARY ==========
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 28, 143); // #171C8F
    doc.text('Executive Summary', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 75, 75);

    const summaryData = [
      ['Total Registered Voters', reportData.totalUsers.toString()],
      ['Total Votes Cast', reportData.totalVotesCast.toString()],
      ['Voter Turnout', `${((reportData.totalVotesCast / reportData.totalUsers) * 100).toFixed(1)}%`],
      ['Candidate Votes', reportData.candidates.reduce((sum, c) => sum + c.voteCount, 0).toString()],
      ['Resolution Votes', reportData.resolutions.reduce((sum, r) => sum + r.yesVotes + r.noVotes + r.abstainVotes, 0).toString()]
    ];

    if (reportData.quorumStatus) {
      summaryData.push(
        ['Quorum Required', `${reportData.quorumStatus.required}%`],
        ['Quorum Achieved', `${reportData.quorumStatus.percentage.toFixed(1)}%`],
        ['Quorum Status', reportData.quorumStatus.met ? '✓ MET' : '✗ NOT MET']
      );
    }

    if (reportData.attendance) {
      summaryData.push(
        ['Meeting Attendance', `${reportData.attendance.checkedIn} / ${reportData.attendance.total} (${reportData.attendance.percentage.toFixed(1)}%)`]
      );
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 114, 206],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 80 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // ========== CANDIDATE VOTING RESULTS ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 28, 143);
    doc.text('Candidate Voting Results', 20, yPosition);
    
    yPosition += 10;

    const totalCandidateVotes = reportData.candidates.reduce((sum, c) => sum + c.voteCount, 0);
    
    const candidateData = reportData.candidates
      .sort((a, b) => b.voteCount - a.voteCount)
      .map((candidate, index) => [
        (index + 1).toString(),
        candidate.name,
        candidate.department || 'N/A',
        candidate.position || 'N/A',
        candidate.voteCount.toString(),
        totalCandidateVotes > 0 
          ? `${((candidate.voteCount / totalCandidateVotes) * 100).toFixed(1)}%`
          : '0%'
      ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Candidate Name', 'Department', 'Position', 'Votes', 'Percentage']],
      body: candidateData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 114, 206],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 25 }
      },
      didDrawPage: (data) => {
        // Add footer to each page
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    // ========== RESOLUTION VOTING RESULTS ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 28, 143);
    doc.text('Resolution Voting Results', 20, yPosition);
    
    yPosition += 10;

    const resolutionData = reportData.resolutions.map((resolution, index) => {
      const totalVotes = resolution.yesVotes + resolution.noVotes + resolution.abstainVotes;
      const yesPercentage = totalVotes > 0 ? ((resolution.yesVotes / totalVotes) * 100).toFixed(1) : '0';
      const noPercentage = totalVotes > 0 ? ((resolution.noVotes / totalVotes) * 100).toFixed(1) : '0';
      const abstainPercentage = totalVotes > 0 ? ((resolution.abstainVotes / totalVotes) * 100).toFixed(1) : '0';
      
      // Determine if resolution passed (majority yes votes)
      const passed = resolution.yesVotes > resolution.noVotes;
      const status = passed ? '✓ PASSED' : '✗ FAILED';
      
      return [
        (index + 1).toString(),
        resolution.title,
        `${resolution.yesVotes} (${yesPercentage}%)`,
        `${resolution.noVotes} (${noPercentage}%)`,
        `${resolution.abstainVotes} (${abstainPercentage}%)`,
        totalVotes.toString(),
        status
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Resolution Title', 'Yes Votes', 'No Votes', 'Abstain', 'Total', 'Result']],
      body: resolutionData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 114, 206],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 15 },
        6: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        // Color code the result column
        if (data.column.index === 6 && data.section === 'body') {
          const result = data.cell.text[0];
          if (result.includes('PASSED')) {
            doc.setTextColor(34, 197, 94); // Green
          } else if (result.includes('FAILED')) {
            doc.setTextColor(239, 68, 68); // Red
          }
        }
      }
    });

    // ========== RESOLUTION DETAILS (NEW PAGE) ==========
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 28, 143);
    doc.text('Resolution Details', 20, yPosition);

    yPosition += 10;

    reportData.resolutions.forEach((resolution, index) => {
      const totalVotes = resolution.yesVotes + resolution.noVotes + resolution.abstainVotes;
      const yesPercentage = totalVotes > 0 ? ((resolution.yesVotes / totalVotes) * 100).toFixed(1) : '0';
      const passed = resolution.yesVotes > resolution.noVotes;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 75, 75);
      doc.text(`${index + 1}. ${resolution.title}`, 20, yPosition);
      
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const descriptionLines = doc.splitTextToSize(resolution.description || 'No description provided', pageWidth - 40);
      doc.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * 5;

      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text(`Category: ${resolution.category || 'General'}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Voting Requirement: ${resolution.votingRequirement || 'Simple Majority'}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Result: `, 20, yPosition);
      
      if (passed) {
        doc.setTextColor(34, 197, 94);
        doc.text('✓ PASSED', 45, yPosition);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('✗ FAILED', 45, yPosition);
      }
      
      yPosition += 5;
      doc.setTextColor(70, 75, 75);
      doc.setFont('helvetica', 'normal');
      doc.text(`Yes: ${resolution.yesVotes} (${yesPercentage}%) | No: ${resolution.noVotes} | Abstain: ${resolution.abstainVotes}`, 20, yPosition);
      
      yPosition += 10;
    });

    // ========== CERTIFICATION & SIGNATURES ==========
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 10;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 28, 143);
    doc.text('Report Certification', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 75, 75);
    
    const certificationText = [
      'This report has been automatically generated by the WeVote platform and contains',
      'accurate vote tallies as recorded during the Annual General Meeting session.',
      '',
      `Report Generation Timestamp: ${reportDate}`,
      `AGM Session Status: ${reportData.agmSession.status.toUpperCase()}`,
      `Total Votes Recorded: ${reportData.totalVotesCast}`
    ];
    
    certificationText.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });

    yPosition += 15;

    // Signature blocks
    doc.setDrawColor(100, 100, 100);
    doc.line(20, yPosition, 80, yPosition);
    doc.line(120, yPosition, 180, yPosition);
    
    yPosition += 5;
    doc.setFontSize(8);
    doc.text('Meeting Chairperson', 20, yPosition);
    doc.text('System Administrator', 120, yPosition);

    // Save the PDF
    const filename = `AGM_Results_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  /**
   * Generate comprehensive AGM Results Excel Report
   */
  generateAGMResultsExcel(reportData: ReportData): void {
    const workbook = XLSX.utils.book_new();

    // ========== SHEET 1: EXECUTIVE SUMMARY ==========
    const summaryData = [
      ['WeVote - AGM Results Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['EXECUTIVE SUMMARY'],
      [''],
      ['Metric', 'Value'],
      ['Report Date', new Date().toLocaleDateString()],
      ['AGM Status', reportData.agmSession.status.toUpperCase()],
      ['AGM Duration', reportData.agmSession.duration || 'N/A'],
      ['Total Registered Voters', reportData.totalUsers],
      ['Total Votes Cast', reportData.totalVotesCast],
      ['Voter Turnout', `${((reportData.totalVotesCast / reportData.totalUsers) * 100).toFixed(1)}%`],
      ['Candidate Votes', reportData.candidates.reduce((sum, c) => sum + c.voteCount, 0)],
      ['Resolution Votes', reportData.resolutions.reduce((sum, r) => sum + r.yesVotes + r.noVotes + r.abstainVotes, 0)]
    ];

    if (reportData.quorumStatus) {
      summaryData.push(
        [''],
        ['QUORUM STATUS'],
        ['Required', `${reportData.quorumStatus.required}%`],
        ['Achieved', `${reportData.quorumStatus.percentage.toFixed(1)}%`],
        ['Status', reportData.quorumStatus.met ? 'MET' : 'NOT MET']
      );
    }

    if (reportData.attendance) {
      summaryData.push(
        [''],
        ['ATTENDANCE'],
        ['Checked In', reportData.attendance.checkedIn],
        ['Total Expected', reportData.attendance.total],
        ['Attendance Rate', `${reportData.attendance.percentage.toFixed(1)}%`]
      );
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // ========== SHEET 2: CANDIDATE RESULTS ==========
    const totalCandidateVotes = reportData.candidates.reduce((sum, c) => sum + c.voteCount, 0);
    
    const candidateData = [
      ['CANDIDATE VOTING RESULTS'],
      [''],
      ['Rank', 'Candidate Name', 'Department', 'Position', 'Votes Received', 'Percentage', 'Vote Share'],
      ...reportData.candidates
        .sort((a, b) => b.voteCount - a.voteCount)
        .map((candidate, index) => [
          index + 1,
          candidate.name,
          candidate.department || 'N/A',
          candidate.position || 'N/A',
          candidate.voteCount,
          totalCandidateVotes > 0 
            ? ((candidate.voteCount / totalCandidateVotes) * 100).toFixed(1) + '%'
            : '0%',
          totalCandidateVotes > 0
            ? (candidate.voteCount / totalCandidateVotes).toFixed(4)
            : '0'
        ]),
      [''],
      ['Total Candidate Votes', totalCandidateVotes]
    ];

    const candidateSheet = XLSX.utils.aoa_to_sheet(candidateData);
    candidateSheet['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, candidateSheet, 'Candidate Results');

    // ========== SHEET 3: RESOLUTION RESULTS ==========
    const resolutionData = [
      ['RESOLUTION VOTING RESULTS'],
      [''],
      ['#', 'Resolution Title', 'Yes Votes', 'Yes %', 'No Votes', 'No %', 'Abstain', 'Abstain %', 'Total Votes', 'Result', 'Status'],
      ...reportData.resolutions.map((resolution, index) => {
        const totalVotes = resolution.yesVotes + resolution.noVotes + resolution.abstainVotes;
        const yesPercentage = totalVotes > 0 ? ((resolution.yesVotes / totalVotes) * 100).toFixed(1) : '0';
        const noPercentage = totalVotes > 0 ? ((resolution.noVotes / totalVotes) * 100).toFixed(1) : '0';
        const abstainPercentage = totalVotes > 0 ? ((resolution.abstainVotes / totalVotes) * 100).toFixed(1) : '0';
        const passed = resolution.yesVotes > resolution.noVotes;
        
        return [
          index + 1,
          resolution.title,
          resolution.yesVotes,
          yesPercentage + '%',
          resolution.noVotes,
          noPercentage + '%',
          resolution.abstainVotes,
          abstainPercentage + '%',
          totalVotes,
          passed ? 'PASSED' : 'FAILED',
          resolution.status
        ];
      }),
      [''],
      ['Total Resolution Votes', reportData.resolutions.reduce((sum, r) => sum + r.yesVotes + r.noVotes + r.abstainVotes, 0)]
    ];

    const resolutionSheet = XLSX.utils.aoa_to_sheet(resolutionData);
    resolutionSheet['!cols'] = [
      { wch: 5 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, resolutionSheet, 'Resolution Results');

    // ========== SHEET 4: RESOLUTION DETAILS ==========
    const resolutionDetailsData = [
      ['RESOLUTION DETAILED BREAKDOWN'],
      [''],
      ['Resolution #', 'Title', 'Description', 'Category', 'Voting Requirement', 'Yes', 'No', 'Abstain', 'Total', 'Result']
    ];

    reportData.resolutions.forEach((resolution, index) => {
      const totalVotes = resolution.yesVotes + resolution.noVotes + resolution.abstainVotes;
      const passed = resolution.yesVotes > resolution.noVotes;
      
      resolutionDetailsData.push([
        (index + 1).toString(),
        resolution.title,
        resolution.description || 'No description provided',
        resolution.category || 'General',
        resolution.votingRequirement || 'Simple Majority',
        resolution.yesVotes.toString(),
        resolution.noVotes.toString(),
        resolution.abstainVotes.toString(),
        totalVotes.toString(),
        passed ? 'PASSED' : 'FAILED'
      ]);
    });

    const detailsSheet = XLSX.utils.aoa_to_sheet(resolutionDetailsData);
    detailsSheet['!cols'] = [
      { wch: 12 },
      { wch: 35 },
      { wch: 50 },
      { wch: 15 },
      { wch: 20 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Resolution Details');

    // ========== SHEET 5: AUDIT TRAIL (if provided) ==========
    if (reportData.auditLogs && reportData.auditLogs.length > 0) {
      const auditData = [
        ['AUDIT TRAIL'],
        [''],
        ['Timestamp', 'Action', 'User', 'Details', 'IP Address'],
        ...reportData.auditLogs.map(log => [
          log.timestamp,
          log.action,
          log.userName || 'System',
          log.details || log.description || '',
          log.ipAddress || 'N/A'
        ])
      ];

      const auditSheet = XLSX.utils.aoa_to_sheet(auditData);
      auditSheet['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 25 },
        { wch: 40 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, auditSheet, 'Audit Trail');
    }

    // Save the Excel file
    const filename = `AGM_Results_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Generate Quick Summary Report (Single Page PDF)
   */
  generateQuickSummaryPDF(reportData: ReportData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFillColor(0, 114, 206);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AGM Results - Quick Summary', pageWidth / 2, 18, { align: 'center' });

    // Content
    yPosition = 45;
    doc.setTextColor(70, 75, 75);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Voting Summary', 20, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const lines = [
      `Total Voters: ${reportData.totalUsers}`,
      `Votes Cast: ${reportData.totalVotesCast} (${((reportData.totalVotesCast / reportData.totalUsers) * 100).toFixed(1)}%)`,
      `Candidates Voted: ${reportData.candidates.length}`,
      `Resolutions Voted: ${reportData.resolutions.length}`,
      ``,
      `Top Candidate: ${reportData.candidates.sort((a, b) => b.voteCount - a.voteCount)[0]?.name || 'N/A'}`,
      `Resolutions Passed: ${reportData.resolutions.filter(r => r.yesVotes > r.noVotes).length} / ${reportData.resolutions.length}`
    ];

    lines.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });

    const filename = `AGM_Quick_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }
}

export const reportService = new ReportService();
export default reportService;

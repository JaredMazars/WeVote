// Meeting Minutes Generator Service
// Auto-generates legal meeting minutes with PDF export

export interface MeetingMinutes {
  meetingId: string;
  meetingTitle: string;
  meetingType: 'AGM' | 'Board' | 'Special' | 'Committee';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  
  // Attendance
  attendees: Array<{
    name: string;
    role: string;
    checkedInAt: string;
    leftAt?: string;
  }>;
  absentees: string[];
  quorumStatus: {
    required: number;
    present: number;
    met: boolean;
  };
  
  // Meeting content
  chairperson: string;
  secretary: string;
  agenda: string[];
  resolutions: Array<{
    id: string;
    title: string;
    description: string;
    proposedBy: string;
    secondedBy?: string;
    votes: {
      for: number;
      against: number;
      abstain: number;
    };
    outcome: 'PASSED' | 'REJECTED' | 'DEFERRED';
    remarks?: string;
  }>;
  
  // Additional sections
  discussions: Array<{
    topic: string;
    summary: string;
    speaker?: string;
  }>;
  questionsAnswered: Array<{
    question: string;
    answer: string;
    askedBy: string;
    answeredBy: string;
  }>;
  
  nextMeetingDate?: string;
  adjournmentTime: string;
  
  // Signatures
  minutesApprovedBy?: string;
  minutesApprovedDate?: string;
  generatedAt: string;
}

class MinutesService {
  private readonly STORAGE_KEY = 'meetingMinutes';

  /**
   * Generate meeting minutes from meeting data
   */
  generateMinutes(meetingId: string): MeetingMinutes {
    const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    const meeting = meetings.find((m: any) => m.id === meetingId);
    
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Get resolutions
    const resolutions = JSON.parse(localStorage.getItem('resolutions') || '[]');
    const meetingResolutions = resolutions.filter((r: any) => r.meetingId === meetingId);

    // Get Q&A data
    const qaData = JSON.parse(localStorage.getItem('liveQA') || '[]');
    const meetingQA = qaData.filter((q: any) => q.meetingId === meetingId);

    // Get quorum status
    const quorumStatus = JSON.parse(localStorage.getItem('quorumStatus') || '{}')[meetingId] || {
      required: 0,
      present: meeting.attendees?.length || 0,
      met: true
    };

    const minutes: MeetingMinutes = {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingType: meeting.type || 'AGM',
      date: new Date(meeting.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      startTime: new Date(meeting.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      endTime: meeting.endTime ? new Date(meeting.endTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'In Progress',
      location: meeting.location,
      
      attendees: (meeting.attendees || []).map((a: any) => ({
        name: a.userName,
        role: a.role || 'Member',
        checkedInAt: new Date(a.checkedInAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        leftAt: a.leftAt ? new Date(a.leftAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined
      })),
      
      absentees: meeting.expectedAttendees?.filter((e: string) => 
        !meeting.attendees?.some((a: any) => a.userName === e)
      ) || [],
      
      quorumStatus,
      
      chairperson: meeting.chairperson || 'To be determined',
      secretary: meeting.secretary || 'Corporate Secretary',
      
      agenda: meeting.agenda || [
        'Call to Order',
        'Verification of Quorum',
        'Reading and Approval of Previous Minutes',
        'Resolutions and Voting',
        'Question and Answer Session',
        'Any Other Business',
        'Adjournment'
      ],
      
      resolutions: meetingResolutions.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        proposedBy: r.proposedBy || 'Board of Directors',
        secondedBy: r.secondedBy,
        votes: {
          for: r.votesFor || 0,
          against: r.votesAgainst || 0,
          abstain: r.votesAbstain || 0
        },
        outcome: this.determineOutcome(r),
        remarks: r.remarks
      })),
      
      discussions: meeting.discussions || [],
      
      questionsAnswered: meetingQA
        .filter((q: any) => q.answer)
        .map((q: any) => ({
          question: q.question,
          answer: q.answer,
          askedBy: q.askedBy,
          answeredBy: q.answeredBy || 'Moderator'
        })),
      
      nextMeetingDate: meeting.nextMeetingDate,
      adjournmentTime: meeting.endTime ? new Date(meeting.endTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'To be announced',
      
      generatedAt: new Date().toISOString()
    };

    // Save minutes
    this.saveMinutes(minutes);

    return minutes;
  }

  /**
   * Determine resolution outcome
   */
  private determineOutcome(resolution: any): 'PASSED' | 'REJECTED' | 'DEFERRED' {
    const forVotes = resolution.votesFor || 0;
    const againstVotes = resolution.votesAgainst || 0;
    
    if (resolution.status === 'deferred') return 'DEFERRED';
    if (forVotes > againstVotes) return 'PASSED';
    return 'REJECTED';
  }

  /**
   * Save minutes to localStorage
   */
  saveMinutes(minutes: MeetingMinutes): void {
    const allMinutes = this.getAllMinutes();
    allMinutes[minutes.meetingId] = minutes;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMinutes));
  }

  /**
   * Get all meeting minutes
   */
  getAllMinutes(): Record<string, MeetingMinutes> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Get minutes for a specific meeting
   */
  getMinutes(meetingId: string): MeetingMinutes | null {
    const allMinutes = this.getAllMinutes();
    return allMinutes[meetingId] || null;
  }

  /**
   * Format minutes as HTML
   */
  formatAsHTML(minutes: MeetingMinutes): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Meeting Minutes - ${minutes.meetingTitle}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #0072CE;
      border-bottom: 3px solid #171C8F;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #171C8F;
      margin-top: 30px;
      margin-bottom: 15px;
      border-left: 4px solid #0072CE;
      padding-left: 15px;
    }
    h3 {
      color: #464B4B;
      margin-top: 20px;
    }
    .header-info {
      background: #F4F4F4;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header-info p {
      margin: 8px 0;
    }
    .quorum-status {
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .quorum-met {
      background: #d4edda;
      border: 2px solid #28a745;
      color: #155724;
    }
    .quorum-not-met {
      background: #f8d7da;
      border: 2px solid #dc3545;
      color: #721c24;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #0072CE;
      color: white;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .resolution {
      background: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #0072CE;
      margin: 15px 0;
    }
    .passed {
      border-left-color: #28a745;
    }
    .rejected {
      border-left-color: #dc3545;
    }
    .deferred {
      border-left-color: #ffc107;
    }
    .signature-block {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-line {
      border-top: 2px solid #333;
      width: 300px;
      padding-top: 10px;
      margin-top: 40px;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 0.9em;
    }
    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <h1>MINUTES OF ${minutes.meetingType.toUpperCase()}</h1>
  
  <div class="header-info">
    <p><strong>Meeting:</strong> ${minutes.meetingTitle}</p>
    <p><strong>Date:</strong> ${minutes.date}</p>
    <p><strong>Time:</strong> ${minutes.startTime} - ${minutes.adjournmentTime}</p>
    <p><strong>Location:</strong> ${minutes.location}</p>
    <p><strong>Chairperson:</strong> ${minutes.chairperson}</p>
    <p><strong>Secretary:</strong> ${minutes.secretary}</p>
  </div>

  <h2>1. QUORUM VERIFICATION</h2>
  <div class="quorum-status ${minutes.quorumStatus.met ? 'quorum-met' : 'quorum-not-met'}">
    ✓ Quorum ${minutes.quorumStatus.met ? 'MET' : 'NOT MET'}: 
    ${minutes.quorumStatus.present} present of ${minutes.quorumStatus.required} required
  </div>

  <h2>2. ATTENDANCE</h2>
  <h3>Present (${minutes.attendees.length}):</h3>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Checked In At</th>
      </tr>
    </thead>
    <tbody>
      ${minutes.attendees.map(a => `
        <tr>
          <td>${a.name}</td>
          <td>${a.role}</td>
          <td>${a.checkedInAt}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${minutes.absentees.length > 0 ? `
    <h3>Absent (${minutes.absentees.length}):</h3>
    <ul>
      ${minutes.absentees.map(name => `<li>${name}</li>`).join('')}
    </ul>
  ` : ''}

  <h2>3. AGENDA</h2>
  <ol>
    ${minutes.agenda.map(item => `<li>${item}</li>`).join('')}
  </ol>

  <h2>4. RESOLUTIONS & VOTING RESULTS</h2>
  ${minutes.resolutions.map((r, i) => `
    <div class="resolution ${r.outcome.toLowerCase()}">
      <h3>Resolution ${i + 1}: ${r.title}</h3>
      <p><strong>Description:</strong> ${r.description}</p>
      <p><strong>Proposed by:</strong> ${r.proposedBy}</p>
      ${r.secondedBy ? `<p><strong>Seconded by:</strong> ${r.secondedBy}</p>` : ''}
      
      <table style="width: auto; min-width: 400px;">
        <tr>
          <th>For</th>
          <th>Against</th>
          <th>Abstain</th>
          <th>Outcome</th>
        </tr>
        <tr>
          <td>${r.votes.for}</td>
          <td>${r.votes.against}</td>
          <td>${r.votes.abstain}</td>
          <td><strong>${r.outcome}</strong></td>
        </tr>
      </table>
      
      ${r.remarks ? `<p><em>Remarks: ${r.remarks}</em></p>` : ''}
    </div>
  `).join('')}

  ${minutes.questionsAnswered.length > 0 ? `
    <h2>5. QUESTIONS & ANSWERS</h2>
    ${minutes.questionsAnswered.map((qa, i) => `
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
        <p><strong>Q${i + 1} (${qa.askedBy}):</strong> ${qa.question}</p>
        <p><strong>A (${qa.answeredBy}):</strong> ${qa.answer}</p>
      </div>
    `).join('')}
  ` : ''}

  <h2>6. ADJOURNMENT</h2>
  <p>The meeting was adjourned at ${minutes.adjournmentTime}.</p>
  ${minutes.nextMeetingDate ? `<p><strong>Next Meeting:</strong> ${minutes.nextMeetingDate}</p>` : ''}

  <div class="signature-block">
    <div>
      <div class="signature-line">
        <p><strong>${minutes.chairperson}</strong></p>
        <p>Chairperson</p>
      </div>
    </div>
    <div>
      <div class="signature-line">
        <p><strong>${minutes.secretary}</strong></p>
        <p>Secretary</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Generated by WeVote Platform - Forvis Mazars</p>
    <p>Generated on ${new Date(minutes.generatedAt).toLocaleString()}</p>
    <p><em>These minutes are subject to approval at the next meeting.</em></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Export minutes as downloadable HTML file
   */
  exportAsHTML(meetingId: string): void {
    const minutes = this.getMinutes(meetingId);
    if (!minutes) {
      throw new Error('Minutes not found');
    }

    const html = this.formatAsHTML(minutes);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Minutes_${minutes.meetingTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Print minutes
   */
  printMinutes(meetingId: string): void {
    const minutes = this.getMinutes(meetingId);
    if (!minutes) {
      throw new Error('Minutes not found');
    }

    const html = this.formatAsHTML(minutes);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  /**
   * Approve minutes
   */
  approveMinutes(meetingId: string, approvedBy: string): void {
    const minutes = this.getMinutes(meetingId);
    if (!minutes) {
      throw new Error('Minutes not found');
    }

    minutes.minutesApprovedBy = approvedBy;
    minutes.minutesApprovedDate = new Date().toISOString();
    this.saveMinutes(minutes);
  }
}

export const minutesService = new MinutesService();

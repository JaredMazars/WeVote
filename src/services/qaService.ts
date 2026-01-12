/**
 * Live Q&A Service
 * Real-time question submission and moderation for AGM
 */

export interface Question {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  question: string;
  category: 'financial' | 'governance' | 'operations' | 'general' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'answered' | 'archived';
  priority: 'low' | 'medium' | 'high';
  upvotes: number;
  upvotedBy: string[];
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  submittedAt: string;
  moderatorNotes?: string;
}

export interface QAStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  answered: number;
  byCategory: Record<string, number>;
  averageUpvotes: number;
  topQuestions: Question[];
}

class QAService {
  private readonly STORAGE_KEY = 'qaQuestions';

  /**
   * Get all questions
   */
  getAllQuestions(): Question[] {
    const questions = localStorage.getItem(this.STORAGE_KEY);
    return questions ? JSON.parse(questions) : this.getDummyQuestions();
  }

  /**
   * Get questions by meeting
   */
  getQuestionsByMeeting(meetingId: string): Question[] {
    return this.getAllQuestions().filter(q => q.meetingId === meetingId);
  }

  /**
   * Get question by ID
   */
  getQuestionById(id: string): Question | null {
    return this.getAllQuestions().find(q => q.id === id) || null;
  }

  /**
   * Submit question
   */
  submitQuestion(question: Omit<Question, 'id' | 'status' | 'upvotes' | 'upvotedBy' | 'submittedAt'>): Question {
    const newQuestion: Question = {
      ...question,
      id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: 'pending',
      upvotes: 0,
      upvotedBy: [],
      submittedAt: new Date().toISOString(),
    };

    const questions = this.getAllQuestions();
    questions.push(newQuestion);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));

    window.dispatchEvent(new CustomEvent('questionSubmitted', { detail: newQuestion }));
    return newQuestion;
  }

  /**
   * Update question status (moderation)
   */
  updateQuestionStatus(id: string, status: Question['status'], moderatorNotes?: string): Question | null {
    const questions = this.getAllQuestions();
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) return null;

    questions[index].status = status;
    if (moderatorNotes) {
      questions[index].moderatorNotes = moderatorNotes;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));
    window.dispatchEvent(new CustomEvent('questionStatusUpdated', { detail: questions[index] }));

    return questions[index];
  }

  /**
   * Answer question
   */
  answerQuestion(id: string, answer: string, answeredBy: string): Question | null {
    const questions = this.getAllQuestions();
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) return null;

    questions[index].answer = answer;
    questions[index].answeredBy = answeredBy;
    questions[index].answeredAt = new Date().toISOString();
    questions[index].status = 'answered';

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));
    window.dispatchEvent(new CustomEvent('questionAnswered', { detail: questions[index] }));

    return questions[index];
  }

  /**
   * Upvote question
   */
  upvoteQuestion(id: string, userId: string): Question | null {
    const questions = this.getAllQuestions();
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) return null;

    // Check if user already upvoted
    if (questions[index].upvotedBy.includes(userId)) {
      // Remove upvote
      questions[index].upvotedBy = questions[index].upvotedBy.filter(uid => uid !== userId);
      questions[index].upvotes--;
    } else {
      // Add upvote
      questions[index].upvotedBy.push(userId);
      questions[index].upvotes++;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));
    window.dispatchEvent(new CustomEvent('questionUpvoted', { detail: questions[index] }));

    return questions[index];
  }

  /**
   * Set question priority
   */
  setPriority(id: string, priority: Question['priority']): Question | null {
    const questions = this.getAllQuestions();
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) return null;

    questions[index].priority = priority;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));

    return questions[index];
  }

  /**
   * Get Q&A statistics
   */
  getQAStats(meetingId?: string): QAStats {
    let questions = this.getAllQuestions();
    
    if (meetingId) {
      questions = questions.filter(q => q.meetingId === meetingId);
    }

    const byCategory: Record<string, number> = {};
    questions.forEach(q => {
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    });

    const totalUpvotes = questions.reduce((sum, q) => sum + q.upvotes, 0);
    const topQuestions = questions
      .filter(q => q.status === 'approved' || q.status === 'answered')
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 10);

    return {
      total: questions.length,
      pending: questions.filter(q => q.status === 'pending').length,
      approved: questions.filter(q => q.status === 'approved').length,
      rejected: questions.filter(q => q.status === 'rejected').length,
      answered: questions.filter(q => q.status === 'answered').length,
      byCategory,
      averageUpvotes: questions.length > 0 ? totalUpvotes / questions.length : 0,
      topQuestions,
    };
  }

  /**
   * Get pending questions for moderation
   */
  getPendingQuestions(meetingId?: string): Question[] {
    let questions = this.getAllQuestions().filter(q => q.status === 'pending');
    
    if (meetingId) {
      questions = questions.filter(q => q.meetingId === meetingId);
    }

    return questions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Get approved questions for display
   */
  getApprovedQuestions(meetingId?: string): Question[] {
    let questions = this.getAllQuestions().filter(q => 
      q.status === 'approved' || q.status === 'answered'
    );
    
    if (meetingId) {
      questions = questions.filter(q => q.meetingId === meetingId);
    }

    // Sort by priority (high first), then upvotes (most first)
    return questions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.upvotes - a.upvotes;
    });
  }

  /**
   * Get dummy questions for testing
   */
  private getDummyQuestions(): Question[] {
    return [
      {
        id: 'Q-001',
        meetingId: 'MTG-001',
        userId: '3',
        userName: 'Michael Chen',
        userEmail: 'michael@company.com',
        question: 'Can you provide more details on the revenue growth projections for Q1 2026?',
        category: 'financial',
        status: 'approved',
        priority: 'high',
        upvotes: 15,
        upvotedBy: ['1', '2', '4', '5', '6'],
        submittedAt: '2025-12-07T10:30:00Z',
      },
      {
        id: 'Q-002',
        meetingId: 'MTG-001',
        userId: '4',
        userName: 'Emily Davis',
        userEmail: 'emily@company.com',
        question: 'What is the company\'s strategy for sustainability and ESG compliance?',
        category: 'governance',
        status: 'answered',
        priority: 'medium',
        upvotes: 12,
        upvotedBy: ['2', '3', '5'],
        answer: 'We have implemented a comprehensive ESG framework focusing on carbon neutrality by 2030, ethical supply chain management, and diverse board representation. Full details are in our Sustainability Report 2025.',
        answeredBy: 'John Smith - CEO',
        answeredAt: '2025-12-07T11:15:00Z',
        submittedAt: '2025-12-07T10:45:00Z',
      },
      {
        id: 'Q-003',
        meetingId: 'MTG-001',
        userId: '5',
        userName: 'Robert Taylor',
        userEmail: 'robert@company.com',
        question: 'How will the new board members impact the company\'s digital transformation initiatives?',
        category: 'operations',
        status: 'pending',
        priority: 'medium',
        upvotes: 8,
        upvotedBy: ['1', '3', '4'],
        submittedAt: '2025-12-07T11:00:00Z',
      },
      {
        id: 'Q-004',
        meetingId: 'MTG-001',
        userId: '6',
        userName: 'Lisa Anderson',
        userEmail: 'lisa@company.com',
        question: 'What measures are in place to protect shareholder value during the proposed merger?',
        category: 'financial',
        status: 'approved',
        priority: 'high',
        upvotes: 20,
        upvotedBy: ['1', '2', '3', '4', '5'],
        submittedAt: '2025-12-07T11:20:00Z',
      },
      {
        id: 'Q-005',
        meetingId: 'MTG-001',
        userId: '7',
        userName: 'David Wilson',
        userEmail: 'david@company.com',
        question: 'Can you clarify the voting process for the special resolutions?',
        category: 'general',
        status: 'answered',
        priority: 'low',
        upvotes: 5,
        upvotedBy: ['3', '5'],
        answer: 'Special resolutions require a 75% majority vote. All eligible shareholders can vote directly or through proxy. Voting will be open for 2 hours during the designated session.',
        answeredBy: 'Election Committee',
        answeredAt: '2025-12-07T11:30:00Z',
        submittedAt: '2025-12-07T11:25:00Z',
      },
    ];
  }

  /**
   * Export questions to JSON
   */
  exportQuestions(meetingId?: string): string {
    const questions = meetingId ? 
      this.getQuestionsByMeeting(meetingId) : 
      this.getAllQuestions();

    const data = {
      exportedAt: new Date().toISOString(),
      meetingId: meetingId || 'all',
      totalQuestions: questions.length,
      questions,
      statistics: this.getQAStats(meetingId),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all questions (testing only)
   */
  clearQuestions(): void {
    if (confirm('⚠️ WARNING: This will delete all Q&A data. Continue?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      alert('✅ All questions cleared');
    }
  }
}

export const qaService = new QAService();

/**
 * Analytics Service
 * Advanced analytics and insights for voting patterns and engagement
 */

export interface VotingAnalytics {
  overview: {
    totalVotes: number;
    totalVoters: number;
    participationRate: number;
    proxyVotes: number;
    directVotes: number;
    averageVotesPerVoter: number;
  };
  trends: {
    date: string;
    votes: number;
    voters: number;
  }[];
  candidateAnalytics: {
    candidateId: string;
    candidateName: string;
    totalVotes: number;
    percentage: number;
    directVotes: number;
    proxyVotes: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  resolutionAnalytics: {
    resolutionId: string;
    resolutionTitle: string;
    yes: number;
    no: number;
    abstain: number;
    yesPercentage: number;
    passed: boolean;
  }[];
  proxyAnalytics: {
    totalProxies: number;
    discretionary: number;
    instructional: number;
    averageVotesPerProxy: number;
    topProxyHolders: {
      name: string;
      votesHeld: number;
    }[];
  };
  engagement: {
    peakVotingTime: string;
    averageVotingDuration: number;
    mobileVsDesktop: {
      mobile: number;
      desktop: number;
    };
    returnVoters: number;
    newVoters: number;
  };
  demographic: {
    byDepartment: Record<string, number>;
    byRole: Record<string, number>;
    byTenure: Record<string, number>;
  };
}

class AnalyticsService {
  /**
   * Get comprehensive voting analytics
   */
  getVotingAnalytics(): VotingAnalytics {
    // In real implementation, this would aggregate from actual voting data
    // For now, return dummy analytics data
    return this.getDummyAnalytics();
  }

  /**
   * Get participation trends over time
   */
  getParticipationTrends(days: number = 30): { date: string; rate: number }[] {
    const trends: { date: string; rate: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate dummy participation rate (50-95%)
      const rate = 50 + Math.random() * 45;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        rate: Math.round(rate * 10) / 10,
      });
    }

    return trends;
  }

  /**
   * Get voting patterns by time of day
   */
  getVotingByHour(): { hour: number; votes: number }[] {
    const hourly: { hour: number; votes: number }[] = [];

    for (let hour = 0; hour < 24; hour++) {
      // Simulate voting patterns (more votes during business hours)
      let votes = Math.random() * 20;
      if (hour >= 9 && hour <= 17) {
        votes = 50 + Math.random() * 100;
      }
      
      hourly.push({
        hour,
        votes: Math.round(votes),
      });
    }

    return hourly;
  }

  /**
   * Get proxy utilization analytics
   */
  getProxyUtilization(): {
    utilized: number;
    unused: number;
    utilizationRate: number;
  } {
    // Dummy data
    const utilized = 45;
    const unused = 15;
    const total = utilized + unused;

    return {
      utilized,
      unused,
      utilizationRate: Math.round((utilized / total) * 100 * 10) / 10,
    };
  }

  /**
   * Get engagement score
   */
  getEngagementScore(): {
    score: number;
    factors: {
      participation: number;
      proxyUsage: number;
      qaActivity: number;
      documentViews: number;
      overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    };
  } {
    const participation = 85;
    const proxyUsage = 75;
    const qaActivity = 60;
    const documentViews = 70;

    const score = Math.round((participation + proxyUsage + qaActivity + documentViews) / 4);

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) overallHealth = 'excellent';
    else if (score >= 70) overallHealth = 'good';
    else if (score >= 60) overallHealth = 'fair';
    else overallHealth = 'poor';

    return {
      score,
      factors: {
        participation,
        proxyUsage,
        qaActivity,
        documentViews,
        overallHealth,
      },
    };
  }

  /**
   * Get comparative analytics
   */
  getComparativeAnalytics(): {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }[] {
    return [
      {
        current: 85,
        previous: 78,
        change: 8.97,
        trend: 'up',
      },
      {
        current: 234,
        previous: 198,
        change: 18.18,
        trend: 'up',
      },
      {
        current: 67,
        previous: 72,
        change: -6.94,
        trend: 'down',
      },
    ];
  }

  /**
   * Export analytics to JSON
   */
  exportAnalytics(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      votingAnalytics: this.getVotingAnalytics(),
      participationTrends: this.getParticipationTrends(30),
      votingByHour: this.getVotingByHour(),
      proxyUtilization: this.getProxyUtilization(),
      engagementScore: this.getEngagementScore(),
      comparativeAnalytics: this.getComparativeAnalytics(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Get dummy analytics data
   */
  private getDummyAnalytics(): VotingAnalytics {
    return {
      overview: {
        totalVotes: 456,
        totalVoters: 234,
        participationRate: 85.3,
        proxyVotes: 123,
        directVotes: 333,
        averageVotesPerVoter: 1.95,
      },
      trends: [
        { date: '2025-12-01', votes: 45, voters: 23 },
        { date: '2025-12-02', votes: 78, voters: 39 },
        { date: '2025-12-03', votes: 92, voters: 46 },
        { date: '2025-12-04', votes: 67, voters: 34 },
        { date: '2025-12-05', votes: 103, voters: 52 },
        { date: '2025-12-06', votes: 71, voters: 36 },
        { date: '2025-12-07', votes: 0, voters: 4 },
      ],
      candidateAnalytics: [
        {
          candidateId: '1',
          candidateName: 'Sarah Johnson',
          totalVotes: 156,
          percentage: 45.2,
          directVotes: 112,
          proxyVotes: 44,
          trend: 'increasing',
        },
        {
          candidateId: '2',
          candidateName: 'Michael Chen',
          totalVotes: 134,
          percentage: 38.8,
          directVotes: 95,
          proxyVotes: 39,
          trend: 'stable',
        },
        {
          candidateId: '3',
          candidateName: 'Emily Davis',
          totalVotes: 55,
          percentage: 16.0,
          directVotes: 38,
          proxyVotes: 17,
          trend: 'decreasing',
        },
      ],
      resolutionAnalytics: [
        {
          resolutionId: '1',
          resolutionTitle: 'Approve FY2026 Budget',
          yes: 189,
          no: 34,
          abstain: 11,
          yesPercentage: 80.8,
          passed: true,
        },
        {
          resolutionId: '2',
          resolutionTitle: 'Amendment to Bylaws',
          yes: 167,
          no: 56,
          abstain: 11,
          yesPercentage: 71.4,
          passed: false, // Requires 75%
        },
        {
          resolutionId: '3',
          resolutionTitle: 'Employee Stock Option Plan',
          yes: 198,
          no: 23,
          abstain: 13,
          yesPercentage: 84.6,
          passed: true,
        },
      ],
      proxyAnalytics: {
        totalProxies: 67,
        discretionary: 38,
        instructional: 29,
        averageVotesPerProxy: 4.2,
        topProxyHolders: [
          { name: 'John Smith', votesHeld: 23 },
          { name: 'Sarah Johnson', votesHeld: 18 },
          { name: 'Michael Chen', votesHeld: 15 },
          { name: 'Emily Davis', votesHeld: 11 },
        ],
      },
      engagement: {
        peakVotingTime: '14:00 - 15:00',
        averageVotingDuration: 3.5, // minutes
        mobileVsDesktop: {
          mobile: 42,
          desktop: 58,
        },
        returnVoters: 187,
        newVoters: 47,
      },
      demographic: {
        byDepartment: {
          Engineering: 89,
          Sales: 67,
          Marketing: 45,
          HR: 23,
          Finance: 34,
          Operations: 56,
        },
        byRole: {
          Employee: 156,
          Manager: 45,
          Director: 23,
          'VP/C-Level': 10,
        },
        byTenure: {
          '0-1 years': 34,
          '1-3 years': 78,
          '3-5 years': 67,
          '5+ years': 55,
        },
      },
    };
  }
}

export const analyticsService = new AnalyticsService();

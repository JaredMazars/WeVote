/**
 * Proxy Voting System - Core Logic
 * Mock data implementation for testing vote weight calculations and proxy logic
 */

// ============================
// MOCK DATA STRUCTURES
// ============================

export interface MockUser {
  id: number;
  name: string;
  email: string;
  has_proxy: boolean;
  proxy_assignee_id: number | null;
  member_number?: string;
  vote_weight?: number;
  allowed_candidates?: string[];
  appointment_type?: 'discretional' | 'instructional';
}

export interface MockMotion {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'pending' | 'closed';
}

export interface MockAGM {
  id: number;
  title: string;
  status: 'active' | 'pending' | 'closed';
  motions: MockMotion[];
}

export interface MockVote {
  id: number;
  user_id: number;
  motion_id: number;
  vote_value: 'Yes' | 'No' | 'Abstain';
  is_proxy_vote: boolean;
  proxy_count: number;
  proxy_assignees: { id: number; name: string; voteWeight?: number }[];
  vote_weight: number;
  voted_at: string;
  candidate_id?: string; // For candidate voting
  split_vote?: boolean; // True if proxy holder selected specific proxies
  selected_proxy_ids?: number[]; // IDs of proxies used for this vote
}

// Mock Users Data
export let mockUsers: MockUser[] = [
  {
    id: 1,
    name: "Demo User",
    email: "demo@wevote.com",
    has_proxy: false,
    proxy_assignee_id: null,
    member_number: "MEM001",
    vote_weight: 1,
    appointment_type: 'discretional'
  },
  {
    id: 2,
    name: "Shane Johnson",
    email: "shane@wevote.com",
    has_proxy: true,
    proxy_assignee_id: 1, // Assigned to demo@wevote.com
    member_number: "MEM002",
    vote_weight: 2
  },
  {
    id: 3,
    name: "Bob Williams",
    email: "bob@wevote.com",
    has_proxy: true,
    proxy_assignee_id: 1, // Assigned to demo@wevote.com
    member_number: "MEM003",
    vote_weight: 3
  },
  {
    id: 4,
    name: "Mary Davis",
    email: "mary@wevote.com",
    has_proxy: true,
    proxy_assignee_id: 1, // Assigned to demo@wevote.com
    member_number: "MEM004",
    vote_weight: 5
  }
];

// Mock AGM Data
export const mockAGM: MockAGM = {
  id: 1,
  title: "Annual General Meeting 2025",
  status: "active",
  motions: [
    {
      id: 101,
      title: "Approve 2025 Budget",
      description: "Vote to approve the proposed budget for fiscal year 2025",
      status: "active"
    },
    {
      id: 102,
      title: "Elect New Board Member",
      description: "Vote for Jane Doe as new board member",
      status: "active"
    },
    {
      id: 103,
      title: "Update Company Bylaws",
      description: "Vote to approve amendments to company bylaws",
      status: "pending"
    }
  ]
};

// Mock Votes Array (initially empty)
export let mockVotes: MockVote[] = [];

// ============================
// CORE FUNCTIONS
// ============================

/**
 * Returns all users who assigned this user as their proxy
 */
export function getProxyAssignees(userId: number): MockUser[] {
  return mockUsers.filter(user => 
    user.proxy_assignee_id === userId && 
    user.has_proxy === true
  );
}

/**
 * Calculates total vote weight for a user (their vote + proxy votes)
 */
export function calculateVoteWeight(userId: number) {
  const user = mockUsers.find(u => u.id === userId);
  const proxyAssignees = getProxyAssignees(userId);
  
  // If user not in mock data, they are a real user - return default weight
  if (!user) {
    return {
      ownVote: 1,
      proxyCount: 0,
      proxyVoteWeight: 0,
      totalWeight: 1,
      proxyAssignees: []
    };
  }
  
  // Calculate total proxy vote weight (sum of all assignees' vote weights)
  const proxyVoteWeight = proxyAssignees.reduce((sum, assignee) => {
    return sum + (assignee.vote_weight || 1);
  }, 0);
  
  const ownVoteWeight = user?.vote_weight || 1;
  
  return {
    ownVote: ownVoteWeight,
    proxyCount: proxyAssignees.length,
    proxyVoteWeight: proxyVoteWeight,
    totalWeight: ownVoteWeight + proxyVoteWeight,
    proxyAssignees: proxyAssignees.map(u => ({
      id: u.id,
      name: u.name,
      voteWeight: u.vote_weight || 1
    }))
  };
}

/**
 * Checks if a user is eligible to vote on a specific motion
 */
export function checkVoteEligibility(userId: number, motionId: number) {
  const user = mockUsers.find(u => u.id === userId);
  
  // If user is not in mock data, they are a real user from database - allow voting
  if (!user) {
    return {
      canVote: true,
      reason: null
    };
  }
  
  // Rule 1: Check if user already voted themselves
  const hasVoted = mockVotes.some(v => 
    v.user_id === userId && v.motion_id === motionId
  );
  
  if (hasVoted) {
    return {
      canVote: false,
      reason: "You have already voted on this motion"
    };
  }
  
  // Rule 2: If user assigned a proxy, they can still vote
  // Their vote will override any proxy vote made on their behalf
  if (user.proxy_assignee_id !== null) {
    const proxyHolder = mockUsers.find(u => u.id === user.proxy_assignee_id);
    
    // Check if proxy holder already voted on their behalf
    const proxyVoted = mockVotes.some(v => 
      v.user_id === user.proxy_assignee_id && 
      v.motion_id === motionId &&
      v.proxy_assignees.some(p => p.id === userId)
    );
    
    if (proxyVoted) {
      return {
        canVote: true,
        reason: null,
        willOverride: true,
        overrideMessage: `You assigned ${proxyHolder?.name} as your proxy and they already voted. Your vote will override their proxy vote on your behalf.`
      };
    } else {
      return {
        canVote: true,
        reason: null,
        hasProxy: true,
        proxyMessage: `You assigned ${proxyHolder?.name} as your proxy, but you can still vote yourself. Your vote will take precedence.`
      };
    }
  }
  
  // Rule 3: All checks passed
  return {
    canVote: true,
    reason: null
  };
}

/**
 * Records a vote with calculated proxy weight
 * @param userId - The voter's ID
 * @param motionId - The motion/candidate ID
 * @param voteValue - Vote choice
 * @param selectedProxyIds - Optional: Specific proxy IDs to use for split voting
 */
export function castVote(
  userId: number, 
  motionId: number, 
  voteValue: 'Yes' | 'No' | 'Abstain',
  candidateId?: string,
  selectedProxyIds?: number[]
) {
  // Step 1: Check eligibility
  const eligibility = checkVoteEligibility(userId, motionId);
  if (!eligibility.canVote) {
    return {
      success: false,
      message: eligibility.reason || 'Cannot vote',
      data: null
    };
  }
  
  // Step 2: Handle proxy override if applicable
  const user = mockUsers.find(u => u.id === userId);
  if ((eligibility as any).willOverride && user?.proxy_assignee_id) {
    // Find and adjust the proxy holder's vote
    const proxyHolderVote = mockVotes.find(v => 
      v.user_id === user.proxy_assignee_id && 
      v.motion_id === motionId
    );
    
    if (proxyHolderVote) {
      // Remove this user's weight from the proxy vote
      const userWeight = user.vote_weight || 1;
      proxyHolderVote.vote_weight -= userWeight;
      proxyHolderVote.proxy_count -= 1;
      proxyHolderVote.proxy_assignees = proxyHolderVote.proxy_assignees.filter(p => p.id !== userId);
      
      // If proxy vote weight is now 0 or only their own vote, update flag
      if (proxyHolderVote.proxy_count === 0) {
        proxyHolderVote.is_proxy_vote = false;
      }
      
      console.log(`Override: Removed ${userWeight} vote(s) from proxy holder's vote. New weight: ${proxyHolderVote.vote_weight}`);
    }
  }
  
  // Step 3: Calculate vote weight
  const allProxyAssignees = getProxyAssignees(userId);
  let voteWeight: number;
  let proxyAssigneesForVote: { id: number; name: string; voteWeight?: number }[] = [];
  let isSplitVote = false;
  
  // Check if this is a split vote (specific proxies selected)
  if (selectedProxyIds && selectedProxyIds.length > 0) {
    isSplitVote = true;
    // Only use selected proxies
    proxyAssigneesForVote = allProxyAssignees
      .filter(p => selectedProxyIds.includes(p.id))
      .map(u => ({
        id: u.id,
        name: u.name,
        voteWeight: u.vote_weight || 1
      }));
    
    // Calculate weight: own vote + selected proxy votes
    const selectedProxyWeight = proxyAssigneesForVote.reduce((sum, p) => sum + (p.voteWeight || 1), 0);
    voteWeight = (user?.vote_weight || 1) + selectedProxyWeight;
    
    console.log(`Split Vote: Using ${proxyAssigneesForVote.length} of ${allProxyAssignees.length} available proxies`);
  } else if (allProxyAssignees.length > 0) {
    // Use all proxies (standard proxy vote)
    proxyAssigneesForVote = allProxyAssignees.map(u => ({
      id: u.id,
      name: u.name,
      voteWeight: u.vote_weight || 1
    }));
    
    const proxyWeight = proxyAssigneesForVote.reduce((sum, p) => sum + (p.voteWeight || 1), 0);
    voteWeight = (user?.vote_weight || 1) + proxyWeight;
  } else {
    // No proxies, just own vote
    voteWeight = user?.vote_weight || 1;
  }
  
  // Step 4: Create vote record
  const vote: MockVote = {
    id: mockVotes.length + 1,
    user_id: userId,
    motion_id: motionId,
    vote_value: voteValue,
    is_proxy_vote: proxyAssigneesForVote.length > 0,
    proxy_count: proxyAssigneesForVote.length,
    proxy_assignees: proxyAssigneesForVote,
    vote_weight: voteWeight,
    voted_at: new Date().toISOString(),
    candidate_id: candidateId,
    split_vote: isSplitVote,
    selected_proxy_ids: selectedProxyIds || []
  };
  
  // Step 5: Add to votes array
  mockVotes.push(vote);
  
  // Step 6: Return success with appropriate message
  let message = `Vote recorded successfully. Your vote counts as ${voteWeight} vote(s).`;
  if ((eligibility as any).willOverride) {
    message += ' (Your proxy vote was overridden)';
  }
  if (isSplitVote) {
    message += ` (Split vote: ${proxyAssigneesForVote.length} of ${allProxyAssignees.length} proxies used)`;
  }
  
  return {
    success: true,
    message,
    data: vote,
    overridden: (eligibility as any).willOverride || false,
    splitVote: isSplitVote
  };
}

/**
 * Calculates results for a motion with proxy weights
 */
export function getMotionResults(motionId: number) {
  const motionVotes = mockVotes.filter(v => v.motion_id === motionId);
  
  // Initialize results
  const results = {
    yes: { count: 0, weight: 0 },
    no: { count: 0, weight: 0 },
    abstain: { count: 0, weight: 0 }
  };
  
  // Aggregate votes by value
  motionVotes.forEach(vote => {
    const value = vote.vote_value.toLowerCase() as 'yes' | 'no' | 'abstain';
    if (results[value]) {
      results[value].count += 1;
      results[value].weight += vote.vote_weight;
    }
  });
  
  // Calculate total weight
  const totalWeight = results.yes.weight + results.no.weight + results.abstain.weight;
  
  // Calculate percentages
  return {
    motionId,
    totalVotes: motionVotes.length,
    totalWeight,
    results: {
      yes: {
        ...results.yes,
        percentage: totalWeight > 0 ? ((results.yes.weight / totalWeight) * 100).toFixed(2) : "0"
      },
      no: {
        ...results.no,
        percentage: totalWeight > 0 ? ((results.no.weight / totalWeight) * 100).toFixed(2) : "0"
      },
      abstain: {
        ...results.abstain,
        percentage: totalWeight > 0 ? ((results.abstain.weight / totalWeight) * 100).toFixed(2) : "0"
      }
    }
  };
}

/**
 * Updates mock user data (for testing)
 */
export function updateMockUser(userId: number, updates: Partial<MockUser>) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
  }
}

/**
 * Resets all votes (for testing)
 */
export function resetVotes() {
  mockVotes = [];
}

/**
 * Gets user by ID
 */
export function getMockUser(userId: number): MockUser | undefined {
  return mockUsers.find(u => u.id === userId);
}

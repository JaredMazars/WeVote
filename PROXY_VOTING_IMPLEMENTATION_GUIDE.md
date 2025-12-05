# **Proxy Voting System - Implementation Guide**

## **📋 Table of Contents**
1. [System Overview](#system-overview)
2. [Core Concept](#core-concept)
3. [Data Structures](#data-structures)
4. [Core Functions](#core-functions)
5. [React Components](#react-components)
6. [Test Scenarios](#test-scenarios)
7. [Implementation Steps](#implementation-steps)
8. [What NOT to Do](#what-not-to-do)

---

## **🎯 System Overview**

Build a complete proxy voting system for a shareholder voting application where members can delegate their voting rights to other members (proxy holders). When a proxy holder votes, their vote should count as their own vote PLUS all votes from members who assigned them as proxy.

**Important: Do NOT work on SQL queries or database schema. Use dummy/mock data for now to test the logic and UI.**

---

## **💡 Core Concept**

### **The Problem**
- Alice, Bob, and Charlie are shareholders
- Alice can't attend the AGM, so she assigns David as her proxy holder
- Bob also assigns David as his proxy holder  
- Charlie votes for himself
- When David votes, his vote should count as **3 votes** (his own + Alice's + Bob's)

### **The Solution**
Track who assigned who as proxy, then when someone votes, calculate their total vote weight by counting how many people assigned them as proxy.

**Visual Example:**
```
Alice (can't attend)  ──► assigns proxy to ──► David
Bob (can't attend)    ──► assigns proxy to ──► David
Charlie (attending)   ──► votes himself

When David votes:
- David's vote = 1 (own vote)
- Alice's vote = 1 (via proxy)
- Bob's vote = 1 (via proxy)
- Total weight = 3 votes

When Charlie votes:
- Charlie's vote = 1
- Total weight = 1 vote
```

---

## **📊 Data Structures**

### **1. Mock Users Array**
```javascript
const mockUsers = [
  {
    id: 1,
    name: "Alice Smith",
    email: "alice@example.com",
    has_proxy: true,           // Has uploaded proxy form
    proxy_assignee_id: 4,      // Assigned David (ID 4) as proxy
  },
  {
    id: 2,
    name: "Bob Johnson", 
    email: "bob@example.com",
    has_proxy: true,
    proxy_assignee_id: 4,      // Also assigned David as proxy
  },
  {
    id: 3,
    name: "Charlie Brown",
    email: "charlie@example.com",
    has_proxy: false,
    proxy_assignee_id: null,   // Voting himself
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david@example.com",
    has_proxy: false,
    proxy_assignee_id: null,   // Voting himself (but also holds 2 proxies)
  }
];
```

### **2. AGM and Motion Data**
```javascript
const mockAGM = {
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
```

### **3. Votes Array (Initially Empty)**
```javascript
const mockVotes = [
  // Will be populated as users vote
  // Example structure after votes are cast:
  // {
  //   id: 1,
  //   user_id: 4,
  //   motion_id: 101,
  //   vote_value: "Yes",
  //   is_proxy_vote: true,
  //   proxy_count: 2,
  //   proxy_assignees: [
  //     { id: 1, name: "Alice Smith" },
  //     { id: 2, name: "Bob Johnson" }
  //   ],
  //   vote_weight: 3,
  //   voted_at: "2025-12-05T10:30:00Z"
  // }
];
```

---

## **⚙️ Core Functions**

### **Function 1: Get Proxy Assignees**
Returns all users who assigned this user as their proxy holder.

```javascript
/**
 * Returns all users who assigned this user as their proxy
 * @param {number} userId - The proxy holder's ID
 * @returns {Array} - Array of users who assigned this person as proxy
 */
function getProxyAssignees(userId) {
  return mockUsers.filter(user => 
    user.proxy_assignee_id === userId && 
    user.has_proxy === true
  );
}

// Example Usage:
// getProxyAssignees(4) 
// Returns: [
//   { id: 1, name: "Alice Smith", email: "alice@example.com", ... },
//   { id: 2, name: "Bob Johnson", email: "bob@example.com", ... }
// ]
```

---

### **Function 2: Calculate Vote Weight**
Calculates the total vote weight for a user (their vote + proxy votes).

```javascript
/**
 * Calculates total vote weight for a user
 * @param {number} userId - The voter's ID
 * @returns {Object} - Vote weight breakdown
 */
function calculateVoteWeight(userId) {
  const proxyAssignees = getProxyAssignees(userId);
  
  return {
    ownVote: 1,
    proxyCount: proxyAssignees.length,
    totalWeight: 1 + proxyAssignees.length,
    proxyAssignees: proxyAssignees.map(u => ({
      id: u.id,
      name: u.name
    }))
  };
}

// Example Usage:
// calculateVoteWeight(4)
// Returns: {
//   ownVote: 1,
//   proxyCount: 2,
//   totalWeight: 3,
//   proxyAssignees: [
//     { id: 1, name: "Alice Smith" },
//     { id: 2, name: "Bob Johnson" }
//   ]
// }

// calculateVoteWeight(3)  // Charlie has no proxies
// Returns: {
//   ownVote: 1,
//   proxyCount: 0,
//   totalWeight: 1,
//   proxyAssignees: []
// }
```

---

### **Function 3: Check Vote Eligibility**
Determines if a user can vote on a specific motion.

```javascript
/**
 * Checks if a user is eligible to vote on a motion
 * @param {number} userId - The user's ID
 * @param {number} motionId - The motion's ID
 * @returns {Object} - Eligibility status and reason
 */
function checkVoteEligibility(userId, motionId) {
  const user = mockUsers.find(u => u.id === userId);
  
  // Rule 1: Check if user already voted
  const hasVoted = mockVotes.some(v => 
    v.user_id === userId && v.motion_id === motionId
  );
  
  if (hasVoted) {
    return {
      canVote: false,
      reason: "You have already voted on this motion"
    };
  }
  
  // Rule 2: Check if user assigned someone else as proxy
  if (user.proxy_assignee_id !== null) {
    const proxyHolder = mockUsers.find(u => u.id === user.proxy_assignee_id);
    
    // Check if proxy holder already voted
    const proxyVoted = mockVotes.some(v => 
      v.user_id === user.proxy_assignee_id && v.motion_id === motionId
    );
    
    if (proxyVoted) {
      return {
        canVote: false,
        reason: `Your proxy holder (${proxyHolder.name}) has already voted on your behalf`
      };
    } else {
      return {
        canVote: false,
        reason: `You assigned ${proxyHolder.name} as your proxy holder. They will vote on your behalf.`
      };
    }
  }
  
  // Rule 3: All checks passed
  return {
    canVote: true,
    reason: null
  };
}

// Example Usage:
// checkVoteEligibility(4, 101)
// Returns: { canVote: true, reason: null }

// checkVoteEligibility(1, 101)  // Alice assigned proxy to David
// Returns: { 
//   canVote: false, 
//   reason: "You assigned David Wilson as your proxy holder. They will vote on your behalf." 
// }
```

---

### **Function 4: Cast Vote**
Records a vote with calculated proxy weight.

```javascript
/**
 * Records a vote with proxy weight
 * @param {number} userId - The voter's ID
 * @param {number} motionId - The motion's ID
 * @param {string} voteValue - "Yes", "No", or "Abstain"
 * @returns {Object} - Vote result with success status
 */
function castVote(userId, motionId, voteValue) {
  // Step 1: Check eligibility
  const eligibility = checkVoteEligibility(userId, motionId);
  if (!eligibility.canVote) {
    return {
      success: false,
      message: eligibility.reason,
      data: null
    };
  }
  
  // Step 2: Calculate vote weight
  const voteWeight = calculateVoteWeight(userId);
  
  // Step 3: Create vote record
  const vote = {
    id: mockVotes.length + 1,
    user_id: userId,
    motion_id: motionId,
    vote_value: voteValue,
    is_proxy_vote: voteWeight.proxyCount > 0,
    proxy_count: voteWeight.proxyCount,
    proxy_assignees: voteWeight.proxyAssignees,
    vote_weight: voteWeight.totalWeight,
    voted_at: new Date().toISOString()
  };
  
  // Step 4: Add to votes array
  mockVotes.push(vote);
  
  // Step 5: Return success
  return {
    success: true,
    message: `Vote recorded successfully. Your vote counts as ${voteWeight.totalWeight} vote(s).`,
    data: vote
  };
}

// Example Usage:
// castVote(4, 101, "Yes")
// Returns: {
//   success: true,
//   message: "Vote recorded successfully. Your vote counts as 3 vote(s).",
//   data: {
//     id: 1,
//     user_id: 4,
//     motion_id: 101,
//     vote_value: "Yes",
//     is_proxy_vote: true,
//     proxy_count: 2,
//     proxy_assignees: [...],
//     vote_weight: 3,
//     voted_at: "2025-12-05T10:30:00Z"
//   }
// }

// castVote(1, 101, "Yes")  // Alice tries to vote (but assigned proxy)
// Returns: {
//   success: false,
//   message: "You assigned David Wilson as your proxy holder. They will vote on your behalf.",
//   data: null
// }
```

---

### **Function 5: Get Motion Results**
Calculates weighted results for a motion.

```javascript
/**
 * Calculates results for a motion with proxy weights
 * @param {number} motionId - The motion's ID
 * @returns {Object} - Aggregated motion results with percentages
 */
function getMotionResults(motionId) {
  const motionVotes = mockVotes.filter(v => v.motion_id === motionId);
  
  // Initialize results
  const results = {
    yes: { count: 0, weight: 0 },
    no: { count: 0, weight: 0 },
    abstain: { count: 0, weight: 0 }
  };
  
  // Aggregate votes by value
  motionVotes.forEach(vote => {
    const value = vote.vote_value.toLowerCase();
    if (results[value]) {
      results[value].count += 1;              // Number of voters
      results[value].weight += vote.vote_weight;  // Weighted votes
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
        percentage: totalWeight > 0 ? ((results.yes.weight / totalWeight) * 100).toFixed(2) : 0
      },
      no: {
        ...results.no,
        percentage: totalWeight > 0 ? ((results.no.weight / totalWeight) * 100).toFixed(2) : 0
      },
      abstain: {
        ...results.abstain,
        percentage: totalWeight > 0 ? ((results.abstain.weight / totalWeight) * 100).toFixed(2) : 0
      }
    }
  };
}

// Example Usage:
// After David votes "Yes" (weight 3) and Charlie votes "No" (weight 1):
// getMotionResults(101)
// Returns: {
//   motionId: 101,
//   totalVotes: 2,
//   totalWeight: 4,
//   results: {
//     yes: { count: 1, weight: 3, percentage: "75.00" },
//     no: { count: 1, weight: 1, percentage: "25.00" },
//     abstain: { count: 0, weight: 0, percentage: "0" }
//   }
// }
```

---

## **🎨 React Components**

### **Component 1: VotingInterface**
Main voting interface with proxy information display.

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';

interface Motion {
  id: number;
  title: string;
  description: string;
  status: string;
}

interface VotingInterfaceProps {
  userId: number;
  motion: Motion;
  onVote: (voteValue: string) => void;
}

const VotingInterface: React.FC<VotingInterfaceProps> = ({ userId, motion, onVote }) => {
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate vote weight for this user
  const voteWeight = calculateVoteWeight(userId);
  
  // Check if user can vote
  const eligibility = checkVoteEligibility(userId, motion.id);
  
  const handleVote = async (voteValue: string) => {
    setSelectedVote(voteValue);
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      onVote(voteValue);
      setIsSubmitting(false);
    }, 500);
  };
  
  // User cannot vote (assigned proxy or already voted)
  if (!eligibility.canVote) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-2">Cannot Vote</h4>
            <p className="text-yellow-800">{eligibility.reason}</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      {/* Motion Details */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{motion.title}</h3>
        <p className="text-gray-600">{motion.description}</p>
      </div>
      
      {/* Vote Weight Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h4 className="font-bold text-blue-900 text-lg">
            Your Vote Weight: {voteWeight.totalWeight} vote{voteWeight.totalWeight > 1 ? 's' : ''}
          </h4>
        </div>
        
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Your vote: <strong className="ml-2">1</strong>
          </li>
          {voteWeight.proxyCount > 0 && (
            <li className="flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
              Proxy votes: <strong className="ml-2">{voteWeight.proxyCount}</strong>
            </li>
          )}
        </ul>
        
        {voteWeight.proxyAssignees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              You are voting on behalf of:
            </p>
            <ul className="space-y-1">
              {voteWeight.proxyAssignees.map(assignee => (
                <li key={assignee.id} className="text-sm text-blue-800 flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  {assignee.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Vote Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => handleVote('Yes')}
          disabled={isSubmitting}
          className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <span className="text-3xl mb-2">✓</span>
          <span>Yes</span>
        </button>
        
        <button 
          onClick={() => handleVote('No')}
          disabled={isSubmitting}
          className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <span className="text-3xl mb-2">✗</span>
          <span>No</span>
        </button>
        
        <button 
          onClick={() => handleVote('Abstain')}
          disabled={isSubmitting}
          className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl font-bold text-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <span className="text-3xl mb-2">—</span>
          <span>Abstain</span>
        </button>
      </div>
      
      {isSubmitting && (
        <div className="mt-4 text-center text-gray-600">
          <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="mt-2">Submitting your vote...</p>
        </div>
      )}
    </motion.div>
  );
};

export default VotingInterface;
```

---

### **Component 2: MotionResults**
Display motion results with weighted vote bars.

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users } from 'lucide-react';

interface MotionResultsProps {
  motionId: number;
}

const MotionResults: React.FC<MotionResultsProps> = ({ motionId }) => {
  const results = getMotionResults(motionId);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Results</h3>
        <div className="flex items-center space-x-2 text-gray-600">
          <Users className="h-5 w-5" />
          <span className="text-sm">
            {results.totalVotes} voter{results.totalVotes !== 1 ? 's' : ''} • 
            {results.totalWeight} weighted vote{results.totalWeight !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Vote Breakdown */}
      <div className="space-y-6">
        {/* Yes Votes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-green-700">Yes</span>
              <span className="text-sm text-gray-500">
                ({results.results.yes.count} voter{results.results.yes.count !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-700">
                {results.results.yes.weight}
              </span>
              <span className="text-sm text-gray-600 ml-2">
                {results.results.yes.percentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${results.results.yes.percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full shadow-inner"
            />
          </div>
        </div>
        
        {/* No Votes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-red-700">No</span>
              <span className="text-sm text-gray-500">
                ({results.results.no.count} voter{results.results.no.count !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-red-700">
                {results.results.no.weight}
              </span>
              <span className="text-sm text-gray-600 ml-2">
                {results.results.no.percentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${results.results.no.percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full shadow-inner"
            />
          </div>
        </div>
        
        {/* Abstain Votes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-gray-700">Abstain</span>
              <span className="text-sm text-gray-500">
                ({results.results.abstain.count} voter{results.results.abstain.count !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-700">
                {results.results.abstain.weight}
              </span>
              <span className="text-sm text-gray-600 ml-2">
                {results.results.abstain.percentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${results.results.abstain.percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="bg-gradient-to-r from-gray-500 to-gray-600 h-4 rounded-full shadow-inner"
            />
          </div>
        </div>
      </div>
      
      {/* Status Badge */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        {results.results.yes.weight > results.results.no.weight ? (
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Motion Approved</span>
          </div>
        ) : results.results.yes.weight < results.results.no.weight ? (
          <div className="flex items-center justify-center space-x-2 text-red-700">
            <TrendingUp className="h-5 w-5 transform rotate-180" />
            <span className="font-semibold">Motion Rejected</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-gray-700">
            <span className="font-semibold">Motion Tied</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MotionResults;
```

---

### **Component 3: ProxyInfoCard**
Display who the user is voting on behalf of.

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Shield } from 'lucide-react';

interface ProxyInfoCardProps {
  userId: number;
}

const ProxyInfoCard: React.FC<ProxyInfoCardProps> = ({ userId }) => {
  const voteWeight = calculateVoteWeight(userId);
  const user = mockUsers.find(u => u.id === userId);
  
  // User has assigned someone else as proxy
  if (user?.proxy_assignee_id) {
    const proxyHolder = mockUsers.find(u => u.id === user.proxy_assignee_id);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-purple-900 text-lg mb-2">Proxy Assigned</h4>
            <p className="text-purple-800 mb-3">
              You have assigned <strong>{proxyHolder?.name}</strong> as your proxy holder.
            </p>
            <p className="text-sm text-purple-700">
              They will vote on your behalf for all motions during this AGM.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // User is voting themselves (no proxy assigned to them by others)
  if (voteWeight.proxyCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-lg mb-2">Voting for Yourself</h4>
            <p className="text-blue-800">
              You are voting on your own behalf. Your vote counts as <strong>1 vote</strong>.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // User is a proxy holder for others
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Users className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-green-900 text-lg mb-2">
            Proxy Holder ({voteWeight.proxyCount} member{voteWeight.proxyCount > 1 ? 's' : ''})
          </h4>
          <p className="text-green-800 mb-4">
            You are voting on behalf of <strong>{voteWeight.proxyCount}</strong> other member{voteWeight.proxyCount > 1 ? 's' : ''}. 
            Your vote counts as <strong>{voteWeight.totalWeight} votes</strong>.
          </p>
          
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900 mb-2">Proxy members:</p>
            <ul className="space-y-2">
              {voteWeight.proxyAssignees.map((assignee, index) => (
                <li key={assignee.id} className="flex items-center text-sm text-green-800">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 mr-3">
                    {index + 1}
                  </span>
                  {assignee.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProxyInfoCard;
```

---

## **🧪 Test Scenarios**

### **Test 1: Basic Proxy Vote**
```javascript
console.log("=== TEST 1: Basic Proxy Vote ===");

// Setup: Alice assigns David as proxy
mockUsers[0].proxy_assignee_id = 4;
mockUsers[0].has_proxy = true;

console.log("Setup: Alice assigned David as proxy");
console.log("Vote Weight for David:", calculateVoteWeight(4));
// Expected: { ownVote: 1, proxyCount: 1, totalWeight: 2, proxyAssignees: [...] }

// David votes
const davidVote = castVote(4, 101, 'Yes');
console.log("David's vote:", davidVote);
// Expected: { success: true, message: "Your vote counts as 2 votes", data: {...} }

// Alice tries to vote (should fail)
const aliceVote = castVote(1, 101, 'Yes');
console.log("Alice's vote attempt:", aliceVote);
// Expected: { success: false, message: "You assigned David Wilson as your proxy..." }

console.log("\n");
```

### **Test 2: Multiple Proxies**
```javascript
console.log("=== TEST 2: Multiple Proxies ===");

// Setup: Alice and Bob both assign David
mockUsers[0].proxy_assignee_id = 4;
mockUsers[0].has_proxy = true;
mockUsers[1].proxy_assignee_id = 4;
mockUsers[1].has_proxy = true;

console.log("Setup: Alice and Bob assigned David as proxy");
console.log("Vote Weight for David:", calculateVoteWeight(4));
// Expected: { ownVote: 1, proxyCount: 2, totalWeight: 3, proxyAssignees: [...] }

// David votes
const result = castVote(4, 102, 'No');
console.log("David's vote:", result);
// Expected: Vote weight = 3

// Check results
const results = getMotionResults(102);
console.log("Motion 102 Results:", results);
// Expected: No = 3 weighted votes, 100%

console.log("\n");
```

### **Test 3: Mixed Voting**
```javascript
console.log("=== TEST 3: Mixed Voting ===");

// Setup
mockUsers[0].proxy_assignee_id = 4; // Alice → David
mockUsers[1].proxy_assignee_id = 4; // Bob → David
mockUsers[2].proxy_assignee_id = null; // Charlie votes himself

console.log("Setup: Alice & Bob → David proxy, Charlie votes himself");

// Charlie votes
const charlieVote = castVote(3, 103, 'Yes');
console.log("Charlie's vote:", charlieVote);
// Expected: weight = 1

// David votes
const davidVote2 = castVote(4, 103, 'No');
console.log("David's vote:", davidVote2);
// Expected: weight = 3

// Check results
const finalResults = getMotionResults(103);
console.log("Motion 103 Results:", finalResults);
// Expected:
// - Yes: 1 vote (25%)
// - No: 3 votes (75%)
// - Total: 2 voters, 4 weighted votes

console.log("\n");
```

### **Test 4: Proxy Holder Voting First**
```javascript
console.log("=== TEST 4: Proxy Holder Votes First ===");

// Setup: Alice assigns David
mockUsers[0].proxy_assignee_id = 4;
mockUsers[0].has_proxy = true;

// David votes first
castVote(4, 104, 'Yes');
console.log("David voted first (with Alice's proxy)");

// Alice tries to vote after (should fail)
const aliceAttempt = castVote(1, 104, 'No');
console.log("Alice's attempt:", aliceAttempt);
// Expected: { success: false, message: "Your proxy holder (David Wilson) has already voted on your behalf" }

console.log("\n");
```

### **Test 5: Results Calculation**
```javascript
console.log("=== TEST 5: Complex Results Calculation ===");

// Scenario:
// - User 1 (Alice): assigns proxy to User 4 (David)
// - User 2 (Bob): assigns proxy to User 4 (David)
// - User 3 (Charlie): assigns proxy to User 5 (Eve)
// - User 4 (David): votes himself + has 2 proxies = 3 votes
// - User 5 (Eve): votes herself + has 1 proxy = 2 votes

mockUsers[0].proxy_assignee_id = 4;
mockUsers[1].proxy_assignee_id = 4;
mockUsers[2].proxy_assignee_id = 5;

// David votes Yes (weight = 3)
castVote(4, 105, 'Yes');

// Eve votes No (weight = 2)
castVote(5, 105, 'No');

// Get results
const complexResults = getMotionResults(105);
console.log("Complex Results:", complexResults);
// Expected:
// - Yes: 1 voter, 3 weighted votes (60%)
// - No: 1 voter, 2 weighted votes (40%)
// - Total: 2 voters, 5 weighted votes

console.log("\n");
```

---

## **📝 Implementation Steps**

### **Step 1: Setup Mock Data**
1. Create a new file: `src/utils/proxyVoting.ts`
2. Copy all mock data arrays (mockUsers, mockAGM, mockVotes)
3. Add TypeScript interfaces for type safety

### **Step 2: Implement Core Functions**
1. Implement all 5 core functions in `proxyVoting.ts`
2. Add console.log statements to track execution
3. Test each function individually with mock data

### **Step 3: Test Functions in Console**
1. Run all 5 test scenarios
2. Verify vote weights are calculated correctly
3. Check that eligibility rules work properly
4. Confirm results aggregation is accurate

### **Step 4: Build React Components**
1. Create `VotingInterface.tsx` component
2. Create `MotionResults.tsx` component
3. Create `ProxyInfoCard.tsx` component
4. Test UI rendering with different user scenarios

### **Step 5: Integration Testing**
1. Create a test page that shows all components
2. Test voting flow from start to finish
3. Verify results update correctly after votes
4. Test edge cases (double voting, proxy conflicts, etc.)

### **Step 6: Polish & Documentation**
1. Add loading states and animations
2. Add error handling and user feedback
3. Document all edge cases
4. Create user guide for proxy voting

---

## **❌ What NOT to Do**

**Do NOT:**
- ❌ Create SQL queries or database schemas
- ❌ Setup database connections
- ❌ Create API endpoints or backend routes
- ❌ Worry about authentication/authorization
- ❌ Implement file upload for proxy forms (yet)
- ❌ Connect to real Azure services
- ❌ Write migration scripts

**These will come later after the logic is proven with mock data!**

---

## **✅ What TO Focus On**

**DO:**
- ✅ Pure JavaScript/TypeScript logic
- ✅ React components with beautiful UI
- ✅ Mock data testing
- ✅ Vote weight calculations
- ✅ Proxy assignee tracking
- ✅ Results aggregation with weights
- ✅ Console.log debugging
- ✅ Edge case handling
- ✅ User experience and feedback
- ✅ Component reusability

---

## **🎯 Success Criteria**

Your implementation is successful when:

1. ✅ All 5 core functions work correctly with mock data
2. ✅ Console tests show correct vote weights (1, 2, 3, etc.)
3. ✅ Users with assigned proxies cannot vote
4. ✅ Proxy holders see correct proxy count
5. ✅ Results show both voter count AND weighted votes
6. ✅ Percentages calculate correctly with weights
7. ✅ UI displays proxy information clearly
8. ✅ Vote buttons are disabled when appropriate
9. ✅ Results update in real-time after votes
10. ✅ All edge cases are handled gracefully

---

## **🚀 Next Steps After Completion**

Once the mock data implementation works perfectly:

1. Design database schema for proxy voting
2. Create API endpoints for voting operations
3. Integrate with real backend
4. Add authentication/authorization
5. Implement proxy form upload
6. Add audit logging
7. Deploy to production

---

## **📞 Questions to Answer First**

Before starting implementation, clarify:

1. Can a user change their proxy assignment after submitting?
2. Can proxy votes be revoked mid-AGM?
3. What happens if a proxy holder doesn't vote?
4. Can someone be a proxy holder AND assign their own proxy? (Proxy chains)
5. Should there be a deadline for proxy assignments?
6. How are tied votes handled?
7. Is there a minimum vote threshold for motions to pass?

---

## **📚 Additional Resources**

- **Framer Motion Docs**: https://www.framer.com/motion/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Best Practices**: https://react.dev/learn

---

**🎉 Good luck with implementation! Start by creating the 5 core functions, test them with console.logs, then build the beautiful React components around them. Focus on getting the vote weight calculations perfect before anything else!**

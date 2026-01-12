// Ranked Choice Voting (RCV) / Single Transferable Vote (STV) Service
// Implements instant-runoff voting algorithm

export interface RankedBallot {
  voterId: string;
  voterName: string;
  rankings: string[]; // Ordered list of candidate IDs (1st choice, 2nd choice, etc.)
  timestamp: string;
  weight: number; // For weighted voting (e.g., share-based)
}

export interface RCVCandidate {
  id: string;
  name: string;
  description?: string;
}

export interface RCVRound {
  roundNumber: number;
  candidateVotes: Record<string, number>;
  eliminatedCandidate?: string;
  winner?: string;
  redistributedVotes?: number;
}

export interface RCVResult {
  winner: string | null;
  rounds: RCVRound[];
  totalVotes: number;
  exhaustedBallots: number;
  winningThreshold: number;
  method: 'instant-runoff' | 'STV';
}

class RankedChoiceVotingService {
  private readonly STORAGE_KEY = 'rcvElections';

  /**
   * Run instant-runoff voting algorithm
   */
  calculateInstantRunoff(
    ballots: RankedBallot[],
    candidates: RCVCandidate[],
    requiredMajority: number = 50 // Percentage required to win
  ): RCVResult {
    const rounds: RCVRound[] = [];
    let activeCandidates = new Set(candidates.map(c => c.id));
    let activeBallots = [...ballots];
    const totalVotes = ballots.reduce((sum, b) => sum + b.weight, 0);
    const winningThreshold = (totalVotes * requiredMajority) / 100;

    let roundNumber = 1;
    let winner: string | null = null;

    while (winner === null && activeCandidates.size > 1) {
      // Count first-choice votes for active candidates
      const voteCounts: Record<string, number> = {};
      activeCandidates.forEach(id => voteCounts[id] = 0);

      activeBallots.forEach(ballot => {
        // Find first active candidate in ballot's rankings
        const firstChoice = ballot.rankings.find(candidateId => 
          activeCandidates.has(candidateId)
        );
        
        if (firstChoice) {
          voteCounts[firstChoice] = (voteCounts[firstChoice] || 0) + ballot.weight;
        }
      });

      // Check if any candidate has majority
      const maxVotes = Math.max(...Object.values(voteCounts));
      const leadingCandidate = Object.entries(voteCounts).find(
        ([_, votes]) => votes === maxVotes
      )?.[0];

      if (leadingCandidate && maxVotes >= winningThreshold) {
        winner = leadingCandidate;
        rounds.push({
          roundNumber,
          candidateVotes: voteCounts,
          winner: leadingCandidate
        });
        break;
      }

      // Eliminate candidate with fewest votes
      const minVotes = Math.min(...Object.values(voteCounts));
      const eliminatedCandidate = Object.entries(voteCounts).find(
        ([_, votes]) => votes === minVotes
      )?.[0];

      if (eliminatedCandidate) {
        activeCandidates.delete(eliminatedCandidate);
        
        rounds.push({
          roundNumber,
          candidateVotes: voteCounts,
          eliminatedCandidate,
          redistributedVotes: voteCounts[eliminatedCandidate]
        });
      }

      roundNumber++;

      // Safety check to prevent infinite loop
      if (roundNumber > 100) {
        console.error('RCV: Too many rounds, breaking');
        break;
      }
    }

    // If only one candidate left, they win by default
    if (!winner && activeCandidates.size === 1) {
      winner = Array.from(activeCandidates)[0];
    }

    // Count exhausted ballots (no more ranked choices)
    const exhaustedBallots = activeBallots.filter(ballot => 
      !ballot.rankings.some(id => winner === id || activeCandidates.has(id))
    ).length;

    return {
      winner,
      rounds,
      totalVotes,
      exhaustedBallots,
      winningThreshold,
      method: 'instant-runoff'
    };
  }

  /**
   * Calculate Single Transferable Vote (for multi-winner elections)
   */
  calculateSTV(
    ballots: RankedBallot[],
    candidates: RCVCandidate[],
    seatsToFill: number
  ): RCVResult {
    const rounds: RCVRound[] = [];
    let activeCandidates = new Set(candidates.map(c => c.id));
    let winners: string[] = [];
    const totalVotes = ballots.reduce((sum, b) => sum + b.weight, 0);
    const quota = Math.floor(totalVotes / (seatsToFill + 1)) + 1; // Droop quota

    let roundNumber = 1;
    let activeBallots = ballots.map(b => ({ ...b, transferValue: 1 }));

    while (winners.length < seatsToFill && activeCandidates.size > 0) {
      // Count votes
      const voteCounts: Record<string, number> = {};
      activeCandidates.forEach(id => voteCounts[id] = 0);

      activeBallots.forEach(ballot => {
        const firstChoice = ballot.rankings.find(id => activeCandidates.has(id));
        if (firstChoice) {
          voteCounts[firstChoice] = (voteCounts[firstChoice] || 0) + 
            (ballot.weight * ballot.transferValue);
        }
      });

      // Check for winners (candidates meeting quota)
      const candidatesMeetingQuota = Object.entries(voteCounts)
        .filter(([_, votes]) => votes >= quota)
        .map(([id, _]) => id);

      if (candidatesMeetingQuota.length > 0) {
        // Add winners
        candidatesMeetingQuota.forEach(candidateId => {
          winners.push(candidateId);
          activeCandidates.delete(candidateId);
          
          // Redistribute surplus votes
          const surplus = voteCounts[candidateId] - quota;
          if (surplus > 0) {
            const transferValue = surplus / voteCounts[candidateId];
            activeBallots = activeBallots.map(ballot => {
              if (ballot.rankings[0] === candidateId) {
                return { ...ballot, transferValue: transferValue };
              }
              return ballot;
            });
          }
        });

        rounds.push({
          roundNumber,
          candidateVotes: voteCounts,
          winner: candidatesMeetingQuota[0]
        });
      } else {
        // Eliminate lowest candidate
        const minVotes = Math.min(...Object.values(voteCounts));
        const eliminatedCandidate = Object.entries(voteCounts).find(
          ([_, votes]) => votes === minVotes
        )?.[0];

        if (eliminatedCandidate) {
          activeCandidates.delete(eliminatedCandidate);
          rounds.push({
            roundNumber,
            candidateVotes: voteCounts,
            eliminatedCandidate
          });
        }
      }

      roundNumber++;

      if (roundNumber > 100) break; // Safety check
    }

    return {
      winner: winners[0] || null,
      rounds,
      totalVotes,
      exhaustedBallots: 0,
      winningThreshold: quota,
      method: 'STV'
    };
  }

  /**
   * Validate ranked ballot
   */
  validateBallot(ballot: RankedBallot, candidates: RCVCandidate[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for empty rankings
    if (!ballot.rankings || ballot.rankings.length === 0) {
      errors.push('Ballot must have at least one ranking');
    }

    // Check for duplicate rankings
    const uniqueRankings = new Set(ballot.rankings);
    if (uniqueRankings.size !== ballot.rankings.length) {
      errors.push('Ballot contains duplicate rankings');
    }

    // Check for invalid candidate IDs
    const validCandidateIds = new Set(candidates.map(c => c.id));
    ballot.rankings.forEach(id => {
      if (!validCandidateIds.has(id)) {
        errors.push(`Invalid candidate ID: ${id}`);
      }
    });

    // Check weight
    if (ballot.weight <= 0) {
      errors.push('Ballot weight must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Save RCV election
   */
  saveElection(electionId: string, data: {
    candidates: RCVCandidate[];
    ballots: RankedBallot[];
    result?: RCVResult;
  }): void {
    const elections = this.getAllElections();
    elections[electionId] = {
      ...data,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(elections));
  }

  /**
   * Get all RCV elections
   */
  getAllElections(): Record<string, any> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Get specific election
   */
  getElection(electionId: string): any {
    const elections = this.getAllElections();
    return elections[electionId] || null;
  }

  /**
   * Submit ranked ballot
   */
  submitBallot(electionId: string, ballot: RankedBallot): boolean {
    const election = this.getElection(electionId);
    if (!election) {
      console.error('Election not found');
      return false;
    }

    // Validate ballot
    const validation = this.validateBallot(ballot, election.candidates);
    if (!validation.valid) {
      console.error('Invalid ballot:', validation.errors);
      return false;
    }

    // Add ballot
    if (!election.ballots) {
      election.ballots = [];
    }
    election.ballots.push(ballot);

    // Save
    this.saveElection(electionId, election);
    return true;
  }

  /**
   * Calculate and save results
   */
  calculateResults(electionId: string, method: 'instant-runoff' | 'STV' = 'instant-runoff'): RCVResult | null {
    const election = this.getElection(electionId);
    if (!election || !election.ballots || election.ballots.length === 0) {
      return null;
    }

    let result: RCVResult;
    
    if (method === 'instant-runoff') {
      result = this.calculateInstantRunoff(election.ballots, election.candidates);
    } else {
      result = this.calculateSTV(election.ballots, election.candidates, 1);
    }

    // Save result
    election.result = result;
    this.saveElection(electionId, election);

    return result;
  }

  /**
   * Get formatted results summary
   */
  getResultsSummary(result: RCVResult, candidates: RCVCandidate[]): string {
    const getCandidateName = (id: string) => 
      candidates.find(c => c.id === id)?.name || id;

    let summary = `🏆 ${result.method === 'instant-runoff' ? 'Instant-Runoff' : 'STV'} Voting Results\n\n`;
    summary += `Winner: ${result.winner ? getCandidateName(result.winner) : 'No winner'}\n`;
    summary += `Total Votes: ${result.totalVotes}\n`;
    summary += `Winning Threshold: ${result.winningThreshold}\n`;
    summary += `Exhausted Ballots: ${result.exhaustedBallots}\n\n`;

    summary += `Rounds:\n`;
    result.rounds.forEach(round => {
      summary += `\nRound ${round.roundNumber}:\n`;
      Object.entries(round.candidateVotes).forEach(([id, votes]) => {
        summary += `  ${getCandidateName(id)}: ${votes} votes\n`;
      });
      if (round.eliminatedCandidate) {
        summary += `  ❌ Eliminated: ${getCandidateName(round.eliminatedCandidate)}\n`;
      }
      if (round.winner) {
        summary += `  🏆 Winner: ${getCandidateName(round.winner)}\n`;
      }
    });

    return summary;
  }
}

export const rcvService = new RankedChoiceVotingService();

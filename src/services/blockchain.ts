/**
 * Blockchain Vote Verification Service
 * FREE implementation using cryptographic hashing (SHA-256)
 * No gas fees, no external dependencies, 100% free
 */

export interface VoteData {
  voteId: string;
  userId: string;
  userName: string;
  candidateId?: string;
  candidateName?: string;
  resolutionId?: string;
  resolutionTitle?: string;
  voteChoice: string;
  timestamp: string;
  ipAddress?: string;
  sessionId?: string;
}

export interface VoteHash {
  hash: string;
  voteId: string;
  timestamp: string;
  verificationUrl: string;
  blockchainReceipt: BlockchainReceipt;
}

export interface BlockchainReceipt {
  transactionId: string;
  blockNumber: number;
  confirmations: number;
  networkName: string;
  gasUsed: string;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface VerificationCertificate {
  certificateId: string;
  voteHash: VoteHash;
  voteData: VoteData;
  issuer: string;
  issuerSignature: string;
  verificationStatus: 'verified' | 'tampered' | 'not_found';
  verifiedAt: string;
}

class BlockchainService {
  private readonly CHAIN_ID = 'WEVOTE_TESTNET';
  private blockCounter: number;

  constructor() {
    const savedCounter = localStorage.getItem('blockCounter');
    this.blockCounter = savedCounter ? parseInt(savedCounter) : 1;
  }

  /**
   * Simple SHA-256 hash implementation (no external dependencies)
   */
  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate SHA-256 hash of vote data
   */
  async hashVote(voteData: VoteData): Promise<string> {
    const voteString = JSON.stringify({
      voteId: voteData.voteId,
      userId: voteData.userId,
      userName: voteData.userName,
      candidateId: voteData.candidateId,
      candidateName: voteData.candidateName,
      resolutionId: voteData.resolutionId,
      resolutionTitle: voteData.resolutionTitle,
      voteChoice: voteData.voteChoice,
      timestamp: voteData.timestamp,
      chainId: this.CHAIN_ID,
    });

    return await this.sha256(voteString);
  }

  /**
   * Record vote on the blockchain (simulated free testnet)
   */
  async recordVoteOnChain(voteData: VoteData): Promise<VoteHash> {
    const hash = await this.hashVote(voteData);

    // Simulate blockchain transaction ID
    const transactionId = `0x${await this.sha256(hash + Date.now())}`;
    
    this.blockCounter++;
    localStorage.setItem('blockCounter', this.blockCounter.toString());

    const blockchainReceipt: BlockchainReceipt = {
      transactionId,
      blockNumber: this.blockCounter,
      confirmations: 12,
      networkName: 'WeVote Testnet (Free)',
      gasUsed: '0.000000 (FREE)',
      status: 'confirmed',
    };

    const verificationUrl = `${window.location.origin}/verify?hash=${hash}`;

    const voteHash: VoteHash = {
      hash,
      voteId: voteData.voteId,
      timestamp: voteData.timestamp,
      verificationUrl,
      blockchainReceipt,
    };

    await this.storeVoteHash(voteHash, voteData);

    window.dispatchEvent(new CustomEvent('voteHashStored', { 
      detail: { voteHash, voteData } 
    }));

    return voteHash;
  }

  /**
   * Store vote hash in localStorage
   */
  private async storeVoteHash(voteHash: VoteHash, voteData: VoteData): Promise<void> {
    const existingHashes = this.getAllVoteHashes();
    
    const record = {
      ...voteHash,
      voteData,
      storedAt: new Date().toISOString(),
    };

    existingHashes.push(record);
    localStorage.setItem('blockchainVotes', JSON.stringify(existingHashes));

    const hashIndex = this.getHashIndex();
    hashIndex[voteHash.hash] = record;
    localStorage.setItem('blockchainHashIndex', JSON.stringify(hashIndex));
  }

  /**
   * Get all stored vote hashes
   */
  getAllVoteHashes(): any[] {
    const hashes = localStorage.getItem('blockchainVotes');
    return hashes ? JSON.parse(hashes) : [];
  }

  /**
   * Get hash index for quick lookups
   */
  private getHashIndex(): Record<string, any> {
    const index = localStorage.getItem('blockchainHashIndex');
    return index ? JSON.parse(index) : {};
  }

  /**
   * Find vote by hash
   */
  async findVoteByHash(hash: string): Promise<{ voteHash: VoteHash; voteData: VoteData } | null> {
    const hashIndex = this.getHashIndex();
    return hashIndex[hash] || null;
  }

  /**
   * Find vote by vote ID
   */
  async findVoteById(voteId: string): Promise<{ voteHash: VoteHash; voteData: VoteData } | null> {
    const allHashes = this.getAllVoteHashes();
    return allHashes.find(record => record.voteId === voteId) || null;
  }

  /**
   * Verify vote integrity
   */
  async verifyVote(hash: string): Promise<VerificationCertificate> {
    const record = await this.findVoteByHash(hash);

    if (!record) {
      return {
        certificateId: `CERT-${Date.now()}`,
        voteHash: {} as VoteHash,
        voteData: {} as VoteData,
        issuer: 'WeVote Platform',
        issuerSignature: '',
        verificationStatus: 'not_found',
        verifiedAt: new Date().toISOString(),
      };
    }

    const computedHash = await this.hashVote(record.voteData);
    const isTampered = computedHash !== hash;

    const certificate: VerificationCertificate = {
      certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      voteHash: record.voteHash || record,
      voteData: record.voteData,
      issuer: 'WeVote Platform',
      issuerSignature: await this.sha256(hash + 'WeVote'),
      verificationStatus: isTampered ? 'tampered' : 'verified',
      verifiedAt: new Date().toISOString(),
    };

    return certificate;
  }

  /**
   * Get blockchain statistics
   */
  getBlockchainStats() {
    const allVotes = this.getAllVoteHashes();
    return {
      totalVotes: allVotes.length,
      currentBlock: this.blockCounter,
      networkName: 'WeVote Testnet',
      chainId: this.CHAIN_ID,
      totalTransactions: allVotes.length,
      averageBlockTime: '0s (instant)',
      gasPrice: '0 (free testnet)',
    };
  }

  /**
   * Export blockchain data
   */
  exportBlockchain(): string {
    const data = {
      chainId: this.CHAIN_ID,
      blockHeight: this.blockCounter,
      votes: this.getAllVoteHashes(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear blockchain (for testing only)
   */
  clearBlockchain(): void {
    if (confirm('⚠️ WARNING: This will permanently delete all blockchain vote records. Continue?')) {
      localStorage.removeItem('blockchainVotes');
      localStorage.removeItem('blockchainHashIndex');
      localStorage.removeItem('blockCounter');
      this.blockCounter = 1;
      alert('✅ Blockchain cleared successfully');
    }
  }
}

export const blockchainService = new BlockchainService();

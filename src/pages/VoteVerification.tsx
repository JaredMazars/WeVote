import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, AlertTriangle, Download, ExternalLink, Shield, Clock, Hash, FileText, Copy, Check } from 'lucide-react';
import Header from '../components/Header';
import { blockchainService, type VerificationCertificate } from '../services/blockchain';
import { pdfService } from '../services/pdfExport';

const VoteVerification: React.FC = () => {
  const [searchType, setSearchType] = useState<'hash' | 'voteId'>('voteId');
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [certificate, setCertificate] = useState<VerificationCertificate | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParam = params.get('hash');
    const voteIdParam = params.get('voteId');

    if (hashParam) {
      setSearchType('hash');
      setSearchValue(hashParam);
      handleVerify(hashParam, 'hash');
    } else if (voteIdParam) {
      setSearchType('voteId');
      setSearchValue(voteIdParam);
      handleVerify(voteIdParam, 'voteId');
    }
  }, []);

  const handleVerify = async (value?: string, type?: 'hash' | 'voteId') => {
    const searchVal = value || searchValue;
    const searchTp = type || searchType;

    if (!searchVal.trim()) {
      setError('Please enter a vote ID or hash');
      return;
    }

    setIsSearching(true);
    setError('');
    setCertificate(null);

    try {
      let hash = searchVal;

      if (searchTp === 'voteId') {
        const record = await blockchainService.findVoteById(searchVal);
        if (!record) {
          setError('Vote ID not found in blockchain');
          setIsSearching(false);
          return;
        }
        hash = record.voteHash.hash;
      }

      // Verify the vote
      const cert = await blockchainService.verifyVote(hash);
      setCertificate(cert);
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificate) return;

    pdfService.generatePDF({
      title: 'Blockchain Verification Certificate',
      subtitle: `Certificate ID: ${certificate.certificateId}`,
      data: {
        certificateId: certificate.certificateId,
        voteId: certificate.voteHash.voteId,
        hash: certificate.voteHash.hash,
        transactionId: certificate.voteHash.blockchainReceipt?.transactionId,
        blockNumber: certificate.voteHash.blockchainReceipt?.blockNumber,
        timestamp: certificate.voteHash.timestamp,
        status: certificate.verificationStatus,
      },
      type: 'blockchain-certificate',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    if (!certificate) return 'gray';
    switch (certificate.verificationStatus) {
      case 'verified': return 'green';
      case 'tampered': return 'red';
      case 'not_found': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    if (!certificate) return <Search className="h-12 w-12" />;
    switch (certificate.verificationStatus) {
      case 'verified': return <CheckCircle className="h-12 w-12" />;
      case 'tampered': return <XCircle className="h-12 w-12" />;
      case 'not_found': return <AlertTriangle className="h-12 w-12" />;
      default: return <Search className="h-12 w-12" />;
    }
  };

  const getStatusMessage = () => {
    if (!certificate) return '';
    switch (certificate.verificationStatus) {
      case 'verified':
        return '✅ Vote Verified - This vote has been cryptographically verified and has not been tampered with.';
      case 'tampered':
        return '❌ Tampering Detected - This vote data does not match the blockchain record. Possible tampering detected.';
      case 'not_found':
        return '⚠️ Not Found - This vote ID or hash was not found in the blockchain.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-full mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-[#464B4B] mb-4">
            Vote Verification Portal
          </h1>
          <p className="text-xl text-[#464B4B]/70">
            Verify the integrity and authenticity of any vote using blockchain technology
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setSearchType('voteId')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                searchType === 'voteId'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'bg-gray-100 text-[#464B4B] hover:bg-gray-200'
              }`}
            >
              Search by Vote ID
            </button>
            <button
              onClick={() => setSearchType('hash')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                searchType === 'hash'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'bg-gray-100 text-[#464B4B] hover:bg-gray-200'
              }`}
            >
              Search by Hash
            </button>
          </div>

          <div className="flex space-x-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              placeholder={searchType === 'voteId' ? 'Enter Vote ID (e.g., WV-2025-12345)' : 'Enter Blockchain Hash'}
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none text-lg"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVerify()}
              disabled={isSearching}
              className="px-8 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Verify</span>
                </>
              )}
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Verification Results */}
        {certificate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            {/* Status Header */}
            <div className={`bg-${getStatusColor()}-50 border-2 border-${getStatusColor()}-200 rounded-2xl p-6 mb-8`}>
              <div className="flex items-center space-x-4">
                <div className={`text-${getStatusColor()}-600`}>
                  {getStatusIcon()}
                </div>
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold text-${getStatusColor()}-900 mb-2`}>
                    {certificate.verificationStatus === 'verified' ? 'Verification Successful' :
                     certificate.verificationStatus === 'tampered' ? 'Tampering Detected' :
                     'Vote Not Found'}
                  </h2>
                  <p className={`text-${getStatusColor()}-800`}>
                    {getStatusMessage()}
                  </p>
                </div>
              </div>
            </div>

            {certificate.verificationStatus === 'verified' && (
              <>
                {/* Vote Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="h-5 w-5 text-[#0072CE]" />
                      <h3 className="font-bold text-[#464B4B]">Vote Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Vote ID</p>
                        <p className="font-semibold text-[#464B4B]">{certificate.voteHash.voteId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Voter</p>
                        <p className="font-semibold text-[#464B4B]">{certificate.voteData.userName}</p>
                      </div>
                      {certificate.voteData.candidateName && (
                        <div>
                          <p className="text-sm text-[#464B4B]/70">Candidate</p>
                          <p className="font-semibold text-[#464B4B]">{certificate.voteData.candidateName}</p>
                        </div>
                      )}
                      {certificate.voteData.resolutionTitle && (
                        <div>
                          <p className="text-sm text-[#464B4B]/70">Resolution</p>
                          <p className="font-semibold text-[#464B4B]">{certificate.voteData.resolutionTitle}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Vote Choice</p>
                        <p className="font-semibold text-[#464B4B]">{certificate.voteData.voteChoice}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-5 w-5 text-[#0072CE]" />
                      <h3 className="font-bold text-[#464B4B]">Blockchain Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Block Number</p>
                        <p className="font-semibold text-[#464B4B]">
                          #{certificate.voteHash.blockchainReceipt?.blockNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Confirmations</p>
                        <p className="font-semibold text-[#464B4B]">
                          {certificate.voteHash.blockchainReceipt?.confirmations} blocks
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Network</p>
                        <p className="font-semibold text-[#464B4B]">
                          {certificate.voteHash.blockchainReceipt?.networkName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Gas Used</p>
                        <p className="font-semibold text-green-600">
                          {certificate.voteHash.blockchainReceipt?.gasUsed}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#464B4B]/70">Timestamp</p>
                        <p className="font-semibold text-[#464B4B]">
                          {new Date(certificate.voteHash.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Hashes */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <Hash className="h-5 w-5 text-[#0072CE]" />
                    <h3 className="font-bold text-[#464B4B]">Cryptographic Proof</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-[#464B4B]/70">Vote Hash (SHA-256)</p>
                        <button
                          onClick={() => copyToClipboard(certificate.voteHash.hash)}
                          className="flex items-center space-x-1 text-[#0072CE] hover:text-[#171C8F] transition-all"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-sm bg-white p-3 rounded-lg border border-gray-200 break-all">
                        {certificate.voteHash.hash}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-[#464B4B]/70">Transaction ID</p>
                        <button
                          onClick={() => copyToClipboard(certificate.voteHash.blockchainReceipt?.transactionId || '')}
                          className="flex items-center space-x-1 text-[#0072CE] hover:text-[#171C8F] transition-all"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-sm bg-white p-3 rounded-lg border border-gray-200 break-all">
                        {certificate.voteHash.blockchainReceipt?.transactionId}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#464B4B]/70 mb-2">Issuer Signature</p>
                      <p className="font-mono text-sm bg-white p-3 rounded-lg border border-gray-200 break-all">
                        {certificate.issuerSignature}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadCertificate}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Certificate</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const url = `${window.location.origin}/verify?hash=${certificate.voteHash.hash}`;
                      copyToClipboard(url);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>Share Verification Link</span>
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Info Box */}
        {!certificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6"
          >
            <h3 className="font-bold text-blue-900 mb-3">How Vote Verification Works</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Every vote is cryptographically hashed using SHA-256</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Vote hash is recorded on the blockchain with a unique transaction ID</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Anyone can verify vote integrity using the Vote ID or Hash</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Tampering is instantly detected by hash mismatch</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Download verification certificates as proof of vote authenticity</span>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoteVerification;

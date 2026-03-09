import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowLeft, Printer, Share2, Shield } from 'lucide-react';
import Header from '../components/Header';
import api from '../services/api';

interface ReceiptData {
  voteId: string | number;
  voteType: string;
  sessionTitle: string;
  entityName: string;
  voteChoice: string;
  votesAllocated: number;
  votedAt: string;
  isProxyVote: boolean;
  voterIdentifier: string;
}

export default function VoteReceipt() {
  const { voteId } = useParams<{ voteId: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!voteId) {
        setError('No vote ID provided.');
        setLoading(false);
        return;
      }
      try {
        const res = await api.verifyVote(voteId);
        if (res.success && (res.data as any)?.verified) {
          setReceipt((res.data as any).vote as ReceiptData);
        } else {
          setError('Vote receipt not found. The vote ID may be invalid.');
        }
      } catch {
        setError('Could not load vote receipt. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [voteId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Receipt link copied to clipboard!');
    });
  };

  const printReceipt = () => window.print();

  const formattedDate = receipt?.votedAt
    ? new Date(receipt.votedAt).toLocaleString('en-ZA', {
        dateStyle: 'long',
        timeStyle: 'medium',
      })
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      <div className="py-10 px-4 max-w-2xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#0072CE] hover:text-[#171C8F] font-medium mb-6 print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </motion.button>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#464B4B]/60">Loading receipt…</p>
          </div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-3xl p-10 text-center shadow-xl"
          >
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Receipt Not Found</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/voting')}
              className="px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go to Voting
            </button>
          </motion.div>
        )}

        {!loading && receipt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Receipt header */}
            <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] px-8 py-6 text-white print:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Forvis Mazars</p>
                  <h1 className="text-2xl font-bold mt-1">Official Vote Receipt</h1>
                </div>
                <div className="bg-white/20 rounded-2xl p-3">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Success badge */}
            <div className="flex justify-center -mt-5 print:mt-2">
              <div className="bg-green-100 border-4 border-white rounded-full p-2 shadow-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="px-8 pt-6 pb-8">
              <p className="text-center text-green-700 font-semibold mb-6">
                Your vote has been recorded and verified
              </p>

              {/* Receipt fields */}
              <div className="space-y-4">
                {[
                  { label: 'Vote ID', value: `#${receipt.voteId}`, mono: true },
                  { label: 'Session', value: receipt.sessionTitle },
                  { label: 'Vote Type', value: receipt.voteType === 'candidate' ? 'Candidate Election' : 'Resolution' },
                  { label: receipt.voteType === 'candidate' ? 'Candidate' : 'Resolution', value: receipt.entityName },
                  { label: 'Your Vote', value: receipt.voteChoice, highlight: true },
                  { label: 'Votes Allocated', value: receipt.votesAllocated?.toString() ?? '1' },
                  { label: 'Voted At', value: formattedDate },
                  { label: 'Vote Type', value: receipt.isProxyVote ? 'Proxy Vote' : 'Personal Vote' },
                  { label: 'Voter Reference', value: receipt.voterIdentifier, mono: true },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-[#464B4B]/60 text-sm font-medium w-36 shrink-0">{label}</span>
                    <span
                      className={[
                        'text-right flex-1',
                        mono ? 'font-mono text-sm text-[#464B4B]' : 'font-semibold text-[#464B4B]',
                        highlight ? 'text-lg font-bold text-[#0072CE]' : '',
                      ].join(' ')}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verification note */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#0072CE] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#171C8F] mb-1">Vote Integrity Verified</p>
                    <p className="text-xs text-[#464B4B]/70">
                      This receipt is your permanent proof of voting. You can share this receipt URL at any time to
                      verify your participation. Receipt ID: <span className="font-mono">{receipt.voteId}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
                <button
                  onClick={printReceipt}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#0072CE] text-[#0072CE] rounded-xl font-semibold hover:bg-blue-50 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Copy Link
                </button>
              </div>

              <p className="text-center text-xs text-[#464B4B]/40 mt-4 print:block">
                WeVote — Forvis Mazars Voting Platform &nbsp;|&nbsp; Generated {new Date().toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}

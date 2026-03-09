import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RefreshCw,
  ArrowLeft,
  Wifi,
  WifiOff,
  Trophy,
} from 'lucide-react';
import api from '../services/api';
import { pdfService } from '../services/pdfExport';
import { Download } from 'lucide-react';

interface CandidateResult {
  CandidateID: number;
  FirstName: string;
  LastName: string;
  Department?: string;
  Category?: string;
  TotalVotes: number;
  MaxPossibleVotes?: number;
  IsElected?: boolean;
}

interface ResolutionResult {
  ResolutionID: number;
  Title?: string;
  ResolutionTitle?: string;
  YesVotes: number;
  NoVotes: number;
  AbstainVotes: number;
  TotalVotes: number;
  RequiredMajority?: number;
  Status?: string;
}

type Tab = 'candidates' | 'resolutions';

const VotingResults: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('candidates');
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [resolutions, setResolutions] = useState<ResolutionResult[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState('Active Session');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // Load active session and initial results
  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sessRes: any = await api.getActiveSession();
      const sessions = sessRes?.sessions || sessRes?.data || [];
      const session = Array.isArray(sessions) ? sessions[0] : sessions;
      if (!session) {
        setError('No active session found. Results are not yet available.');
        setLoading(false);
        return;
      }
      const sid: number = session.SessionID || session.sessionId;
      setSessionId(sid);
      setSessionTitle(session.Title || session.title || `Session #${sid}`);

      const [cRes, rRes]: any[] = await Promise.all([
        api.getCandidateResults(sid),
        api.getResolutionResults(sid),
      ]);
      setCandidates(cRes?.results || cRes?.data || []);
      setResolutions(rRes?.results || rRes?.data || []);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to SSE stream
  const subscribe = useCallback((sid: number) => {
    if (esRef.current) {
      esRef.current.close();
    }
    const es = api.streamResults(sid);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.candidates) setCandidates(data.candidates);
        if (data.resolutions) setResolutions(data.resolutions);
        setLastUpdate(new Date());
        setConnected(true);
      } catch {
        // ignore parse errors
      }
    };
  }, []);

  useEffect(() => {
    loadInitial();
    // Single cleanup — esRef always holds the latest EventSource
    return () => esRef.current?.close();
  }, [loadInitial]);

  useEffect(() => {
    if (sessionId) subscribe(sessionId);
    // No cleanup here — the first effect owns the ref lifecycle
  }, [sessionId, subscribe]);

  // ─── helpers ────────────────────────────────────────────────
  // Use reduce — spread into Math.max is stack-unsafe for large arrays
  const maxVotes = candidates.length
    ? candidates.reduce((max, c) => Math.max(max, c.TotalVotes || 0), 1)
    : 1;

  const exportPDF = () => {
    pdfService.generateAGMReport({
      sessionTitle,
      generatedAt: new Date(),
      candidates: candidates.map((c) => ({
        name: `${c.FirstName} ${c.LastName}`,
        position: c.Department || c.Category || '',
        votes: c.TotalVotes || 0,
        percentage: maxVotes > 0 ? ((c.TotalVotes || 0) / maxVotes) * 100 : 0,
      })),
      resolutions: resolutions.map((r) => {
        const total = (r.YesVotes || 0) + (r.NoVotes || 0) + (r.AbstainVotes || 0);
        return {
          number: `#${r.ResolutionID}`,
          title: r.ResolutionTitle || r.Title || `Resolution #${r.ResolutionID}`,
          yes: r.YesVotes || 0,
          no: r.NoVotes || 0,
          abstain: r.AbstainVotes || 0,
          totalVotes: total,
          passed: total > 0 && (r.YesVotes || 0) / total * 100 >= (r.RequiredMajority ?? 50),
        };
      }),
    });
  };

  const getResolutionBadge = (r: ResolutionResult) => {
    const total = r.YesVotes + r.NoVotes + r.AbstainVotes;
    const required = r.RequiredMajority ?? 50;
    if (total === 0) return { label: 'No Votes', cls: 'bg-gray-100 text-gray-600' };
    const yesPct = (r.YesVotes / total) * 100;
    if (yesPct >= required) return { label: 'PASSED', cls: 'bg-green-100 text-green-700' };
    return { label: 'FAILED', cls: 'bg-red-100 text-red-700' };
  };

  // ─── render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <BarChart3 className="w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold">Live Voting Results</h1>
              <p className="text-blue-100 text-sm">{sessionTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                connected ? 'bg-green-500/20 text-green-200' : 'bg-yellow-500/20 text-yellow-200'
              }`}
            >
              {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connected ? 'Live' : 'Reconnecting'}
              {lastUpdate && (
                <span className="text-xs opacity-75">
                  · {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <button
              onClick={exportPDF}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium disabled:opacity-40"
              title="Download PDF Report"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={loadInitial}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-0 flex gap-2">
          {(['candidates', 'resolutions'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-all rounded-t-xl ${
                activeTab === tab
                  ? 'bg-white text-[#0072CE]'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab === 'candidates' ? (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Candidates{!loading && ` (${candidates.length})`}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Resolutions{!loading && ` (${resolutions.length})`}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/5" />
                    <div className="h-3 bg-gray-100 rounded w-2/5" />
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded" />
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            {/* ── Candidates tab ── */}
            {activeTab === 'candidates' && (
              <motion.div
                key="candidates"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                {candidates.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No candidate results yet</p>
                  </div>
                ) : (
                  [...candidates]
                    .sort((a, b) => (b.TotalVotes || 0) - (a.TotalVotes || 0))
                    .map((c, i) => {
                      const pct = Math.round(((c.TotalVotes || 0) / maxVotes) * 100);
                      return (
                        <motion.div
                          key={c.CandidateID}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0072CE] to-[#171C8F] flex items-center justify-center text-white font-bold text-sm">
                                #{i + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {c.FirstName} {c.LastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {c.Department || c.Category || '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-[#0072CE]">
                                {c.TotalVotes || 0}
                              </span>
                              {c.IsElected ? (
                                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Elected
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                )}
              </motion.div>
            )}

            {/* ── Resolutions tab ── */}
            {activeTab === 'resolutions' && (
              <motion.div
                key="resolutions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                {resolutions.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No resolution results yet</p>
                  </div>
                ) : (
                  resolutions.map((r, i) => {
                    const total = (r.YesVotes || 0) + (r.NoVotes || 0) + (r.AbstainVotes || 0);
                    const yesPct = total > 0 ? Math.round(((r.YesVotes || 0) / total) * 100) : 0;
                    const noPct = total > 0 ? Math.round(((r.NoVotes || 0) / total) * 100) : 0;
                    // Use direct calculation — avoids rounding error accumulation
                    const abstainPct = total > 0 ? Math.round(((r.AbstainVotes || 0) / total) * 100) : 0;
                    const badge = getResolutionBadge(r);
                    return (
                      <motion.div
                        key={r.ResolutionID}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl shadow-md p-5"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <p className="font-semibold text-gray-800 flex-1 pr-4">
                            {r.ResolutionTitle || r.Title || `Resolution #${r.ResolutionID}`}
                          </p>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Segmented bar */}
                        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                          {yesPct > 0 && (
                            <motion.div
                              className="bg-green-500 h-full"
                              style={{ width: `${yesPct}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${yesPct}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          )}
                          {noPct > 0 && (
                            <motion.div
                              className="bg-red-500 h-full"
                              style={{ width: `${noPct}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${noPct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                            />
                          )}
                          {abstainPct > 0 && (
                            <motion.div
                              className="bg-gray-300 h-full"
                              style={{ width: `${abstainPct}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${abstainPct}%` }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                            />
                          )}
                          {total === 0 && (
                            <div className="bg-gray-100 h-full w-full" />
                          )}
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <strong>{r.YesVotes || 0}</strong> In Favour ({yesPct}%)
                          </span>
                          <span className="flex items-center gap-1.5 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <strong>{r.NoVotes || 0}</strong> Against ({noPct}%)
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <MinusCircle className="w-4 h-4" />
                            <strong>{r.AbstainVotes || 0}</strong> Abstain
                          </span>
                        </div>

                        {r.RequiredMajority && (
                          <p className="text-xs text-gray-400 mt-2">
                            Required majority: {r.RequiredMajority}%
                          </p>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default VotingResults;

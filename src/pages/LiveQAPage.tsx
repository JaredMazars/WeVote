import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { qaService, type Question } from '../services/qaService';
import { useAuth } from '../contexts/AuthContext';

export default function LiveQAPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [stats, setStats] = useState<any>(null);
  const [isAdmin] = useState(user?.role === 'admin');

  useEffect(() => {
    loadQuestions();
    loadStats();

    // Listen for Q&A events
    const handleQuestionSubmitted = () => {
      loadQuestions();
      loadStats();
    };
    const handleQuestionUpdated = () => {
      loadQuestions();
      loadStats();
    };

    window.addEventListener('questionSubmitted', handleQuestionSubmitted);
    window.addEventListener('questionUpdated', handleQuestionUpdated);

    return () => {
      window.removeEventListener('questionSubmitted', handleQuestionSubmitted);
      window.removeEventListener('questionUpdated', handleQuestionUpdated);
    };
  }, []);

  const loadQuestions = () => {
    const allQuestions = qaService.getAllQuestions();
    setQuestions(allQuestions);
  };

  const loadStats = () => {
    const qaStats = qaService.getQAStats();
    setStats(qaStats);
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim() || !user) return;

    qaService.submitQuestion({
      userId: user.email,
      userName: user.name,
      userEmail: user.email,
      question: newQuestion.trim(),
      meetingId: 'MTG-001', // Link to current meeting
      category: 'general',
      priority: 'medium',
    });

    setNewQuestion('');
  };

  const handleUpvote = (questionId: string) => {
    if (!user) return;
    qaService.upvoteQuestion(questionId, user.email);
    loadQuestions();
  };

  const handleApprove = (questionId: string) => {
    qaService.updateQuestionStatus(questionId, 'approved');
    loadQuestions();
  };

  const handleReject = (questionId: string) => {
    qaService.updateQuestionStatus(questionId, 'rejected');
    loadQuestions();
  };

  const handleAnswer = (questionId: string, answer: string) => {
    qaService.answerQuestion(questionId, answer, user?.name || 'Admin');
  };

  const filteredQuestions = filterStatus === 'all'
    ? questions
    : questions.filter(q => q.status === filterStatus);

  const sortedQuestions = [...filteredQuestions].sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            💬 Live Q&A System
          </h1>
          <p className="text-slate-600">
            Submit questions, vote on popular ones, and get answers in real-time
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <p className="text-sm text-slate-600 mb-1">Total Questions</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <p className="text-sm text-slate-600 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.byStatus.pending || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <p className="text-sm text-slate-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.byStatus.approved || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <p className="text-sm text-slate-600 mb-1">Answered</p>
              <p className="text-3xl font-bold text-blue-600">{stats.byStatus.answered || 0}</p>
            </motion.div>
          </div>
        )}

        {/* Submit Question Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4">Ask a Question</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitQuestion()}
              placeholder="Type your question here..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Question
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            ℹ️ Your question will be reviewed before appearing publicly
          </p>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending ({questions.filter(q => q.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Approved ({questions.filter(q => q.status === 'approved').length})
            </button>
            {isAdmin && (
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'rejected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Rejected ({questions.filter(q => q.status === 'rejected').length})
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedQuestions.map((question) => (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex gap-4">
                  {/* Upvote Section */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleUpvote(question.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        question.upvotedBy.includes(user?.email || '')
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ▲
                    </button>
                    <span className="text-lg font-bold text-slate-700">
                      {question.upvotes}
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-lg font-medium text-slate-900 mb-2">
                          {question.question}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span>👤 {question.userName}</span>
                          <span>•</span>
                          <span>🕒 {new Date(question.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          question.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : question.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : question.status === 'answered'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                      </span>
                    </div>

                    {/* Answer Section */}
                    {question.answer && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          ✅ Answer from {question.answeredBy}:
                        </p>
                        <p className="text-slate-700">{question.answer}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(question.answeredAt!).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="mt-4 flex gap-2">
                        {question.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(question.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReject(question.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {(question.status === 'approved' && !question.answer) && (
                          <button
                            onClick={() => {
                              const answer = prompt('Enter your answer:');
                              if (answer) handleAnswer(question.id, answer);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            💬 Answer Question
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sortedQuestions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <span className="text-6xl">💬</span>
              <p className="text-slate-500 text-lg mt-4">No questions yet</p>
              <p className="text-slate-400">Be the first to ask a question!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

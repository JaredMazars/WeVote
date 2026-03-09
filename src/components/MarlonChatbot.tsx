import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Trash2, MessageCircle, Maximize2, Minimize2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Marlon avatar SVG — professional assistant character with WeVote brand colours
function MarlonSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="200" cy="200" r="190" fill="#0072CE" />
      {/* Inner face circle */}
      <circle cx="200" cy="215" r="140" fill="#171C8F" />
      {/* Head highlight */}
      <ellipse cx="200" cy="120" rx="90" ry="70" fill="#0072CE" />
      {/* Eyes */}
      <circle cx="155" cy="180" r="32" fill="white" />
      <circle cx="245" cy="180" r="32" fill="white" />
      {/* Pupils */}
      <circle cx="162" cy="186" r="16" fill="#0072CE" />
      <circle cx="252" cy="186" r="16" fill="#0072CE" />
      {/* Eye shine */}
      <circle cx="168" cy="178" r="6" fill="white" />
      <circle cx="258" cy="178" r="6" fill="white" />
      {/* Smile */}
      <path d="M155 260 Q200 300 245 260" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Collar / tie area */}
      <path d="M130 340 L200 370 L270 340 L255 310 L200 330 L145 310 Z" fill="white" opacity="0.9" />
      {/* Letter M on chest */}
      <text x="200" y="325" textAnchor="middle" fill="#0072CE" fontSize="40" fontWeight="bold" fontFamily="Arial, sans-serif">M</text>
    </svg>
  );
}

function formatMarkdown(text: string): string {
  const html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded p-3 my-2 overflow-x-auto text-xs"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold mt-3 mb-1">$1</h2>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

const SUGGESTIONS = [
  'How do I cast my vote?',
  'What is proxy voting and how does it work?',
  'How can I verify my vote was counted?',
  'What are the types of resolutions I can vote on?',
];

export default function MarlonChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasLoadedHistory) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/history`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setHasLoadedHistory(true);
      }
    } catch (err) {
      console.error('Failed to load Marlon chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all chat history with Marlon?')) return;
    try {
      await fetch(`${API_BASE_URL}/chat/history`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setMessages([]);
      setHasLoadedHistory(false);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative group">
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Ask Marlon anything!
                <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ring-4 ring-blue-400/30"
              style={{ background: 'linear-gradient(135deg, #0072CE, #171C8F)' }}
              aria-label="Open Marlon AI assistant"
            >
              <MarlonSvg size={44} />
            </button>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden marlon-slide-in transition-all duration-300 ${
            isExpanded
              ? 'top-0 right-0 w-1/2 h-full rounded-none'
              : 'bottom-6 right-6 w-[420px] h-[560px] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 shrink-0"
            style={{ background: 'linear-gradient(to right, #0072CE, #171C8F)' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <MarlonSvg size={34} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">Marlon</h3>
              <p className="text-blue-100 text-xs">WeVote AI Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Clear chat history"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title={isExpanded ? 'Collapse chat' : 'Expand chat'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3 animate-spin"
                    style={{ borderColor: '#0072CE', borderTopColor: 'transparent' }}
                  />
                  <p className="text-sm text-gray-500">Loading history...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="mb-4">
                  <MarlonSvg size={80} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Hi, I&apos;m Marlon!
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Your WeVote AI assistant. Ask me anything about voting, proxies, or navigating the platform!
                </p>
                <div className="space-y-2 w-full">
                  {SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-700 transition-colors"
                    >
                      <MessageCircle size={12} className="inline mr-2 opacity-50" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <MarlonSvg size={20} />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { background: 'linear-gradient(to right, #0072CE, #171C8F)' }
                          : {}
                      }
                    >
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose prose-sm max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_pre]:my-2 [&_code]:text-xs"
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                        />
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <MarlonSvg size={20} />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Marlon anything..."
                disabled={isLoading}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50"
                style={{ '--tw-ring-color': '#0072CE' } as React.CSSProperties}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                style={{ background: 'linear-gradient(to right, #0072CE, #171C8F)' }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Marlon may make mistakes. Please verify critical voting information with your administrator.
            </p>
          </div>
        </div>
      )}

      <style>{`
        .marlon-slide-in {
          animation: marlonSlideIn 0.3s ease-out;
        }
        @keyframes marlonSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

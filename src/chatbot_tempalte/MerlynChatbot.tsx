'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Trash2, MessageCircle, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { useEngagement } from '@/contexts/EngagementContext';
import { noteSections } from './NotesSidebar';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface MerlynChatbotProps {
  sectionId: string;
}

function MerlynSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="150" fill="#1e4fa3" />
      <path d="M80 110 Q100 20 160 110 Z" fill="#1e4fa3"/>
      <path d="M95 110 Q110 55 150 110 Z" fill="#4a6fc4"/>
      <path d="M320 110 Q300 20 240 110 Z" fill="#1e4fa3"/>
      <path d="M305 110 Q285 55 250 110 Z" fill="#4a6fc4"/>
      <circle cx="200" cy="210" r="120" fill="#4a6fc4" />
      <circle cx="150" cy="170" r="40" fill="white" />
      <circle cx="250" cy="170" r="40" fill="white" />
      <circle cx="150" cy="170" r="20" fill="#57c7ff" />
      <circle cx="250" cy="170" r="20" fill="#57c7ff" />
      <circle cx="150" cy="170" r="10" fill="black" />
      <circle cx="250" cy="170" r="10" fill="black" />
      <ellipse cx="200" cy="250" rx="65" ry="45" fill="#a0a0a0" />
      <ellipse cx="200" cy="205" rx="45" ry="28" fill="#d0d0d0" />
      <path d="M170 200 Q200 175 230 200 Q225 215 200 220 Q175 215 170 200 Z" fill="black" />
      <path d="M185 230 Q200 245 215 230" stroke="black" strokeWidth="4" fill="none" />
      <path d="M80 120 Q200 20 320 120" fill="#1e4fa3" />
      <path d="M100 300 Q200 350 300 300" fill="#1e4fa3" />
    </svg>
  );
}

function formatMarkdown(text: string): string {
  // Simple markdown-to-HTML for assistant messages
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 rounded p-3 my-2 overflow-x-auto text-sm"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold mt-3 mb-1">$1</h2>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks (double newline = paragraph)
    .replace(/\n\n/g, '</p><p class="mt-2">')
    // Single newlines
    .replace(/\n/g, '<br/>');

  return `<p>${html}</p>`;
}

export default function MerlynChatbot({ sectionId }: MerlynChatbotProps) {
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
  const { selectedEntity } = useEngagement();

  // Look up the section title and description
  const section = noteSections.find((s) => s.id === sectionId);
  const sectionTitle = section?.title || sectionId;
  const sectionDescription = section?.description || '';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && selectedEntity && !hasLoadedHistory) {
      loadHistory();
    }
  }, [isOpen, selectedEntity, sectionId]);

  // Reset history loaded state when section changes
  useEffect(() => {
    setHasLoadedHistory(false);
    setMessages([]);
  }, [sectionId]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    if (!selectedEntity) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/chat?entityId=${selectedEntity.id}&noteSection=${sectionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setHasLoadedHistory(true);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedEntity) return;

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: selectedEntity.id,
          noteSection: sectionId,
          message: userMessage.content,
          sectionTitle,
          sectionDescription,
        }),
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
    if (!selectedEntity) return;
    if (!confirm('Clear all chat history for this note section?')) return;

    try {
      await fetch(
        `/api/chat?entityId=${selectedEntity.id}&noteSection=${sectionId}`,
        { method: 'DELETE' }
      );
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openInNewWindow = () => {
    if (!selectedEntity) return;
    const params = new URLSearchParams({
      entityId: selectedEntity.id,
      noteSection: sectionId,
      sectionTitle,
      sectionDescription,
    });
    window.open(
      `/chat-window?${params.toString()}`,
      'merlyn-chat',
      'width=700,height=800,resizable=yes,scrollbars=yes'
    );
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative group">
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Ask Merlyn anything!
                <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-100" />
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ring-4 ring-blue-400/30 animate-pulse hover:animate-none"
              aria-label="Open Merlyn AI assistant"
            >
              <MerlynSvg size={44} />
            </button>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in transition-all duration-300 ${
            isExpanded
              ? 'top-0 right-0 w-1/2 h-full rounded-none'
              : 'bottom-6 right-6 w-[420px] h-[560px] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <MerlynSvg size={34} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">Merlyn</h3>
              <p className="text-blue-100 text-xs truncate">{sectionTitle}</p>
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
                onClick={openInNewWindow}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Open in new window"
              >
                <ExternalLink size={16} />
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading history...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="mb-4">
                  <MerlynSvg size={80} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Hi, I&apos;m Merlyn!
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Your AFS assistant for <span className="font-medium text-blue-600 dark:text-blue-400">{sectionTitle}</span>. Ask me anything about this note disclosure!
                </p>
                <div className="space-y-2 w-full">
                  {[
                    `What are the key disclosure requirements for ${sectionTitle}?`,
                    'Help me draft a disclosure paragraph',
                    'What IFRS standard applies here?',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="w-full text-left px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <MerlynSvg size={20} />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_pre]:my-2 [&_code]:text-xs"
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
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <MerlynSvg size={20} />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Merlyn anything..."
                disabled={isLoading}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
              Merlyn may make mistakes. Always verify disclosures against IFRS standards.
            </p>
          </div>
        </div>
      )}

      {/* CSS animation */}
      <style jsx>{`
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
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


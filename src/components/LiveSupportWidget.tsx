import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export default function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeView, setActiveView] = useState<'chat' | 'tickets'>('chat');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Load chat history
    const stored = localStorage.getItem('supportMessages');
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Welcome message
      const welcomeMsg: Message = {
        id: '1',
        text: 'Welcome to WeVote 24/7 Support! 👋 How can I help you today?',
        sender: 'support',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }

    // Load tickets
    const storedTickets = localStorage.getItem('supportTickets');
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('supportMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setIsTyping(true);

    // Auto-response after 1-2 seconds
    setTimeout(() => {
      const response = generateAutoResponse(inputText);
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'support',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, supportMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAutoResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes('vote') || lowerMsg.includes('voting')) {
      return 'I can help with voting! To cast your vote, go to the Voting page and select either Candidate Voting or Resolution Voting. Need step-by-step instructions?';
    }
    if (lowerMsg.includes('proxy')) {
      return 'To assign a proxy, visit the Proxy Assignment page. You can choose between Discretionary Proxy (proxy votes at their discretion) or Instructional Proxy (you provide specific instructions). Would you like more details?';
    }
    if (lowerMsg.includes('password') || lowerMsg.includes('login')) {
      return 'For password issues, use the "Forgot Password" link on the login page. You\'ll receive a password reset email. If you don\'t receive it, check your spam folder.';
    }
    if (lowerMsg.includes('meeting')) {
      return 'You can view upcoming meetings on the Meetings page. Check-in is available 30 minutes before the meeting starts. Need help with meeting attendance or quorum requirements?';
    }
    if (lowerMsg.includes('admin') || lowerMsg.includes('permission')) {
      return 'Admin permissions are controlled by your account role. Contact your system administrator to request elevated permissions or role changes.';
    }
    if (lowerMsg.includes('audit') || lowerMsg.includes('log')) {
      return 'Audit logs are available in the Auditor Portal (for auditors) or Admin Dashboard (for admins). All actions are logged with tamper-evident hashing for compliance.';
    }
    if (lowerMsg.includes('export') || lowerMsg.includes('excel')) {
      return 'You can export data to Excel from multiple locations: Admin Dashboard (all tabs), Auditor Portal (audit logs & attendance), and Meeting Management. Look for the "Export to Excel" button.';
    }
    if (lowerMsg.includes('quorum')) {
      return 'Quorum tracking is available in the Auditor Portal and Meeting Management pages. The system automatically calculates attendance percentage and alerts when quorum is met or lost.';
    }
    if (lowerMsg.includes('help') || lowerMsg.includes('support')) {
      return 'I\'m here 24/7! Common topics: voting, proxies, meetings, passwords, admin access, audit logs, quorum tracking. What do you need help with?';
    }
    if (lowerMsg.includes('ticket')) {
      return 'I can create a support ticket for you. Please describe your issue in detail, and I\'ll escalate it to our support team. Would you like me to create a ticket?';
    }
    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
      return 'You\'re welcome! Is there anything else I can help you with today? 😊';
    }

    // Default response
    return 'Thanks for your message! For specific assistance, please describe your issue or question. You can also create a support ticket by clicking the "Tickets" tab. Our team typically responds within 1 hour.';
  };

  const createTicket = () => {
    const subject = prompt('Enter ticket subject:');
    if (!subject) return;

    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      subject,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    const updatedTickets = [...tickets, newTicket];
    setTickets(updatedTickets);
    localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));

    const confirmMessage: Message = {
      id: Date.now().toString(),
      text: `✓ Ticket created successfully! Ticket #${newTicket.id} - "${subject}". Our team will respond within 1 hour.`,
      sender: 'support',
      timestamp: new Date().toISOString()
    };
    setMessages([...messages, confirmMessage]);
    setActiveView('chat');
  };

  const quickActions = [
    { label: 'How to vote?', action: 'How do I cast my vote?' },
    { label: 'Proxy setup', action: 'How do I assign a proxy?' },
    { label: 'Meeting attendance', action: 'How do I check in to a meeting?' },
    { label: 'Password reset', action: 'I need to reset my password' }
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-full shadow-2xl flex items-center justify-center z-50 cursor-pointer hover:shadow-3xl transition-shadow"
          >
            <MessageCircle size={28} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
              !
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">24/7 Live Support</h3>
                <p className="text-xs opacity-90">We're here to help!</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveView('chat')}
                className={`flex-1 py-3 font-semibold transition-colors ${
                  activeView === 'chat'
                    ? 'text-[#0072CE] border-b-2 border-[#0072CE]'
                    : 'text-slate-500'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveView('tickets')}
                className={`flex-1 py-3 font-semibold transition-colors ${
                  activeView === 'tickets'
                    ? 'text-[#0072CE] border-b-2 border-[#0072CE]'
                    : 'text-slate-500'
                }`}
              >
                🎫 Tickets ({tickets.filter(t => t.status === 'open').length})
              </button>
            </div>

            {/* Chat View */}
            {activeView === 'chat' && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${
                        msg.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'user'
                            ? 'bg-[#0072CE]'
                            : 'bg-gradient-to-r from-emerald-500 to-green-600'
                        } text-white`}
                      >
                        {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-[#0072CE] text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                        <Bot size={16} />
                      </div>
                      <div className="bg-slate-100 p-3 rounded-2xl">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {messages.length === 1 && (
                  <div className="p-4 border-t bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Quick Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((qa) => (
                        <button
                          key={qa.label}
                          onClick={() => {
                            setInputText(qa.action);
                            handleSendMessage();
                          }}
                          className="text-xs p-2 bg-white border border-slate-200 rounded-lg hover:border-[#0072CE] hover:text-[#0072CE] transition-colors"
                        >
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-shadow"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Tickets View */}
            {activeView === 'tickets' && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎫</div>
                      <p className="text-slate-600 mb-4">No support tickets yet</p>
                      <button
                        onClick={createTicket}
                        className="px-6 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold"
                      >
                        Create Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">#{ticket.id}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              ticket.status === 'open'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{ticket.subject}</p>
                          <p className="text-xs text-slate-500">
                            Created: {new Date(ticket.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {tickets.length > 0 && (
                  <div className="p-4 border-t">
                    <button
                      onClick={createTicket}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                    >
                      + Create New Ticket
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  Paperclip,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'admin' | 'moderator';
  senderName: string;
  timestamp: Date;
  type: 'text' | 'system' | 'file';
  isRead?: boolean;
  replyTo?: string;
}

interface ChatUser {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  avatar?: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChatUser;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMode, setChatMode] = useState<'ai' | 'human'>('ai');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock AI responses for voting-related questions
  const aiResponses = {
    voting: [
      "You can vote for employees by navigating to the Employee Voting section and selecting your preferred candidate.",
      "Each user gets one vote per employee or resolution. You can change your vote before the voting period ends.",
      "Voting is anonymous by default, but you can choose to make your vote public in your profile settings."
    ],
    process: [
      "The voting process consists of three phases: nomination, voting, and results announcement.",
      "Voting periods are typically open for 7 days, and you'll receive notifications when voting opens and closes.",
      "Results are calculated in real-time and displayed immediately after the voting period ends."
    ],
    technical: [
      "If you're experiencing technical issues, try refreshing the page or clearing your browser cache.",
      "For login issues, ensure you're using the correct credentials or contact IT support.",
      "The platform works best on modern browsers like Chrome, Firefox, or Safari."
    ],
    general: [
      "I'm here to help with any questions about the voting platform or AGM process.",
      "You can switch to human support anytime by clicking the 'Talk to Person' button.",
      "For urgent matters, please contact our support team directly."
    ]
  };

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: `Welcome to AGM Support Chat! I'm your AI assistant. I can help you with voting questions, technical issues, or connect you with a human representative. How can I assist you today?`,
        sender: 'ai',
        senderName: 'AGM Assistant',
        timestamp: new Date(),
        type: 'text',
        isRead: true
      };
      setMessages([welcomeMessage]);
      setIsConnected(true);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate connection status
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsConnected(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Mock online users
  useEffect(() => {
    setOnlineUsers([
      { id: '1', name: 'Sarah Johnson', role: 'admin', isOnline: true, avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
      { id: '2', name: 'Mike Chen', role: 'moderator', isOnline: true, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100' },
      { id: '3', name: 'AGM Assistant', role: 'user', isOnline: true }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAiResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('vote') || message.includes('voting') || message.includes('election')) {
      return aiResponses.voting[Math.floor(Math.random() * aiResponses.voting.length)];
    } else if (message.includes('process') || message.includes('how') || message.includes('when')) {
      return aiResponses.process[Math.floor(Math.random() * aiResponses.process.length)];
    } else if (message.includes('error') || message.includes('problem') || message.includes('issue') || message.includes('bug')) {
      return aiResponses.technical[Math.floor(Math.random() * aiResponses.technical.length)];
    } else {
      return aiResponses.general[Math.floor(Math.random() * aiResponses.general.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      sender: 'user',
      senderName: currentUser.name,
      timestamp: new Date(),
      type: 'text',
      isRead: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate AI or human response
    if (chatMode === 'ai') {
      setIsAiTyping(true);
      
      setTimeout(() => {
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: getAiResponse(newMessage),
          sender: 'ai',
          senderName: 'AGM Assistant',
          timestamp: new Date(),
          type: 'text',
          isRead: true
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsAiTyping(false);
      }, 1500 + Math.random() * 1000);
    } else {
      // Simulate human response (in real implementation, this would be handled by WebSocket)
      setTimeout(() => {
        const humanResponse: Message = {
          id: `human-${Date.now()}`,
          content: "Thank you for your message. A support representative will respond shortly. In the meantime, you can also try our AI assistant for immediate help.",
          sender: 'admin',
          senderName: 'Support Team',
          timestamp: new Date(),
          type: 'text',
          isRead: true
        };
        
        setMessages(prev => [...prev, humanResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchToHuman = () => {
    setChatMode('human');
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content: "You've been connected to human support. A representative will assist you shortly.",
      sender: 'admin',
      senderName: 'System',
      timestamp: new Date(),
      type: 'system',
      isRead: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const switchToAI = () => {
    setChatMode('ai');
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content: "You're now chatting with our AI assistant. I can help with voting questions and technical support.",
      sender: 'ai',
      senderName: 'AGM Assistant',
      timestamp: new Date(),
      type: 'system',
      isRead: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'ai': return <Bot className="h-4 w-4" />;
      case 'admin': return <User className="h-4 w-4" />;
      case 'moderator': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case 'ai': return 'from-blue-500 to-blue-600';
      case 'admin': return 'from-green-500 to-green-600';
      case 'moderator': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        } transition-all duration-300 flex flex-col overflow-hidden`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageCircle className="h-6 w-6 text-white" />
                {!isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
                {isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                )}
              </div>
              <div className="text-white">
                <h3 className="font-semibold text-sm">AGM Support Chat</h3>
                <p className="text-xs text-blue-100">
                  {isConnected ? (
                    chatMode === 'ai' ? 'AI Assistant' : 'Human Support'
                  ) : 'Connecting...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isMinimized && (
                <>
                  <button
                    onClick={() => setShowUserList(!showUserList)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Online Users"
                  >
                    <Users className="h-4 w-4 text-white" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="More Options"
                  >
                    <MoreVertical className="h-4 w-4 text-white" />
                  </button>
                </>
              )}
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4 text-white" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-white" />
                )}
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Chat"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode Switcher */}
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex bg-white rounded-lg p-1 shadow-sm">
                    <button
                      onClick={switchToAI}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        chatMode === 'ai'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Bot className="h-3 w-3 inline mr-1" />
                      AI Assistant
                    </button>
                    <button
                      onClick={switchToHuman}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        chatMode === 'human'
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <User className="h-3 w-3 inline mr-1" />
                      Human Support
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-500">
                      {onlineUsers.length} online
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.sender !== 'user' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getSenderColor(message.sender)} flex items-center justify-center text-white`}>
                            {getSenderIcon(message.sender)}
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                          : message.type === 'system'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        
                        {message.sender === 'user' && (
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs text-blue-100">
                              {formatTime(message.timestamp)}
                            </span>
                            <CheckCircle className="h-3 w-3 text-blue-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* AI Typing Indicator */}
                {isAiTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center space-x-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setNewMessage("How do I vote for an employee?")}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                  >
                    How to vote?
                  </button>
                  <button
                    onClick={() => setNewMessage("I'm having technical issues")}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                  >
                    Technical help
                  </button>
                  <button
                    onClick={() => setNewMessage("When does voting end?")}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                  >
                    Voting timeline
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${chatMode === 'ai' ? 'AI Assistant' : 'Support Team'}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072CE] focus:border-transparent resize-none text-sm"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="p-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Press Enter to send</span>
                  <div className="flex items-center space-x-2">
                    {chatMode === 'human' && (
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Avg response: 2-5 min</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Online Users Sidebar */}
        <AnimatePresence>
          {showUserList && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-full top-0 mr-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Online Support ({onlineUsers.length})</h3>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatWindow;
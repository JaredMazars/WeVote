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
  Video,
  Youtube,
  History,
  Shield,
  UserCheck
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'admin' | 'moderator';
  senderName: string;
  senderId?: number;
  timestamp: Date;
  type: 'text' | 'system' | 'file' | 'video';
  isRead?: boolean;
  replyTo?: string;
  metadata?: any;
}

interface ChatUser {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  avatar?: string;
}

interface VideoEmbed {
  id: string;
  url: string;
  type: 'youtube' | 'vimeo';
  videoId: string;
  embeddedBy: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  mode: string;
  status: string;
  started_at: string;
  message_count: number;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChatUser;
}

const EnhancedChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMode, setChatMode] = useState<'ai' | 'human'>('ai');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [availableModerators, setAvailableModerators] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [assignedModerator, setAssignedModerator] = useState<ChatUser | null>(null);
  const [videoEmbeds, setVideoEmbeds] = useState<VideoEmbed[]>([]);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatSubscriptionRef = useRef<any>(null);

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

  useEffect(() => {
    if (isOpen && !currentSessionId) {
      initializeChatSession();
    }

    return () => {
      if (chatSubscriptionRef.current) {
        supabase.removeChannel(chatSubscriptionRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (currentSessionId) {
      subscribeToMessages();
      loadVideoEmbeds();
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (chatMode === 'human') {
      loadAvailableModerators();
    }
  }, [chatMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatSession = async () => {
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: parseInt(currentUser.id),
          mode: 'ai',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(session.id);
      setIsConnected(true);

      await addSystemMessage(
        session.id,
        "Welcome to AGM Support Chat! I'm your AI assistant. I can help you with voting questions, technical issues, or connect you with a human representative. How can I assist you today?",
        'ai',
        'AGM Assistant'
      );

      await loadMessages(session.id);
    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_type,
        senderName: msg.sender_name,
        senderId: msg.sender_id,
        timestamp: new Date(msg.created_at),
        type: msg.message_type,
        isRead: msg.is_read,
        metadata: msg.metadata
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${currentSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${currentSessionId}`
        },
        (payload) => {
          const newMsg = payload.new;
          const formattedMessage: Message = {
            id: newMsg.id,
            content: newMsg.content,
            sender: newMsg.sender_type,
            senderName: newMsg.sender_name,
            senderId: newMsg.sender_id,
            timestamp: new Date(newMsg.created_at),
            type: newMsg.message_type,
            isRead: newMsg.is_read,
            metadata: newMsg.metadata
          };
          setMessages(prev => [...prev, formattedMessage]);
        }
      )
      .subscribe();

    chatSubscriptionRef.current = channel;
  };

  const loadAvailableModerators = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_moderators')
        .select('*')
        .eq('is_available', true)
        .lt('current_sessions_count', supabase.raw('max_sessions'));

      if (error) throw error;

      const moderators: ChatUser[] = data.map(mod => ({
        id: mod.user_id.toString(),
        name: `Moderator ${mod.user_id}`,
        role: 'moderator',
        isOnline: true,
        avatar: undefined
      }));

      setAvailableModerators(moderators);
    } catch (error) {
      console.error('Error loading moderators:', error);
    }
  };

  const addSystemMessage = async (
    sessionId: string,
    content: string,
    senderType: string,
    senderName: string
  ) => {
    try {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender_type: senderType,
        sender_name: senderName,
        content: content,
        message_type: 'system',
        is_read: true
      });
    } catch (error) {
      console.error('Error adding system message:', error);
    }
  };

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
    if (!newMessage.trim() || !currentSessionId) return;

    try {
      const { error } = await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        sender_id: parseInt(currentUser.id),
        sender_type: 'user',
        sender_name: currentUser.name,
        content: newMessage,
        message_type: 'text',
        is_read: true
      });

      if (error) throw error;

      const userMessageContent = newMessage;
      setNewMessage('');

      if (chatMode === 'ai') {
        setIsAiTyping(true);

        setTimeout(async () => {
          const aiResponseContent = getAiResponse(userMessageContent);

          await supabase.from('chat_messages').insert({
            session_id: currentSessionId,
            sender_type: 'ai',
            sender_name: 'AGM Assistant',
            content: aiResponseContent,
            message_type: 'text',
            is_read: true
          });

          setIsAiTyping(false);
        }, 1500 + Math.random() * 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchToHuman = async () => {
    if (!currentSessionId) return;

    try {
      await loadAvailableModerators();

      if (availableModerators.length === 0) {
        await addSystemMessage(
          currentSessionId,
          "All moderators are currently busy. You'll be connected to the next available representative. Estimated wait time: 2-5 minutes.",
          'admin',
          'System'
        );
        return;
      }

      const moderator = availableModerators[0];

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          mode: 'human',
          assigned_moderator_id: parseInt(moderator.id)
        })
        .eq('id', currentSessionId);

      if (error) throw error;

      setChatMode('human');
      setAssignedModerator(moderator);

      await addSystemMessage(
        currentSessionId,
        `You've been connected to ${moderator.name}. A representative will assist you shortly.`,
        'admin',
        'System'
      );

      await supabase
        .from('chat_moderators')
        .update({
          current_sessions_count: supabase.raw('current_sessions_count + 1'),
          last_active_at: new Date().toISOString()
        })
        .eq('user_id', parseInt(moderator.id));

    } catch (error) {
      console.error('Error switching to human support:', error);
    }
  };

  const switchToAI = async () => {
    if (!currentSessionId) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          mode: 'ai',
          assigned_moderator_id: null
        })
        .eq('id', currentSessionId);

      if (error) throw error;

      setChatMode('ai');
      setAssignedModerator(null);

      await addSystemMessage(
        currentSessionId,
        "You're now chatting with our AI assistant. I can help with voting questions and technical support.",
        'ai',
        'AGM Assistant'
      );
    } catch (error) {
      console.error('Error switching to AI:', error);
    }
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleEmbedVideo = async () => {
    if (!videoUrl.trim() || !currentSessionId) return;

    const videoId = extractYouTubeVideoId(videoUrl);

    if (!videoId) {
      alert('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_video_embeds')
        .insert({
          session_id: currentSessionId,
          video_url: videoUrl,
          video_type: 'youtube',
          video_id: videoId,
          embedded_by: parseInt(currentUser.id)
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        sender_id: parseInt(currentUser.id),
        sender_type: currentUser.role,
        sender_name: currentUser.name,
        content: `Shared a video: ${videoUrl}`,
        message_type: 'video',
        metadata: { videoId, videoUrl },
        is_read: true
      });

      setVideoUrl('');
      setShowVideoInput(false);
      await loadVideoEmbeds();
    } catch (error) {
      console.error('Error embedding video:', error);
      alert('Failed to embed video. Please try again.');
    }
  };

  const loadVideoEmbeds = async () => {
    if (!currentSessionId) return;

    try {
      const { data, error } = await supabase
        .from('chat_video_embeds')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const embeds: VideoEmbed[] = data.map(embed => ({
        id: embed.id,
        url: embed.video_url,
        type: embed.video_type,
        videoId: embed.video_id,
        embeddedBy: embed.embedded_by,
        timestamp: new Date(embed.created_at)
      }));

      setVideoEmbeds(embeds);
    } catch (error) {
      console.error('Error loading video embeds:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          mode,
          status,
          started_at,
          chat_messages (count)
        `)
        .eq('user_id', parseInt(currentUser.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const sessions: ChatSession[] = data.map(session => ({
        id: session.id,
        mode: session.mode,
        status: session.status,
        started_at: session.started_at,
        message_count: session.chat_messages?.[0]?.count || 0
      }));

      setChatHistory(sessions);
      setShowChatHistory(true);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadHistoricalSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
    await loadVideoEmbeds();
    setShowChatHistory(false);
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
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'moderator': return <UserCheck className="h-4 w-4" />;
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
          isMinimized ? 'w-80 h-16' : 'w-[450px] h-[700px]'
        } transition-all duration-300 flex flex-col overflow-hidden`}>

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
                    chatMode === 'ai' ? 'AI Assistant' : assignedModerator ? `With ${assignedModerator.name}` : 'Human Support'
                  ) : 'Connecting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isMinimized && (
                <>
                  <button
                    onClick={loadChatHistory}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Chat History"
                  >
                    <History className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => setShowUserList(!showUserList)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Online Users"
                  >
                    <Users className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => setShowVideoInput(!showVideoInput)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Embed YouTube Video"
                  >
                    <Youtube className="h-4 w-4 text-white" />
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
                      {availableModerators.length} available
                    </span>
                  </div>
                </div>
              </div>

              {showVideoInput && (
                <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Paste YouTube video URL..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={handleEmbedVideo}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Embed
                    </button>
                  </div>
                </div>
              )}

              {videoEmbeds.length > 0 && (
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <Youtube className="h-4 w-4 mr-1 text-red-600" />
                    Live Video Stream
                  </h4>
                  <div className="space-y-2">
                    {videoEmbeds.slice(0, 1).map((embed) => (
                      <div key={embed.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                        <div className="aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${embed.videoId}?autoplay=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

                        {message.type === 'video' && message.metadata?.videoId && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            <iframe
                              width="100%"
                              height="150"
                              src={`https://www.youtube.com/embed/${message.metadata.videoId}`}
                              title="YouTube video"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}

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

        <AnimatePresence>
          {showChatHistory && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-full top-0 mr-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[600px]"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Chat History</h3>
                <button
                  onClick={() => setShowChatHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-2 overflow-y-auto max-h-[520px]">
                {chatHistory.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadHistoricalSession(session.id)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 mb-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {session.mode} Chat
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(session.started_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {session.message_count} messages
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUserList && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-full top-0 mr-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Available Support ({availableModerators.length})</h3>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {availableModerators.map((moderator) => (
                  <div key={moderator.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="relative">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-purple-600" />
                      </div>
                      {moderator.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{moderator.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{moderator.role}</p>
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

export default EnhancedChatWindow;

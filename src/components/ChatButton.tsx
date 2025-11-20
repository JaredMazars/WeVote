import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';

interface ChatUser {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  avatar?: string;
}

const ChatButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Mock current user - in real app, this would come from auth context
  const currentUser: ChatUser = {
    id: 'current-user',
    name: 'John Doe',
    role: 'user',
    isOnline: true,
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setHasUnreadMessages(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isChatOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] hover:shadow-xl'
        }`}
        title={isChatOpen ? 'Close Chat' : 'Open Support Chat'}
      >
        <motion.div
          animate={{ rotate: isChatOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isChatOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </motion.div>
        
        {/* Unread Messages Indicator */}
        {hasUnreadMessages && !isChatOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs text-white font-bold">!</span>
          </motion.div>
        )}
        
        {/* Pulse Animation for New Messages */}
        {hasUnreadMessages && !isChatOpen && (
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
        )}
      </motion.button>

      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
};

export default ChatButton;
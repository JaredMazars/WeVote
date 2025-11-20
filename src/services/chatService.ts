// Chat Service for real-time messaging and AI integration
class ChatService {
  private static instance: ChatService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Initialize WebSocket connection
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In production, use your WebSocket server URL
        const wsUrl = `ws://localhost:3001/chat?userId=${userId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Chat WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };

        this.ws.onclose = () => {
          console.log('Chat WebSocket disconnected');
          this.handleReconnect(userId);
        };

        this.ws.onerror = (error) => {
          console.error('Chat WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Handle incoming messages
  private handleMessage(data: any) {
    switch (data.type) {
      case 'message':
        this.onMessageReceived?.(data.message);
        break;
      case 'user_joined':
        this.onUserJoined?.(data.user);
        break;
      case 'user_left':
        this.onUserLeft?.(data.user);
        break;
      case 'typing':
        this.onTyping?.(data.userId, data.isTyping);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Send message
  sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        message
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // Send typing indicator
  sendTyping(isTyping: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        isTyping
      }));
    }
  }

  // Handle reconnection
  private handleReconnect(userId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId).catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // AI Integration
  async getAIResponse(message: string, context?: any): Promise<string> {
    try {
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message,
          context,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      return data.response || 'I apologize, but I cannot process your request right now. Please try again or contact human support.';
    } catch (error) {
      console.error('AI response error:', error);
      return 'I apologize, but I cannot process your request right now. Please try again or contact human support.';
    }
  }

  // Save chat history for audit
  async saveChatHistory(messages: any[]): Promise<void> {
    try {
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          messages,
          timestamp: new Date().toISOString(),
          sessionId: this.generateSessionId()
        })
      });
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  // Generate session ID for audit trail
  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get chat history
  async getChatHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`/api/chat/history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  // Request human support
  async requestHumanSupport(reason: string): Promise<boolean> {
    try {
      const response = await fetch('/api/chat/request-human', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error requesting human support:', error);
      return false;
    }
  }

  // Event handlers (to be set by components)
  onMessageReceived?: (message: any) => void;
  onUserJoined?: (user: any) => void;
  onUserLeft?: (user: any) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default ChatService;
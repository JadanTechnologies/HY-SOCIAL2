import { ChatMessage, MessageReactionMap } from '../types';

type MessageHandler = (data: { conversationId: string; message: ChatMessage }) => void;
type ReadReceiptHandler = (data: { conversationId: string; readerId: string; readAt: string }) => void;
type TypingHandler = (data: { conversationId: string; senderId: string; isTyping: boolean }) => void;
type ReactionHandler = (data: { conversationId: string; messageId: string; reactions: MessageReactionMap }) => void;
type PresenceHandler = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void;

class RealtimeService {
  private socket: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private isConnecting = false;

  private messageHandlers = new Set<MessageHandler>();
  private readReceiptHandlers = new Set<ReadReceiptHandler>();
  private typingHandlers = new Set<TypingHandler>();
  private reactionHandlers = new Set<ReactionHandler>();
  private presenceHandlers = new Set<PresenceHandler>();

  public connect(userId: string) {
    if (typeof window === 'undefined') return;
    this.userId = userId;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'auth', userId }));
      }
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        if (this.userId) {
          this.socket?.send(JSON.stringify({ type: 'auth', userId: this.userId }));
        }
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          console.error('[Realtime] Failed to parse message', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch (err) {
      console.warn('[Realtime] Connection error, will retry:', err);
      this.scheduleReconnect();
    }
  }

  private handleIncomingMessage(data: any) {
    switch (data.type) {
      case 'new_message':
      case 'message_echo':
        this.messageHandlers.forEach((h) => h({ conversationId: data.conversationId, message: data.message }));
        break;
      case 'read_receipt':
        this.readReceiptHandlers.forEach((h) => h({ conversationId: data.conversationId, readerId: data.readerId, readAt: data.readAt }));
        break;
      case 'typing':
        this.typingHandlers.forEach((h) => h({ conversationId: data.conversationId, senderId: data.senderId, isTyping: data.isTyping }));
        break;
      case 'reaction_update':
        this.reactionHandlers.forEach((h) => h({ conversationId: data.conversationId, messageId: data.messageId, reactions: data.reactions }));
        break;
      case 'presence':
        this.presenceHandlers.forEach((h) => h({ userId: data.userId, isOnline: data.isOnline, lastSeen: data.lastSeen }));
        break;
      case 'pong':
        break;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || !this.userId) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[Realtime] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  public sendTyping(conversationId: string, recipientId: string, isTyping: boolean) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'typing',
          conversationId,
          recipientId,
          isTyping,
        })
      );
    }
  }

  public onNewMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onReadReceipt(handler: ReadReceiptHandler): () => void {
    this.readReceiptHandlers.add(handler);
    return () => this.readReceiptHandlers.delete(handler);
  }

  public onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  public onReaction(handler: ReactionHandler): () => void {
    this.reactionHandlers.add(handler);
    return () => this.reactionHandlers.delete(handler);
  }

  public onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.userId = null;
  }
}

export const realtime = new RealtimeService();

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Shield,
  Search,
  Plus,
  ArrowLeft,
  Info,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MessageConversation, ChatMessage, User as UserType, Video } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessageInput } from './MessageInput';
import { ConversationDetails } from './ConversationDetails';
import { NewMessageModal } from './NewMessageModal';
import { ShareAttachmentModal } from './ShareAttachmentModal';
import { ReportMessageModal } from './ReportMessageModal';

interface MessagesViewProps {
  onSelectUser: (username: string) => void;
  onSelectVideo?: (video: Video) => void;
  currentUser: UserType | null;
  initialTargetUsername?: string | null;
  initialSharedVideo?: Video | null;
}

export function MessagesView({
  onSelectUser,
  onSelectVideo,
  currentUser,
  initialTargetUsername,
  initialSharedVideo,
}: MessagesViewProps) {
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  // Real-time state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Right side 3rd column drawer
  const [showDetails, setShowDetails] = useState(false);

  // Modals
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [shareAttachmentMode, setShareAttachmentMode] = useState<'video' | 'profile' | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // 1. Fetch conversations on mount / user change
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data.conversations || []);
      setTotalUnread(data.totalUnread || 0);

      // If initialTargetUsername is provided, find or start conversation
      if (initialTargetUsername) {
        const found = data.conversations?.find(
          (c) => c.user.username.toLowerCase() === initialTargetUsername.toLowerCase()
        );
        if (found) {
          setActiveConvId(found.id);
        } else {
          // Search target user to start conversation
          const searchRes = await api.searchUsers(initialTargetUsername);
          const target = searchRes.find(
            (u) => u.username.toLowerCase() === initialTargetUsername.toLowerCase()
          );
          if (target) {
            const newConvRes = await api.startConversation({ targetUserId: target.id });
            setConversations((prev) => [newConvRes.conversation, ...prev]);
            setActiveConvId(newConvRes.conversation.id);
          }
        }
      } else if (data.conversations?.length > 0 && !activeConvId) {
        // On desktop, auto-select first conversation
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, initialTargetUsername]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // If initialSharedVideo was passed into view, prompt sending it to active conversation
  useEffect(() => {
    if (initialSharedVideo && activeConvId) {
      api.sendMessage(activeConvId, {
        type: 'video',
        sharedVideoId: initialSharedVideo.id,
        text: 'Check out this vibe!',
      }).then((res) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? res.conversation : c))
        );
      }).catch(console.error);
    }
  }, [initialSharedVideo, activeConvId]);

  // 2. Mark conversation as read whenever activeConvId changes
  useEffect(() => {
    if (!activeConvId || !currentUser) return;

    api.markConversationAsRead(activeConvId).then(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              unreadCount: 0,
              messages: c.messages.map((m) =>
                m.recipientId === currentUser.id ? { ...m, read: true, status: 'read' } : m
              ),
            };
          }
          return c;
        })
      );
      setTotalUnread((prev) => Math.max(0, prev - (activeConv?.unreadCount || 0)));
    }).catch(console.error);
  }, [activeConvId, currentUser]);

  // 3. Connect to Realtime WebSocket and register listeners
  useEffect(() => {
    if (!currentUser) return;
    realtime.connect(currentUser.id);

    // New Message listener
    const unsubMessage = realtime.onNewMessage(({ conversationId, message }) => {
      setConversations((prev) => {
        const convExists = prev.some((c) => c.id === conversationId);
        if (!convExists) {
          // If conversation wasn't loaded yet, reload
          loadConversations();
          return prev;
        }
        return prev.map((c) => {
          if (c.id === conversationId) {
            const alreadyHas = c.messages.some((m) => m.id === message.id);
            const updatedMessages = alreadyHas ? c.messages : [...c.messages, message];
            const isCurrentChat = conversationId === activeConvId;
            return {
              ...c,
              lastMessage:
                message.type === 'video'
                  ? '🎬 Shared a video'
                  : message.type === 'profile'
                  ? '👤 Shared a creator profile'
                  : message.text,
              lastMessageAt: message.sentAt,
              lastSenderId: message.senderId,
              unreadCount: isCurrentChat ? 0 : c.unreadCount + 1,
              messages: updatedMessages,
            };
          }
          return c;
        });
      });

      if (conversationId === activeConvId) {
        api.markConversationAsRead(conversationId).catch(console.error);
      } else {
        setTotalUnread((prev) => prev + 1);
      }
    });

    // Read Receipt listener
    const unsubRead = realtime.onReadReceipt(({ conversationId, readAt }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.senderId === currentUser.id
                  ? { ...m, read: true, readAt, status: 'read' }
                  : m
              ),
            };
          }
          return c;
        })
      );
    });

    // Typing listener
    const unsubTyping = realtime.onTyping(({ conversationId, isTyping }) => {
      if (conversationId === activeConvId) {
        setIsOtherTyping(isTyping);
      }
    });

    // Reaction update listener
    const unsubReaction = realtime.onReaction(({ conversationId, messageId, reactions }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, reactions } : m
              ),
            };
          }
          return c;
        })
      );
    });

    // Presence listener
    const unsubPresence = realtime.onPresence(({ userId, isOnline, lastSeen }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.user.id === userId) {
            return {
              ...c,
              isOnline,
              lastSeen: lastSeen || c.lastSeen,
            };
          }
          return c;
        })
      );
    });

    return () => {
      unsubMessage();
      unsubRead();
      unsubTyping();
      unsubReaction();
      unsubPresence();
    };
  }, [currentUser, activeConvId, loadConversations]);

  // Reset typing indicator when switching conversations
  useEffect(() => {
    setIsOtherTyping(false);
    setRateLimitError(null);
  }, [activeConvId]);

  // 4. Send message handler
  const handleSendMessage = async (text: string) => {
    if (!activeConvId || !currentUser) return;
    setSending(true);
    setRateLimitError(null);

    try {
      const res = await api.sendMessage(activeConvId, { text, type: 'text' });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? res.conversation : c))
      );
    } catch (err: any) {
      if (err.message?.includes('Rate limit')) {
        setRateLimitError('You are sending messages too quickly. Please wait a moment.');
      } else {
        console.error('Failed to send message', err);
      }
    } finally {
      setSending(false);
    }
  };

  // 5. Typing emit handler
  const handleTyping = (isTyping: boolean) => {
    if (!activeConvId || !activeConv) return;
    realtime.sendTyping(activeConvId, activeConv.user.id, isTyping);
    api.sendTypingStatus(activeConvId, isTyping).catch(() => {});
  };

  // 6. Share attachment handlers (video or profile)
  const handleShareVideo = async (video: Video) => {
    if (!activeConvId) return;
    try {
      const res = await api.sendMessage(activeConvId, {
        type: 'video',
        sharedVideoId: video.id,
        text: `Shared a vibe by @${video.author.username}`,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? res.conversation : c))
      );
    } catch (err) {
      console.error('Failed to share video', err);
    }
  };

  const handleShareProfile = async (profileUser: UserType) => {
    if (!activeConvId) return;
    try {
      const res = await api.sendMessage(activeConvId, {
        type: 'profile',
        sharedUserId: profileUser.id,
        text: `Shared creator card for @${profileUser.username}`,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? res.conversation : c))
      );
    } catch (err) {
      console.error('Failed to share profile', err);
    }
  };

  // 7. Toggle Reaction handler
  const handleReact = async (messageId: string, emoji: string) => {
    if (!activeConvId) return;
    try {
      const res = await api.toggleMessageReaction(activeConvId, messageId, emoji);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, reactions: res.reactions } : m
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  // 8. Block / Unblock handler
  const handleToggleBlock = async () => {
    if (!activeConv) return;
    const targetUserId = activeConv.user.id;
    try {
      if (activeConv.isBlockedByMe) {
        await api.unblockUser(targetUserId);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, isBlockedByMe: false } : c))
        );
      } else {
        await api.blockUser(targetUserId);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, isBlockedByMe: true } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle block status', err);
    }
  };

  // 9. Start conversation with selected user from modal
  const handleSelectUserFromModal = async (targetUser: UserType) => {
    try {
      const res = await api.startConversation({ targetUserId: targetUser.id });
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === res.conversation.id);
        if (existing) return prev;
        return [res.conversation, ...prev];
      });
      setActiveConvId(res.conversation.id);
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  };

  return (
    <div
      id="messages-view-root"
      className="min-h-screen bg-[#070a0f] text-slate-100 pt-14 md:pt-16 pb-16 md:pb-6 px-0 md:px-6 max-w-7xl mx-auto flex flex-col"
    >
      {/* Container Frame */}
      <div className="flex-1 rounded-none md:rounded-2xl border-0 md:border border-white/10 bg-[#0e131d] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-130px)] shadow-2xl relative">
        {/* ======================================================== */}
        {/* COLUMN 1: LEFT CONVERSATION LIST (Hidden on mobile if conversation open) */}
        {/* ======================================================== */}
        <div
          className={`md:col-span-4 lg:col-span-3 border-r border-white/10 flex flex-col h-full ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConvId}
            onSelectConversation={(id) => setActiveConvId(id)}
            onOpenNewMessage={() => setIsNewMessageOpen(true)}
            loading={loading}
            totalUnread={totalUnread}
          />
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: ACTIVE CONVERSATION THREAD (Hidden on mobile if no conversation open) */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col h-full ${
            showDetails ? 'md:col-span-8 lg:col-span-6' : 'md:col-span-8 lg:col-span-9'
          } ${!activeConvId ? 'hidden md:flex' : 'flex'}`}
        >
          {activeConv ? (
            <>
              {/* Thread Messages */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <MessageThread
                  conversation={activeConv}
                  currentUserId={currentUser?.id || 'u-current'}
                  onBackToInbox={() => setActiveConvId(null)}
                  onToggleDetails={() => setShowDetails(!showDetails)}
                  onSelectUser={onSelectUser}
                  onSelectVideo={onSelectVideo}
                  onReact={handleReact}
                  isOtherTyping={isOtherTyping}
                  showDetailsToggle={true}
                />
              </div>

              {/* Message Input Box */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onOpenShareAttachment={(mode) => setShareAttachmentMode(mode)}
                isBlockedByMe={Boolean(activeConv.isBlockedByMe)}
                isBlockedByThem={Boolean(activeConv.isBlockedByThem)}
                onUnblock={handleToggleBlock}
                sending={sending}
                rateLimitError={rateLimitError}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Your Direct Messages</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Send private messages, share viral vibes, and connect directly with creators across HY.
              </p>
              <button
                onClick={() => setIsNewMessageOpen(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                Send a Message
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: CONVERSATION DETAILS & SAFETY PANEL */}
        {/* ======================================================== */}
        {activeConv && showDetails && (
          <div className="hidden lg:block lg:col-span-3 h-full overflow-y-auto">
            <ConversationDetails
              conversation={activeConv}
              onClose={() => setShowDetails(false)}
              onSelectUser={onSelectUser}
              onSelectVideo={onSelectVideo}
              onToggleBlock={handleToggleBlock}
              onOpenReport={() => setIsReportOpen(true)}
              isBlockedByMe={Boolean(activeConv.isBlockedByMe)}
            />
          </div>
        )}

        {/* Mobile slide-over drawer for conversation details */}
        {activeConv && showDetails && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end"
            onClick={() => setShowDetails(false)}
          >
            <div
              className="w-full max-w-xs h-full bg-[#0b0f17] border-l border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <ConversationDetails
                conversation={activeConv}
                onClose={() => setShowDetails(false)}
                onSelectUser={onSelectUser}
                onSelectVideo={onSelectVideo}
                onToggleBlock={handleToggleBlock}
                onOpenReport={() => setIsReportOpen(true)}
                isBlockedByMe={Boolean(activeConv.isBlockedByMe)}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. New Message Modal */}
      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onSelectUser={handleSelectUserFromModal}
        currentUserId={currentUser?.id}
      />

      {/* 2. Share Attachment Modal (Video or Profile) */}
      <ShareAttachmentModal
        isOpen={Boolean(shareAttachmentMode)}
        onClose={() => setShareAttachmentMode(null)}
        mode={shareAttachmentMode || 'video'}
        onShareVideo={handleShareVideo}
        onShareProfile={handleShareProfile}
      />

      {/* 3. Safety Report Modal */}
      {activeConv && (
        <ReportMessageModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          conversationId={activeConv.id}
          targetUserId={activeConv.user.id}
          targetUsername={activeConv.user.username}
        />
      )}
    </div>
  );
}

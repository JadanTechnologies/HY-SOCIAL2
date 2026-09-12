import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Info,
  Check,
  CheckCheck,
  Play,
  User as UserIcon,
  Smile,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MessageConversation, ChatMessage, User, Video } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

interface MessageThreadProps {
  conversation: MessageConversation;
  currentUserId: string;
  onBackToInbox: () => void;
  onToggleDetails: () => void;
  onSelectUser: (username: string) => void;
  onSelectVideo?: (video: Video) => void;
  onReact: (messageId: string, emoji: string) => void;
  isOtherTyping: boolean;
  showDetailsToggle: boolean;
}

const REACTION_PALETTE = ['❤️', '🔥', '😂', '👏', '😮', '💯'];

export function MessageThread({
  conversation,
  currentUserId,
  onBackToInbox,
  onToggleDetails,
  onSelectUser,
  onSelectVideo,
  onReact,
  isOtherTyping,
  showDetailsToggle,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const { user, isOnline, lastSeen, messages } = conversation;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isOtherTyping]);

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div id="message-thread-container" className="h-full flex flex-col bg-[#070a0f] text-slate-100">
      {/* Thread Header */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#0e131d] flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBackToInbox}
            className="md:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* User Avatar with Presence */}
          <div className="relative shrink-0">
            <img
              src={user.avatar}
              alt={user.displayName}
              onClick={() => onSelectUser(user.username)}
              className="w-10 h-10 rounded-full object-cover border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
            />
            {isOnline ? (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0e131d]"
                title="Online"
              />
            ) : (
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-[#0e131d]"
                title="Offline"
              />
            )}
          </div>

          {/* User Name & Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                onClick={() => onSelectUser(user.username)}
                className="text-sm font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer truncate"
              >
                {user.displayName}
              </h3>
              {user.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center shrink-0">
                  ✓
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] truncate">
              {isOtherTyping ? (
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <span className="inline-block animate-pulse">typing</span>
                  <span className="animate-bounce">...</span>
                </span>
              ) : isOnline ? (
                <span className="text-emerald-400 font-medium">Active now</span>
              ) : (
                <span className="text-slate-400">
                  {lastSeen ? `Last seen ${formatRelativeTime(lastSeen)}` : `@${user.username}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5">
          {showDetailsToggle && (
            <button
              id="toggle-conversation-details-btn"
              onClick={onToggleDetails}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Conversation Details & Safety"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll View */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Encrypted Conversation Welcome Notice */}
        <div className="text-center my-4 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>End-to-End Encrypted &bull; Direct Messages</span>
          </div>
          <p className="text-[11px] text-slate-500">
            This is the start of your private conversation with @{user.username}
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          const isHovered = hoveredMessageId === msg.id;

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 max-w-[85%] sm:max-w-[75%] relative">
                {/* Micro Reaction Picker on hover (sender side or recipient side) */}
                {isHovered && (
                  <div
                    className={`absolute -top-7 ${
                      isMine ? 'right-0' : 'left-0'
                    } z-20 flex items-center gap-1 bg-[#161d2b] border border-white/15 px-2 py-1 rounded-full shadow-xl animate-in fade-in zoom-in-95 duration-150`}
                  >
                    {REACTION_PALETTE.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReact(msg.id, emoji)}
                        className="w-6 h-6 hover:scale-125 transition-transform flex items-center justify-center text-sm cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`rounded-2xl text-xs sm:text-sm p-3.5 shadow-md relative ${
                    isMine
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-medium rounded-br-none'
                      : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                  }`}
                >
                  {/* Rich Content based on type */}
                  {msg.type === 'video' && msg.sharedVideo ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => onSelectVideo?.(msg.sharedVideo!)}
                        className="relative aspect-[9/14] w-48 sm:w-56 rounded-xl overflow-hidden bg-black/50 border border-black/20 cursor-pointer group/vid shadow"
                      >
                        <img
                          src={msg.sharedVideo.thumbnailUrl}
                          alt={msg.sharedVideo.caption}
                          className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg group-hover/vid:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                          <span className="truncate font-semibold">
                            @{msg.sharedVideo.author.username}
                          </span>
                          <span>{msg.sharedVideo.duration}s</span>
                        </div>
                      </div>
                      {msg.text && (
                        <p className={isMine ? 'text-slate-950 font-medium' : 'text-white'}>
                          {msg.text}
                        </p>
                      )}
                    </div>
                  ) : msg.type === 'profile' && msg.sharedProfile ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => onSelectUser(msg.sharedProfile!.username)}
                        className="p-3 rounded-xl bg-black/20 border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-black/30 transition-colors w-56 sm:w-64"
                      >
                        <img
                          src={msg.sharedProfile.avatar}
                          alt={msg.sharedProfile.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs truncate">
                              {msg.sharedProfile.displayName}
                            </span>
                            {msg.sharedProfile.isVerified && (
                              <span className="w-3 h-3 rounded-full bg-cyan-500 text-slate-950 text-[8px] font-black flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] opacity-80 block truncate">
                            @{msg.sharedProfile.username}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </div>
                      {msg.text && (
                        <p className={isMine ? 'text-slate-950 font-medium' : 'text-white'}>
                          {msg.text}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  )}

                  {/* Timestamp & Status Indicator */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                      isMine ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.sentAt)}</span>
                    {isMine && (
                      <span className="inline-flex items-center ml-0.5" title={msg.read ? 'Read' : 'Delivered'}>
                        {msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-950" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-700" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reaction Badges underneath message */}
              {hasReactions && (
                <div
                  className={`flex flex-wrap gap-1 mt-1 px-1 ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {Object.entries(msg.reactions!).map(([emoji, uids]) => {
                    if (!uids || uids.length === 0) return null;
                    const didIReact = uids.includes(currentUserId);
                    return (
                      <button
                        key={emoji}
                        onClick={() => onReact(msg.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          didIReact
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px]">{uids.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Bubble */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-7 h-7 rounded-full object-cover border border-white/10"
            />
            <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

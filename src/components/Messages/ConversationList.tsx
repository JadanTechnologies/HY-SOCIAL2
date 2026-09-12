import React, { useState } from 'react';
import { MessageSquare, Plus, Search, CheckCheck, Check, Shield } from 'lucide-react';
import { MessageConversation } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

interface ConversationListProps {
  conversations: MessageConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewMessage: () => void;
  loading: boolean;
  totalUnread: number;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewMessage,
  loading,
  totalUnread,
}: ConversationListProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = conversations.filter((c) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.user.displayName.toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <div
      id="conversation-list-container"
      className="h-full flex flex-col bg-[#0e131d] border-r border-white/10 text-slate-100"
    >
      {/* Inbox Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-brand font-bold text-sm text-white flex items-center gap-2">
              Messages
              {totalUnread > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>
        </div>

        <button
          id="new-message-btn"
          onClick={onOpenNewMessage}
          className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/20 flex items-center justify-center transition-all cursor-pointer shadow-sm"
          title="New Conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading direct messages...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs">
              {filterQuery ? 'No matching conversations' : 'No messages yet'}
            </p>
            <button
              onClick={onOpenNewMessage}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Start a Chat
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3.5 flex items-center gap-3 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <img
                    src={conv.user.avatar}
                    alt={conv.user.displayName}
                    className="w-11 h-11 rounded-full object-cover border border-white/10"
                  />
                  {conv.isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0e131d]"
                      title="Online"
                    />
                  )}
                </div>

                {/* Conversation Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-white truncate">
                        {conv.user.displayName}
                      </span>
                      {conv.user.isVerified && (
                        <span className="w-3 h-3 rounded-full bg-cyan-500 text-slate-950 text-[8px] font-black flex items-center justify-center shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {conv.lastMessage}
                    </p>

                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

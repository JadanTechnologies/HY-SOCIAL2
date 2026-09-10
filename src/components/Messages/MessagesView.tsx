import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, User, Info, ArrowLeft, Shield } from 'lucide-react';
import { MessageConversation, User as UserType } from '../../types';
import { api } from '../../services/api';
import { formatRelativeTime } from '../../utils/formatters';

interface MessagesViewProps {
  onSelectUser: (username: string) => void;
  currentUser: UserType | null;
}

export function MessagesView({ onSelectUser, currentUser }: MessagesViewProps) {
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const data = await api.getMessages();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConvId) {
          setActiveConvId(data.conversations[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [currentUser]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div
      id="messages-view-root"
      className="min-h-screen bg-[#070a0f] text-slate-100 pt-16 md:pt-20 pb-20 px-3 sm:px-6 max-w-5xl mx-auto"
    >
      <div className="rounded-2xl border border-white/10 bg-[#0e131d] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] shadow-2xl">
        {/* Left Conversations Rail */}
        <div
          className={`md:col-span-5 border-r border-white/10 flex flex-col ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold font-brand text-base text-white">Direct Messages</h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Phase 1 Preview
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading inbox...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">No active conversations yet.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.displayName}
                      className="w-11 h-11 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-white truncate">
                          {conv.user.displayName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Pane */}
        <div
          className={`md:col-span-7 flex flex-col justify-between ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={activeConv.user.avatar}
                    alt={activeConv.user.displayName}
                    onClick={() => onSelectUser(activeConv.user.username)}
                    className="w-9 h-9 rounded-full object-cover border border-white/10 cursor-pointer"
                  />
                  <div>
                    <h3
                      onClick={() => onSelectUser(activeConv.user.username)}
                      className="text-sm font-bold text-white cursor-pointer hover:underline"
                    >
                      {activeConv.user.displayName}
                    </h3>
                    <p className="text-[11px] text-slate-400">@{activeConv.user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>End-to-End Encrypted Ready</span>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="text-center my-2">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    Messages with @{activeConv.user.username}
                  </span>
                </div>

                {activeConv.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.id || msg.senderId === 'u-current';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMine
                            ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-none'
                            : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`text-[9px] block mt-1 ${
                            isMine ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {formatRelativeTime(msg.sentAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Placeholder Notice */}
              <div className="p-4 border-t border-white/10 bg-slate-900/30">
                <div className="mb-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>
                    Interactive real-time chat input will be fully enabled in Phase 2. Conversation previews and read states are live.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Message typing disabled in Phase 1 foundation..."
                    className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <button
                    disabled
                    className="p-2.5 rounded-xl bg-white/10 text-slate-500 cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-white">Select a conversation</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Choose a creator from the inbox list to preview your direct messaging history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

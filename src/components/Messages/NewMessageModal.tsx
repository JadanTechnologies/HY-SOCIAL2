import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, MessageSquare, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  currentUserId?: string;
}

export function NewMessageModal({ isOpen, onClose, onSelectUser, currentUserId }: NewMessageModalProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setUsers([]);
      return;
    }

    // Load initial recommended creators
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const res = await api.searchUsers('');
        setUsers(res.filter((u) => u.id !== currentUserId));
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [isOpen, currentUserId]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    setLoading(true);
    try {
      const res = await api.searchUsers(val);
      setUsers(res.filter((u) => u.id !== currentUserId));
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="new-message-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="new-message-modal-content"
        className="w-full max-w-md bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-brand font-bold text-white text-base">New Message</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or @username..."
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
          {loading ? (
            <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-xs">Finding creators...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <UserIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No creators found matching &quot;{query}&quot;</p>
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className="w-full p-3 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-left cursor-pointer group"
              >
                <img
                  src={u.avatar}
                  alt={u.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {u.displayName}
                    </span>
                    {u.isVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0">
                  Chat
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

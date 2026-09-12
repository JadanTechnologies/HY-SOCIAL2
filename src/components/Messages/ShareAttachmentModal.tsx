import React, { useState, useEffect } from 'react';
import { X, Film, User as UserIcon, Search, Play, Loader2 } from 'lucide-react';
import { Video, User } from '../../types';
import { api } from '../../services/api';

interface ShareAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'video' | 'profile';
  onShareVideo: (video: Video) => void;
  onShareProfile: (user: User) => void;
}

export function ShareAttachmentModal({
  isOpen,
  onClose,
  mode,
  onShareVideo,
  onShareProfile,
}: ShareAttachmentModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'profile'>(mode);
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'video') {
          const res = await api.getFeed('foryou');
          setVideos(res.videos || []);
        } else {
          const res = await api.searchUsers(query);
          setUsers(res);
        }
      } catch (err) {
        console.error('Failed to load attachment options', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen, activeTab]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    setLoading(true);
    try {
      if (activeTab === 'video') {
        const res = await api.search(val);
        setVideos(res.videos || []);
      } else {
        const res = await api.searchUsers(val);
        setUsers(res);
      }
    } catch (err) {
      console.error('Attachment search failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="share-attachment-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="share-attachment-modal-content"
        className="w-full max-w-lg bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Share Video</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Share Profile</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={
                activeTab === 'video' ? 'Search vibes by caption or hashtag...' : 'Search creator by name or username...'
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-xs">Loading items...</span>
            </div>
          ) : activeTab === 'video' ? (
            videos.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No videos found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videos.map((vid) => (
                  <button
                    key={vid.id}
                    onClick={() => {
                      onShareVideo(vid);
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden aspect-[9/16] bg-black/40 border border-white/10 hover:border-cyan-400 transition-all text-left flex flex-col justify-end p-2.5 cursor-pointer shadow"
                  >
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.caption}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-1 mb-1">
                        <img
                          src={vid.author.avatar}
                          alt={vid.author.username}
                          className="w-4 h-4 rounded-full object-cover border border-white/20"
                        />
                        <span className="text-[10px] font-bold text-white truncate">
                          @{vid.author.username}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-200 line-clamp-2 leading-tight">
                        {vid.caption}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-cyan-300 font-semibold">
                        <span>{vid.duration}s</span>
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            users.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No creators found.</div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onShareProfile(u);
                      onClose();
                    }}
                    className="w-full p-3 flex items-center gap-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all text-left cursor-pointer group"
                  >
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="w-11 h-11 rounded-full object-cover border border-white/10 shrink-0"
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
                      {u.bio && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{u.bio}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0">
                      Send Card
                    </span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

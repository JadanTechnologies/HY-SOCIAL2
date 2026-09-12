import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Search, X, User, Music, Hash, Play, Flame, ArrowRight, Check } from 'lucide-react';
import { Video, User as UserType, Sound } from '../../types';
import { api } from '../../services/api';
import { formatCount } from '../../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (username: string) => void;
  onSelectVideo: (videoId: string) => void;
  onSelectHashtag: (tag: string) => void;
}

const DEFAULT_RECENT = ['#afrobeats', 'amapiano dance', 'amaka_steps', '#lagosvibes', 'jollof rice'];

export function SearchModal({
  isOpen,
  onClose,
  onSelectUser,
  onSelectVideo,
  onSelectHashtag,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'videos' | 'creators' | 'sounds' | 'hashtags'>('top');
  const [results, setResults] = useState<{
    videos: Video[];
    users: UserType[];
    sounds: Sound[];
    hashtags: string[];
  }>({
    videos: [],
    users: [],
    sounds: [],
    hashtags: [],
  });
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vibetok_recent_searches');
      return stored ? JSON.parse(stored) : DEFAULT_RECENT;
    } catch {
      return DEFAULT_RECENT;
    }
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Real-time search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ videos: [], users: [], sounds: [], hashtags: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleExecuteSearch = (searchItem: string) => {
    setQuery(searchItem);
    // Add to recent searches
    const updated = [searchItem, ...recentSearches.filter((s) => s !== searchItem)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('vibetok_recent_searches', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('vibetok_recent_searches');
  };

  const totalResults =
    results.videos.length + results.users.length + results.sounds.length + results.hashtags.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 md:pt-24">
      <div
        id="search-modal-card"
        className="w-full max-w-2xl rounded-2xl bg-[#0e131d] border border-white/10 p-5 sm:p-6 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="search-modal-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vibes, creators, sounds, #hashtags..."
              className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Esc
          </button>
        </div>

        {/* Query Active: Filter Tabs */}
        {query.trim() ? (
          <div className="flex items-center gap-2 pt-3 pb-2 border-b border-white/5 overflow-x-auto no-scrollbar">
            {(['top', 'videos', 'creators', 'sounds', 'hashtags'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : null}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-6">
          {!query.trim() ? (
            /* Recent Searches & Trending Suggestions */
            <div>
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Recent Searches
                    </span>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleExecuteSearch(item)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Popular Vibes Today
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['#contemporary', '#beats', '#cyberpunk', '#skate', '#tokyo', '#meditation'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onSelectHashtag(tag.replace('#', ''));
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-left transition-colors flex items-center justify-between group"
                      >
                        <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                          {tag}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Searching HY repository...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No vibes found matching "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for #tags, creators, or beats.</p>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {/* Creators Matches */}
              {(activeTab === 'top' || activeTab === 'creators') && results.users.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Creators ({results.users.length})
                  </span>
                  <div className="space-y-2">
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div
                          onClick={() => {
                            onSelectUser(u.username);
                            onClose();
                          }}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <img
                            src={u.avatar}
                            alt={u.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <span className="text-sm font-bold text-white flex items-center gap-1 hover:underline">
                              {u.displayName}
                              {u.verified && <span className="text-cyan-400 text-xs">✓</span>}
                            </span>
                            <span className="text-xs text-slate-400">
                              @{u.username} · {formatCount(u.followersCount)} followers
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onSelectUser(u.username);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Matches */}
              {(activeTab === 'top' || activeTab === 'videos') && results.videos.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Videos ({results.videos.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {results.videos.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          onSelectVideo(v.id);
                          onClose();
                        }}
                        className="group relative rounded-xl overflow-hidden aspect-[9/13] bg-slate-900 border border-white/10 cursor-pointer"
                      >
                        <img
                          src={v.thumbnailUrl}
                          alt={v.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                          <span className="text-xs font-bold text-white line-clamp-2 leading-tight">
                            {v.caption}
                          </span>
                          <span className="text-[10px] text-cyan-400 mt-1">
                            {formatCount(v.viewsCount)} views
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sounds Matches */}
              {(activeTab === 'top' || activeTab === 'sounds') && results.sounds.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Original Sounds ({results.sounds.length})
                  </span>
                  <div className="space-y-2">
                    {results.sounds.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={s.coverUrl}
                            alt={s.title}
                            className="w-10 h-10 rounded-lg object-cover border border-white/10"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{s.title}</span>
                            <span className="text-[11px] text-slate-400">{s.author}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-cyan-400">
                          {formatCount(s.useCount)} vibes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags Matches */}
              {(activeTab === 'top' || activeTab === 'hashtags') && results.hashtags.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Hashtags ({results.hashtags.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {results.hashtags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onSelectHashtag(tag);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

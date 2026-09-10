import { useState, useEffect } from 'react';
import { Search, Flame, Music, Sparkles, UserPlus, Play, Check, TrendingUp } from 'lucide-react';
import { Video, User as UserType, Sound } from '../../types';
import { api } from '../../services/api';
import { formatCount, formatDuration } from '../../utils/formatters';

interface ExploreViewProps {
  onSelectVideo: (video: Video) => void;
  onSelectHashtag: (tag: string) => void;
  onSelectUser: (username: string) => void;
  currentUser: UserType | null;
}

export function ExploreView({
  onSelectVideo,
  onSelectHashtag,
  onSelectUser,
  currentUser,
}: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'videos' | 'creators' | 'sounds'>('all');
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<UserType[]>([]);
  const [popularSounds, setPopularSounds] = useState<Sound[]>([]);
  const [searchResults, setSearchResults] = useState<{
    videos: Video[];
    users: UserType[];
    sounds: Sound[];
    hashtags: string[];
  }>({ videos: [], users: [], sounds: [], hashtags: [] });
  const [loading, setLoading] = useState(false);

  // Initial load of trending content
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const [feedRes, usersRes, soundsRes] = await Promise.all([
          api.getFeed('trending'),
          api.getUsers(),
          api.getSounds(),
        ]);
        setTrendingVideos(feedRes.videos);
        setFeaturedCreators(usersRes.filter((u) => u.id !== currentUser?.id));
        setPopularSounds(soundsRes);
      } catch (err) {
        console.error('Failed to load explore data', err);
      }
    };
    loadTrending();
  }, [currentUser?.id]);

  // Live search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ videos: [], users: [], sounds: [], hashtags: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(searchQuery.trim());
        setSearchResults(res);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleFollow = async (userId: string) => {
    try {
      const res = await api.toggleFollow(userId);
      setFeaturedCreators((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: res.isFollowing } : u))
      );
      setSearchResults((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId ? { ...u, isFollowing: res.isFollowing } : u
        ),
      }));
    } catch (err) {
      console.error('Follow error', err);
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  const trendingTags = ['dance', 'cyberpunk', 'skate', 'synth', 'oceanvibes', 'cinematic', 'studioflow'];

  return (
    <div
      id="explore-view-main"
      className="w-full min-h-screen bg-[#0d1117] pt-18 md:pt-20 pb-20 px-4 md:px-8 max-w-6xl mx-auto text-left"
    >
      {/* Search Header */}
      <div className="mb-6">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="explore-search-input"
            type="text"
            placeholder="Search vibes, hashtags, sounds, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161b22] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 shadow-lg transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Trending Tags Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar max-w-xl mx-auto">
          <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Trending:
          </span>
          {trendingTags.map((tag) => (
            <button
              key={tag}
              id={`trending-tag-${tag}`}
              onClick={() => onSelectHashtag(tag)}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 text-gray-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 shrink-0 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs when Searching */}
      {isSearching && (
        <div className="flex items-center justify-center gap-2 mb-6 border-b border-white/10 pb-3">
          {(['all', 'videos', 'creators', 'sounds'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-cyan-500 text-black'
                  : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* SEARCH RESULTS VIEW */}
      {isSearching ? (
        <div className="space-y-8">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400 animate-pulse">
              Searching VibeTok universe...
            </div>
          ) : (
            <>
              {/* Creator results */}
              {(activeFilter === 'all' || activeFilter === 'creators') &&
                searchResults.users.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Creators
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {searchResults.users.map((u) => (
                        <div
                          key={u.id}
                          className="bg-[#161b22] border border-white/10 rounded-2xl p-3 flex items-center justify-between"
                        >
                          <button
                            onClick={() => onSelectUser(u.username)}
                            className="flex items-center gap-3 text-left min-w-0 flex-1"
                          >
                            <img
                              src={u.avatar}
                              alt={u.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {u.displayName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                @{u.username} • {formatCount(u.followersCount)} followers
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleToggleFollow(u.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                              u.isFollowing
                                ? 'bg-white/10 text-white'
                                : 'bg-cyan-500 text-black hover:bg-cyan-400'
                            }`}
                          >
                            {u.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* Sound results */}
              {(activeFilter === 'all' || activeFilter === 'sounds') &&
                searchResults.sounds.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Original Sounds
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {searchResults.sounds.map((sound) => (
                        <div
                          key={sound.id}
                          className="bg-[#161b22] border border-white/10 rounded-2xl p-3 flex items-center gap-3"
                        >
                          <img
                            src={sound.coverUrl}
                            alt={sound.title}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{sound.title}</p>
                            <p className="text-[11px] text-gray-400">
                              {sound.author} • {formatCount(sound.useCount)} vibes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* Video Results */}
              {(activeFilter === 'all' || activeFilter === 'videos') &&
                searchResults.videos.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Videos
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {searchResults.videos.map((vid) => (
                        <div
                          key={vid.id}
                          onClick={() => onSelectVideo(vid)}
                          className="relative aspect-9/16 rounded-2xl overflow-hidden bg-black group cursor-pointer border border-white/10 shadow-md hover:scale-[1.02] transition-transform"
                        >
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.caption}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 text-white">
                            <p className="text-xs font-semibold line-clamp-2">{vid.caption}</p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              {formatCount(vid.viewsCount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {searchResults.videos.length === 0 &&
                searchResults.users.length === 0 &&
                searchResults.sounds.length === 0 && (
                  <div className="py-16 text-center text-gray-400">
                    <p className="text-base font-bold text-white">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with different keywords or popular tags.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      ) : (
        /* DISCOVERY HOME VIEW */
        <div className="space-y-10">
          {/* Top Featured Creators Carousel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-brand font-bold text-white text-lg">Featured Creators</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {featuredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-[#161b22] border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center shadow-md relative group hover:border-cyan-500/40 transition-colors"
                >
                  <button
                    onClick={() => onSelectUser(creator.username)}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-2">
                      <img
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/40 group-hover:scale-105 transition-transform"
                      />
                      {creator.verified && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[9px] font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white truncate max-w-[140px]">
                      {creator.displayName}
                    </h4>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">
                      @{creator.username}
                    </p>
                    <p className="text-[11px] text-cyan-400 font-semibold mt-1">
                      {formatCount(creator.followersCount)} followers
                    </p>
                  </button>

                  <button
                    onClick={() => handleToggleFollow(creator.id)}
                    className={`mt-3 w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      creator.isFollowing
                        ? 'bg-white/10 text-white'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Trending Vibes Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-400" />
                <h3 className="font-brand font-bold text-white text-lg">Trending Vibes</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {trendingVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => onSelectVideo(vid)}
                  className="relative aspect-9/16 rounded-2xl overflow-hidden bg-black group cursor-pointer border border-white/10 shadow-lg hover:scale-[1.02] transition-transform"
                >
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.caption}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

                  {/* Top Creator Tag */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    <img
                      src={vid.author.avatar}
                      alt={vid.author.username}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                    />
                    <span className="text-[10px] text-white/90 font-medium truncate max-w-[80px]">
                      @{vid.author.username}
                    </span>
                  </div>

                  {/* Bottom Stats */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <p className="text-xs font-medium text-white/95 line-clamp-2 leading-tight">
                      {vid.caption}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                        <Play className="w-3 h-3 fill-cyan-400" />
                        {formatCount(vid.viewsCount)}
                      </span>
                      <span>❤️ {formatCount(vid.likesCount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Popular Sounds */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-400" />
                <h3 className="font-brand font-bold text-white text-lg">Trending Audio Tracks</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {popularSounds.map((sound) => (
                <div
                  key={sound.id}
                  className="bg-[#161b22] border border-white/10 rounded-2xl p-3 flex items-center gap-3 hover:border-white/20 transition-colors"
                >
                  <img
                    src={sound.coverUrl}
                    alt={sound.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{sound.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{sound.author}</p>
                    <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                      {formatCount(sound.useCount)} videos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

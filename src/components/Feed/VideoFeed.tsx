import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, Sparkles, Flame, Users, X, RefreshCw, Command, Loader2 } from 'lucide-react';
import { Video, FeedType, User as UserType } from '../../types';
import { VideoItem } from './VideoItem';
import { api } from '../../services/api';

interface VideoFeedProps {
  initialTag?: string | null;
  onClearTag?: () => void;
  onOpenComments: (video: Video) => void;
  onOpenShare: (video: Video) => void;
  onOpenReport: (video: Video) => void;
  onSelectHashtag: (tag: string) => void;
  onSelectUser: (username: string) => void;
  currentUser: UserType | null;
}

export function VideoFeed({
  initialTag,
  onClearTag,
  onOpenComments,
  onOpenShare,
  onOpenReport,
  onSelectHashtag,
  onSelectUser,
  currentUser,
}: VideoFeedProps) {
  const [feedType, setFeedType] = useState<FeedType>('foryou');
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Load feed videos with cursor pagination support
  const fetchFeed = async (cursor?: string | null) => {
    if (!cursor) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await api.getFeed(feedType, initialTag || undefined, cursor || undefined, 5);
      
      if (!cursor) {
        setVideos(data.videos);
        setCurrentIndex(0);
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newVideos = data.videos.filter((v) => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
      }

      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(null);
  }, [feedType, initialTag]);

  useEffect(() => {
    const handleFeedUpdated = () => {
      fetchFeed(null).catch(console.error);
    };
    window.addEventListener('hy-feed-updated', handleFeedUpdated);
    return () => window.removeEventListener('hy-feed-updated', handleFeedUpdated);
  }, [feedType, initialTag]);

  // Infinite scroll trigger when nearing end of feed
  const loadMoreIfNeeded = useCallback((index: number) => {
    if (index >= videos.length - 2 && hasMore && !isLoadingMore && nextCursor) {
      fetchFeed(nextCursor);
    }
  }, [videos.length, hasMore, isLoadingMore, nextCursor]);

  // Keyboard navigation (ArrowUp, ArrowDown, J, K, M, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToIndex(currentIndex - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  const goToIndex = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= videos.length || isScrollingRef.current) return;
    isScrollingRef.current = true;
    setCurrentIndex(newIndex);
    loadMoreIfNeeded(newIndex);

    const container = containerRef.current;
    if (container) {
      const targetChild = container.children[newIndex] as HTMLElement;
      if (targetChild) {
        targetChild.scrollIntoView({ behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 450);
  };

  // Scroll listener to update active index based on scroll position
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || isScrollingRef.current) return;

    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    if (height > 0) {
      const index = Math.round(scrollTop / height);
      if (index !== currentIndex && index >= 0 && index < videos.length) {
        setCurrentIndex(index);
        loadMoreIfNeeded(index);
      }
    }

    // Check if scrolled near bottom
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 300) {
      if (hasMore && !isLoadingMore && nextCursor) {
        fetchFeed(nextCursor);
      }
    }
  };

  return (
    <div
      id="video-feed-main"
      className="relative w-full h-[calc(100vh-4rem)] md:h-screen pt-14 md:pt-16 overflow-hidden bg-[#070a0f] flex items-center justify-center"
    >
      {/* Top Feed Switcher Tabs (Overlay over video) */}
      <div className="absolute top-16 md:top-20 z-30 flex items-center justify-center pointer-events-auto">
        {initialTag ? (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg">
            <span className="text-cyan-400">#{initialTag}</span>
            <button
              onClick={onClearTag}
              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white ml-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-xl">
            <button
              id="feed-tab-following"
              onClick={() => setFeedType('following')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                feedType === 'following'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Following
            </button>

            <button
              id="feed-tab-foryou"
              onClick={() => setFeedType('foryou')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                feedType === 'foryou'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For You
            </button>

            <button
              id="feed-tab-trending"
              onClick={() => setFeedType('trending')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                feedType === 'trending'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-rose-300'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Trending</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Next/Previous Floating Arrow Controls & Key hints */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-30">
        <button
          id="feed-prev-video-btn"
          disabled={currentIndex === 0}
          onClick={() => goToIndex(currentIndex - 1)}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-lg hover:border-cyan-400/50"
          title="Previous video (Up Arrow / K)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* Counter indicator */}
        {videos.length > 0 && (
          <div className="px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-mono text-slate-400">
            {currentIndex + 1} / {videos.length}
          </div>
        )}

        <button
          id="feed-next-video-btn"
          disabled={currentIndex === videos.length - 1 && !hasMore}
          onClick={() => goToIndex(currentIndex + 1)}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-lg hover:border-cyan-400/50"
          title="Next video (Down Arrow / J)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Subtle Keyboard Shortcuts Hint Pill */}
        <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[9px] text-slate-400 flex flex-col items-center gap-0.5 pointer-events-none">
          <div className="flex items-center gap-1 font-semibold text-slate-300">
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-[8px]">↑</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-[8px]">↓</kbd>
            <span>scroll</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-slate-300 mt-0.5">
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-[8px]">M</kbd>
            <span>mute</span>
          </div>
        </div>
      </div>

      {/* Feed Container (Vertical Snap Scroll) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-sm font-medium">Tuning to the vibe...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <Sparkles className="w-12 h-12 text-cyan-400 mb-3" />
            <h3 className="text-white text-lg font-bold">No videos found</h3>
            <p className="text-xs text-gray-400 max-w-xs mt-1">
              {feedType === 'following'
                ? "You haven't followed any creators with recent posts. Follow someone from Explore or check For You!"
                : 'Check back soon for fresh community uploads.'}
            </p>
            <button
              onClick={() => setFeedType('foryou')}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 cursor-pointer"
            >
              Switch to For You
            </button>
          </div>
        ) : (
          <>
            {videos.map((video, idx) => (
              <div
                key={video.id}
                className="w-full h-full snap-start snap-always shrink-0"
              >
                <VideoItem
                  video={video}
                  isActive={idx === currentIndex}
                  isMuted={isMuted}
                  toggleMute={() => setIsMuted(!isMuted)}
                  onOpenComments={onOpenComments}
                  onOpenShare={onOpenShare}
                  onOpenReport={onOpenReport}
                  onSelectHashtag={onSelectHashtag}
                  onSelectUser={onSelectUser}
                  currentUser={currentUser}
                />
              </div>
            ))}

            {/* Pagination loading more spinner */}
            {isLoadingMore && (
              <div className="w-full py-6 flex items-center justify-center gap-2 text-cyan-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading more vibes...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

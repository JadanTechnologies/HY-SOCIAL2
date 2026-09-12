import { useState, useRef, useEffect, MouseEvent } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Check,
  Music,
  MoreVertical,
  Flag,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Loader2,
  Gauge,
  Eye,
} from 'lucide-react';
import { Video, User as UserType } from '../../types';
import { formatCount, formatTimeAgo } from '../../utils/formatters';
import { api } from '../../services/api';

function getSafeVideoUrl(url?: string): string {
  if (!url) return '/videos/dance_flow.mp4';
  if (url.includes('mixkit-dancer')) return '/videos/dance_flow.mp4';
  if (url.includes('mixkit-girl')) return '/videos/cyberpunk_tokyo.mp4';
  if (url.includes('mixkit-skater')) return '/videos/venice_skate.mp4';
  if (url.includes('mixkit-hands')) return '/videos/tape_synth.mp4';
  if (url.includes('mixkit-waves')) return '/videos/coastal_waves.mp4';
  if (url.includes('mixkit.co')) return '/videos/dance_flow.mp4';
  return url;
}

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  onOpenComments: (video: Video) => void;
  onOpenShare: (video: Video) => void;
  onOpenReport: (video: Video) => void;
  onSelectHashtag: (tag: string) => void;
  onSelectUser: (username: string) => void;
  currentUser: UserType | null;
}

export function VideoItem({
  video,
  isActive,
  isMuted,
  toggleMute,
  onOpenComments,
  onOpenShare,
  onOpenReport,
  onSelectHashtag,
  onSelectUser,
  currentUser,
}: VideoItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const safeSrc = getSafeVideoUrl(video.videoUrl);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Social & Stats state
  const [likesCount, setLikesCount] = useState(video.likesCount);
  const [viewsCount, setViewsCount] = useState(video.viewsCount);
  const [isLiked, setIsLiked] = useState(Boolean(video.isLiked));
  const [isSaved, setIsSaved] = useState(Boolean(video.isSaved));
  const [savesCount, setSavesCount] = useState(video.savesCount);
  const [isFollowing, setIsFollowing] = useState(Boolean(video.author.isFollowing));

  // Visual cues
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 15);
  const [menuOpen, setMenuOpen] = useState(false);

  // Threshold View Tracking
  const lastTapRef = useRef<number>(0);
  const watchSecondsRef = useRef<number>(0);
  const viewRecordedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);

  // Synchronize state if video prop updates
  useEffect(() => {
    setLikesCount(video.likesCount);
    setViewsCount(video.viewsCount);
    setIsLiked(Boolean(video.isLiked));
    setIsSaved(Boolean(video.isSaved));
    setSavesCount(video.savesCount);
    setIsFollowing(Boolean(video.author.isFollowing));
  }, [video]);

  // Autoplay / Pause handling based on viewport visibility
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      setHasError(false);
      viewRecordedRef.current = false;
      watchSecondsRef.current = 0;
      lastTimeRef.current = 0;
      el.currentTime = 0;

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(() => {
            // Autoplay with sound restricted by browser policy; try muted autoplay
            el.muted = true;
            el.play()
              .then(() => {
                setIsPlaying(true);
                setIsBuffering(false);
              })
              .catch(() => {
                // If autoplay blocked pending user interaction, simply pause cleanly
                setIsPlaying(false);
                setIsBuffering(false);
              });
          });
      }
    } else {
      el.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, [isActive, video.id, safeSrc]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Time, Buffer & View tracking update
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;

    const cur = el.currentTime;
    setCurrentTime(cur);
    setProgress((cur / el.duration) * 100);
    setDuration(el.duration);

    // Track meaningful watch time
    if (isActive && isPlaying && !viewRecordedRef.current) {
      const delta = Math.max(0, cur - lastTimeRef.current);
      if (delta > 0 && delta < 1) {
        watchSecondsRef.current += delta;
      }
      lastTimeRef.current = cur;

      // Meaningful view threshold: >= 2.5 seconds or 25% of video
      const minDuration = Math.min(2.5, el.duration * 0.25);
      if (watchSecondsRef.current >= minDuration) {
        viewRecordedRef.current = true;
        api.recordView(video.id, {
          durationWatched: watchSecondsRef.current,
          percentWatched: Math.round((cur / el.duration) * 100),
        })
          .then((res) => {
            if (res.viewsCount !== undefined) {
              setViewsCount(res.viewsCount);
            }
          })
          .catch(console.error);
      }
    }
  };

  const handleProgressBarClick = (e: MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    el.currentTime = fraction * el.duration;
  };

  // Video Click & Double-Tap
  const handleVideoAreaClick = (e: MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected -> Like video
      triggerLikeHeart();
      if (!isLiked) {
        handleLikeToggle();
      }
    } else {
      // Single tap -> Play / Pause toggle
      togglePlayPause();
    }
    lastTapRef.current = now;
  };

  const togglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    } else {
      el.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 550);
  };

  const retryPlayback = (e: MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsBuffering(true);
    const el = videoRef.current;
    if (el) {
      el.src = safeSrc;
      el.load();
      el.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch(() => {
          el.src = '/videos/dance_flow.mp4';
          el.load();
          el.play()
            .then(() => {
              setIsPlaying(true);
              setIsBuffering(false);
            })
            .catch(() => {
              setHasError(true);
              setIsBuffering(false);
            });
        });
    }
  };

  const toggleFullscreen = (e: MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(console.warn);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const triggerLikeHeart = () => {
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 850);
  };

  const handleLikeToggle = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (nextState) triggerLikeHeart();

    try {
      const res = await api.toggleLike(video.id);
      setLikesCount(res.likesCount);
      setIsLiked(res.isLiked);
    } catch (err) {
      console.error('Like toggle failed', err);
    }
  };

  const handleSaveToggle = async () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    setSavesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await api.toggleSave(video.id);
      setSavesCount(res.savesCount);
      setIsSaved(res.isSaved);
    } catch (err) {
      console.error('Save toggle failed', err);
    }
  };

  const handleFollowToggle = async (e: MouseEvent) => {
    e.stopPropagation();
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      const res = await api.toggleFollow(video.author.id);
      setIsFollowing(res.isFollowing);
    } catch (err) {
      console.error('Follow toggle failed', err);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id={`video-slide-${video.id}`}
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-[#070a0f] select-none py-1 md:py-3"
    >
      {/* Responsive Container: Mobile full screen, Desktop framed with companion layout */}
      <div className="relative w-full h-full md:max-w-[420px] lg:max-w-[450px] md:h-[calc(100vh-5rem)] md:rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 flex items-center justify-center">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          src={safeSrc}
          poster={video.thumbnailUrl}
          playsInline
          loop
          preload="auto"
          muted={isMuted}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setHasError(false);
          }}
          onCanPlay={() => setIsBuffering(false)}
          onError={() => {
            const el = videoRef.current;
            if (el && !el.src.includes('/videos/dance_flow.mp4')) {
              el.src = '/videos/dance_flow.mp4';
              el.load();
              el.play().catch(() => {});
              return;
            }
            setHasError(true);
            setIsBuffering(false);
            setIsPlaying(false);
          }}
          onTimeUpdate={handleTimeUpdate}
          onClick={handleVideoAreaClick}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Buffering Loading State Overlay */}
        {isBuffering && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-20">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <span className="text-[11px] text-white/80 font-medium mt-2">Buffering stream...</span>
          </div>
        )}

        {/* Failed Playback State Overlay */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-30 space-y-3 pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-sm">Unable to play video stream</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Playback interrupted due to network issue or media decoding.
            </p>
            <button
              type="button"
              onClick={retryPlayback}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-transform hover:scale-105 cursor-pointer shadow-lg"
            >
              Retry Playback
            </button>
          </div>
        )}

        {/* Play / Pause indicator icon overlay */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-18 h-18 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white scale-110 animate-out fade-out zoom-out duration-300">
              {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
            </div>
          </div>
        )}

        {/* Heart Burst Animation on Double Tap */}
        {heartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
            <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-2xl scale-125 transition-transform" />
          </div>
        )}

        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
          {/* Left: Sound Mute Toggle */}
          <button
            id={`mute-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-medium hover:bg-black/70 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="text-[11px]">Unmute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px]">Sound On</span>
              </>
            )}
          </button>

          {/* Right: Speed, Fullscreen, and More Menu */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu(!showSpeedMenu);
                }}
                className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold hover:bg-black/70 transition-colors flex items-center gap-1 cursor-pointer"
                title="Playback Speed"
              >
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div
                  className="absolute right-0 top-8 bg-[#161b22] border border-white/15 rounded-xl shadow-xl py-1 z-30 w-24 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full py-1 text-xs cursor-pointer ${
                        playbackRate === rate ? 'text-cyan-400 font-bold bg-white/5' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* More actions menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-10 w-48 bg-[#161b22] border border-white/15 rounded-xl shadow-xl py-1 z-30 text-left animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenReport(video);
                  }}
                  className="w-full px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report content</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenShare(video);
                  }}
                  className="w-full px-3 py-2 text-xs text-gray-200 hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share video link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Interaction Action Rail */}
        <div className="absolute right-2 md:right-3 bottom-16 flex flex-col items-center gap-4 z-20 pointer-events-auto">
          {/* Creator Avatar & Follow Toggle */}
          <div className="relative mb-1">
            <button
              id={`avatar-btn-${video.author.username}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectUser(video.author.username);
              }}
              className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <img
                src={video.author.avatar}
                alt={video.author.displayName}
                className="w-full h-full object-cover"
              />
            </button>

            {/* Follow "+" button */}
            {currentUser?.id !== video.author.id && (
              <button
                id={`follow-btn-${video.author.username}`}
                onClick={handleFollowToggle}
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-white text-black'
                    : 'bg-gradient-to-r from-rose-500 to-cyan-500 text-white hover:scale-110'
                }`}
                title={isFollowing ? 'Following' : 'Follow'}
              >
                {isFollowing ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </button>
            )}
          </div>

          {/* Like Button */}
          <button
            id={`like-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLikeToggle();
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 active:scale-90 transition-transform">
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {formatCount(likesCount)}
            </span>
          </button>

          {/* Comments Button */}
          <button
            id={`comments-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(video);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 active:scale-90 transition-transform">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {formatCount(video.commentsCount)}
            </span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            id={`save-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToggle();
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 active:scale-90 transition-transform">
              <Bookmark
                className={`w-5 h-5 transition-colors ${
                  isSaved ? 'fill-amber-400 text-amber-400 scale-110' : 'text-white'
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {formatCount(savesCount)}
            </span>
          </button>

          {/* Share Button */}
          <button
            id={`share-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(video);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 active:scale-90 transition-transform">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {formatCount(video.sharesCount)}
            </span>
          </button>

          {/* Views Count Badge */}
          <div className="flex flex-col items-center gap-0.5" title="Meaningful verified views">
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/5 flex items-center justify-center text-slate-300">
              <Eye className="w-4 h-4 text-cyan-400/80" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 drop-shadow">
              {formatCount(viewsCount)}
            </span>
          </div>

          {/* Sound Spinning Disc */}
          <div className="relative mt-1">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-tr from-gray-900 via-gray-800 to-black p-1 border border-white/20 shadow-lg ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '4s' }}
            >
              <img
                src={video.sound.coverUrl}
                alt="Sound track"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Bottom Video Metadata Overlay */}
        <div className="absolute left-0 right-14 bottom-3 px-4 pb-2 z-20 pointer-events-none text-left">
          {/* Creator handle */}
          <div className="flex items-center gap-2 mb-1 pointer-events-auto">
            <button
              onClick={() => onSelectUser(video.author.username)}
              className="font-brand font-bold text-base text-white hover:underline flex items-center gap-1 drop-shadow cursor-pointer"
            >
              <span>@{video.author.username}</span>
              {video.author.verified && (
                <span className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
              )}
            </button>
            <span className="text-[11px] text-white/60">
              • {formatTimeAgo(video.createdAt || video.created_at || new Date().toISOString())}
            </span>
          </div>

          {/* Caption with Expand/Collapse */}
          <div className="text-xs text-white/95 drop-shadow leading-relaxed mb-2 pointer-events-auto max-w-[90%]">
            <span className={captionExpanded ? '' : 'line-clamp-2'}>
              {video.caption}
            </span>
            {video.caption.length > 75 && (
              <button
                onClick={() => setCaptionExpanded(!captionExpanded)}
                className="ml-1 text-cyan-300 font-semibold text-[11px] hover:underline cursor-pointer"
              >
                {captionExpanded ? 'less' : 'more'}
              </button>
            )}
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1.5 mb-2 pointer-events-auto">
            {video.hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectHashtag(tag)}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 drop-shadow cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Sound Pill Ticker */}
          <div className="flex items-center gap-2 text-[11px] text-white/90 drop-shadow pointer-events-auto bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full w-fit max-w-[85%] border border-white/10">
            <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              {video.sound.title} • {video.sound.author}
            </span>
          </div>
        </div>

        {/* Video Scrubber Progress Bar with Time Display */}
        <div
          onClick={handleProgressBarClick}
          className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 hover:h-2.5 transition-all cursor-pointer z-30 group"
          title={`Seek video (${formatSeconds(currentTime)} / ${formatSeconds(duration)})`}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}

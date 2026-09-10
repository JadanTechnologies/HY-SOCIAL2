import React, { useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, Music, Lock, Globe, Users } from 'lucide-react';
import { Video } from '../../types';

interface VideoPreviewModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAnalytics?: () => void;
}

export function VideoPreviewModal({
  video,
  isOpen,
  onClose,
  onOpenAnalytics,
}: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen || !video) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  return (
    <div
      id="video-preview-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="video-preview-modal-container"
        className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left / Player Area */}
        <div className="relative bg-black flex items-center justify-center aspect-[9/16] md:w-[320px] shrink-0 overflow-hidden">
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onClick={togglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Quick controls overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right / Metadata Area */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border flex items-center gap-1.5 ${
                  video.privacy === 'public'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : video.privacy === 'followers'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {video.privacy === 'public' ? (
                  <Globe className="w-3 h-3" />
                ) : video.privacy === 'followers' ? (
                  <Users className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>{video.privacy}</span>
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              {video.title || 'Untitled Vibe'}
            </h3>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {video.caption}
            </p>

            {video.sound && (
              <div className="flex items-center gap-2 mt-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="text-[11px] truncate">
                  <span className="font-semibold text-white">{video.sound.title}</span>
                  <span className="text-slate-400"> • {video.sound.author}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>
                <span className="text-slate-500 block text-[10px]">Duration</span>
                <span className="font-semibold text-slate-200">{video.duration} seconds</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Resolution</span>
                <span className="font-semibold text-slate-200">
                  {video.dimensions ? `${video.dimensions.width}x${video.dimensions.height}` : '720x1280'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {onOpenAnalytics && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAnalytics();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer text-center"
                >
                  View Performance
                </button>
              )}
              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Globe,
  Users,
  Lock,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { Video } from '../../types';
import { api } from '../../services/api';

interface VideoEditModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoUpdated: (updatedVideo: Video) => void;
}

export function VideoEditModal({
  video,
  isOpen,
  onClose,
  onVideoUpdated,
}: VideoEditModalProps) {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setCaption(video.caption || '');
      setPrivacy(video.privacy || 'public');
      setError(null);
      setSuccessToast(false);
    }
  }, [video, isOpen]);

  if (!isOpen || !video) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setError('Caption cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await api.updateCreatorVideo(video.id, {
        title: title.trim(),
        caption: caption.trim(),
        privacy,
      });

      setSuccessToast(true);
      onVideoUpdated(res.video);

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Failed to update video settings');
    }
  };

  const handleAddHashtag = (tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
    if (!caption.includes(formatted)) {
      setCaption((prev) => `${prev.trim()} ${formatted}`);
    }
  };

  return (
    <div
      id="video-edit-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="video-edit-modal-container"
        className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Edit Video Details</h3>
              <p className="text-xs text-slate-400">Update caption, title & audience access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Thumbnail preview snippet */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <img
              src={video.thumbnailUrl}
              alt="Thumbnail"
              className="w-14 h-20 object-cover rounded-lg border border-white/10 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {title || 'Untitled Vibe'}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Current Privacy: <span className="capitalize text-slate-300">{video.privacy}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Duration: {video.duration}s
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Video Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Golden Hour Skate Session"
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Caption & Hashtags
              </label>
              <span className="text-[11px] text-slate-500">
                {caption.length}/500
              </span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell viewers about your video... #vibes #creator"
              rows={4}
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
            />
            {/* Quick Hashtag tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1">
                Suggestions:
              </span>
              {['vibetok', 'trending', 'creator', 'cinematic', 'bts'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddHashtag(tag)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-cyan-400 border border-white/5 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">
              Who can watch this video?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Public */}
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  privacy === 'public'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Globe className={`w-4 h-4 mb-2 ${privacy === 'public' ? 'text-cyan-400' : ''}`} />
                <div>
                  <p className="text-xs font-semibold leading-none">Public</p>
                  <p className="text-[10px] text-slate-400 mt-1">Everyone</p>
                </div>
              </button>

              {/* Followers */}
              <button
                type="button"
                onClick={() => setPrivacy('followers')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  privacy === 'followers'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Users className={`w-4 h-4 mb-2 ${privacy === 'followers' ? 'text-indigo-400' : ''}`} />
                <div>
                  <p className="text-xs font-semibold leading-none">Followers</p>
                  <p className="text-[10px] text-slate-400 mt-1">Followers only</p>
                </div>
              </button>

              {/* Private */}
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  privacy === 'private'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Lock className={`w-4 h-4 mb-2 ${privacy === 'private' ? 'text-amber-400' : ''}`} />
                <div>
                  <p className="text-xs font-semibold leading-none">Private</p>
                  <p className="text-[10px] text-slate-400 mt-1">Only you</p>
                </div>
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-xs font-bold text-slate-950 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : successToast ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Updated!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

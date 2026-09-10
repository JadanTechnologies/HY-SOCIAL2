import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Video } from '../../types';
import { api } from '../../services/api';
import { formatCount } from '../../utils/formatters';

interface DeleteConfirmModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoDeleted: (deletedId: string) => void;
}

export function DeleteConfirmModal({
  video,
  isOpen,
  onClose,
  onVideoDeleted,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !video) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteCreatorVideo(video.id);
      setIsDeleting(false);
      onVideoDeleted(video.id);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err.message || 'Failed to delete video');
    }
  };

  return (
    <div
      id="delete-video-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="delete-video-modal-container"
        className="w-full max-w-md bg-[#0d1117] border border-rose-500/20 rounded-2xl shadow-2xl overflow-hidden my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-rose-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Delete Video</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete this video? This action cannot be undone. All performance metrics, comments, and saves will be removed from your Creator Studio.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Video preview summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
            <img
              src={video.thumbnailUrl}
              alt="Thumbnail"
              className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {video.title || video.caption.slice(0, 40)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatCount(video.viewsCount)} views • {formatCount(video.likesCount)} likes
              </p>
              <span className="inline-block text-[10px] text-slate-400 capitalize bg-white/5 px-2 py-0.5 rounded mt-1">
                Privacy: {video.privacy}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Copy, Check, Share2, Code, QrCode, MessageSquare } from 'lucide-react';
import { Video } from '../../types';
import { api } from '../../services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onShareCompleted?: () => void;
  onShareToDM?: (video: Video) => void;
}

export function ShareModal({ isOpen, onClose, video, onShareCompleted, onShareToDM }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  if (!isOpen || !video) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?v=${video.id}` : '';
  const embedCode = `<iframe src="${shareUrl}" width="360" height="640" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    api.recordShare(video.id).catch(console.error);
    onShareCompleted?.();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    api.recordShare(video.id).catch(console.error);
    onShareCompleted?.();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendDM = () => {
    api.recordShare(video.id).catch(console.error);
    onClose();
    onShareToDM?.(video);
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="share-modal-content"
        className="w-full max-w-sm bg-[#161b22] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-brand font-bold text-white text-lg">Share Vibe</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video preview pill */}
        <div className="my-4 flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
          <img
            src={video.thumbnailUrl}
            alt="Thumbnail"
            className="w-12 h-16 object-cover rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">@{video.author.username}</p>
            <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{video.caption}</p>
          </div>
        </div>

        {/* Quick share options */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Direct Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 select-all focus:outline-none"
              />
              <button
                id="copy-share-link-btn"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Send via Direct Message */}
          {onShareToDM && (
            <button
              onClick={handleSendDM}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Send via Direct Message</span>
            </button>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-white/5">
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showEmbed ? 'Hide Embed Code' : 'Get Embed Code'}</span>
            </button>
          </div>

          {showEmbed && (
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <textarea
                readOnly
                rows={2}
                value={embedCode}
                className="w-full bg-transparent text-[11px] text-gray-300 font-mono resize-none focus:outline-none"
              />
              <button
                onClick={handleCopyEmbed}
                className="mt-2 w-full py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Copy Embed Snippet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

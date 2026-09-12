import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Shield,
  Ban,
  Flag,
  Film,
  User as UserIcon,
  Play,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { MessageConversation, ChatMessage, Video } from '../../types';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';

interface ConversationDetailsProps {
  conversation: MessageConversation;
  onClose?: () => void;
  onSelectUser: (username: string) => void;
  onSelectVideo?: (video: Video) => void;
  onToggleBlock: () => void;
  onOpenReport: () => void;
  isBlockedByMe: boolean;
}

export function ConversationDetails({
  conversation,
  onClose,
  onSelectUser,
  onSelectVideo,
  onToggleBlock,
  onOpenReport,
  isBlockedByMe,
}: ConversationDetailsProps) {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const { user, isOnline, lastSeen, messages } = conversation;

  // Extract shared videos in this conversation
  const sharedVideos = messages
    .filter((m) => m.type === 'video' && m.sharedVideo)
    .map((m) => m.sharedVideo as Video);

  return (
    <div
      id="conversation-details-panel"
      className="h-full flex flex-col bg-[#0b0f17] border-l border-white/10 overflow-y-auto text-slate-100 divide-y divide-white/5"
    >
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between bg-white/[0.02]">
        <h3 className="font-brand font-bold text-xs uppercase tracking-wider text-slate-400">
          Conversation Info
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User Profile Card */}
      <div className="p-5 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-lg"
          />
          {isOnline ? (
            <span
              className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b0f17] shadow-sm"
              title="Online now"
            />
          ) : (
            <span
              className="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full bg-slate-500 border-2 border-[#0b0f17]"
              title="Offline"
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className="font-bold text-white text-base truncate">{user.displayName}</h4>
          {user.isVerified && (
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              ✓
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-2">@{user.username}</p>

        {/* Presence status */}
        <div className="mb-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active now
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Last active {lastSeen ? formatRelativeTime(lastSeen) : 'recently'}
            </span>
          )}
        </div>

        {user.bio && (
          <p className="text-xs text-slate-300 leading-relaxed mb-4 max-w-xs">{user.bio}</p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div>
            <span className="block text-xs font-bold text-white">
              {formatNumber(user.followersCount || 0)}
            </span>
            <span className="block text-[10px] text-slate-400">Followers</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-white">
              {formatNumber(user.followingCount || 0)}
            </span>
            <span className="block text-[10px] text-slate-400">Following</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-white">
              {formatNumber(user.likesCount || 0)}
            </span>
            <span className="block text-[10px] text-slate-400">Likes</span>
          </div>
        </div>

        <button
          onClick={() => onSelectUser(user.username)}
          className="w-full max-w-xs py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>View Full Profile</span>
          <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
        </button>
      </div>

      {/* Shared Media Gallery */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <h5 className="font-bold text-xs text-white">Shared Media</h5>
          </div>
          <span className="text-[11px] text-slate-400">{sharedVideos.length} videos</span>
        </div>

        {sharedVideos.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-slate-500 text-xs">
            No vibes shared in this conversation yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {sharedVideos.slice(0, 6).map((vid) => (
              <button
                key={vid.id}
                onClick={() => onSelectVideo?.(vid)}
                className="group relative aspect-[9/14] rounded-lg overflow-hidden bg-black/40 border border-white/10 hover:border-cyan-400 transition-all cursor-pointer"
              >
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Safety & Moderation Controls */}
      <div className="p-4 space-y-3">
        <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
          Safety &amp; Privacy
        </h5>

        {showBlockConfirm ? (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Block @{user.username}?</span>
            </div>
            <p className="text-[11px] text-slate-300">
              They will not be able to message you or see your videos.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onToggleBlock();
                  setShowBlockConfirm(false);
                }}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer shadow"
              >
                Confirm Block
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (isBlockedByMe) {
                onToggleBlock();
              } else {
                setShowBlockConfirm(true);
              }
            }}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isBlockedByMe
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-white/5 border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>{isBlockedByMe ? `Unblock @${user.username}` : `Block @${user.username}`}</span>
          </button>
        )}

        <button
          onClick={onOpenReport}
          className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Flag className="w-4 h-4 text-amber-400" />
          <span>Report Conversation</span>
        </button>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">Secure Direct Messages</span>
            <span>Messages are protected and monitored by automated abuse prevention algorithms.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

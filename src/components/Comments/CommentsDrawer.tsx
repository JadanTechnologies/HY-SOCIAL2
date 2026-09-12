import { useState, useEffect, FormEvent } from 'react';
import { X, Send, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { Comment, User as UserType } from '../../types';
import { api } from '../../services/api';
import { formatCount, timeAgo } from '../../utils/formatters';
import { toastSound } from '../../services/toastSound';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  videoCaption?: string;
  currentUser: UserType | null;
  onCommentAdded?: () => void;
}

export function CommentsDrawer({
  isOpen,
  onClose,
  videoId,
  videoCaption,
  currentUser,
  onCommentAdded,
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && videoId) {
      setLoading(true);
      api.getComments(videoId)
        .then((data) => setComments(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, videoId]);

  if (!isOpen || !videoId) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || submitting) return;

    const trimmed = inputText.trim();
    setInputText('');
    setSubmitting(true);

    // Optimistic comment
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      videoId,
      author: currentUser || {
        id: 'anon',
        username: 'guest',
        displayName: 'Guest',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        bio: '',
        verified: false,
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        role: 'user',
      },
      text: trimmed,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repliesCount: 0,
    };

    setComments((prev) => [tempComment, ...prev]);
    toastSound.play('pop');

    try {
      const real = await api.addComment(videoId, trimmed);
      setComments((prev) => [real, ...prev.filter((c) => c.id !== tempComment.id)]);
      onCommentAdded?.();
    } catch (err) {
      console.error('Failed to post comment', err);
      // Revert if error
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      })
    );
  };

  return (
    <div
      id="comments-drawer-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end transition-opacity"
      onClick={onClose}
    >
      <div
        id="comments-drawer-content"
        className="w-full md:max-w-md h-[75vh] md:h-full mt-auto md:mt-0 bg-[#121720] border-t md:border-t-0 md:border-l border-white/10 flex flex-col shadow-2xl rounded-t-3xl md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Comments ({comments.length})
            </h3>
          </div>
          <button
            id="close-comments-drawer-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm animate-pulse">
              Loading conversation...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400/50 mx-auto" />
              <p className="font-medium text-white text-sm">No comments yet</p>
              <p className="text-xs text-gray-400">Be the first to share your thoughts on this vibe!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 group">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-200 hover:underline cursor-pointer">
                      @{comment.author.username}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-100 mt-1 leading-relaxed break-words">
                    {comment.text}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleLikeComment(comment.id)}
                  className="flex flex-col items-center gap-1 text-gray-400 hover:text-rose-400 pt-1 shrink-0 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 transition-transform active:scale-125 ${
                      comment.isLiked ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                  <span className="text-[10px] font-medium">
                    {formatCount(comment.likesCount)}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-white/10 bg-[#0d1117] flex items-center gap-3"
        >
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Current user"
            className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
          />
          <div className="flex-1 relative">
            <input
              id="comment-input-field"
              type="text"
              placeholder="Add a comment..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={280}
              className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            id="send-comment-btn"
            disabled={!inputText.trim() || submitting}
            className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

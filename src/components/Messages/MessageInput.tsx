import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Smile, Film, User as UserIcon, Ban, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onOpenShareAttachment: (mode: 'video' | 'profile') => void;
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
  onUnblock: () => void;
  sending: boolean;
  rateLimitError: string | null;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '💯', '✨', '🙌'];

export function MessageInput({
  onSendMessage,
  onTyping,
  onOpenShareAttachment,
  isBlockedByMe,
  isBlockedByThem,
  onUnblock,
  sending,
  rateLimitError,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Typing presence throttle
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2500);
  };

  const handleSend = async () => {
    const clean = text.trim();
    if (!clean || sending || isBlockedByMe || isBlockedByThem) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }

    setText('');
    setShowEmojiPicker(false);
    await onSendMessage(clean);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Blocked banners
  if (isBlockedByMe) {
    return (
      <div className="p-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <Ban className="w-4 h-4 shrink-0" />
          <span>You blocked this user. Unblock them to resume messaging.</span>
        </div>
        <button
          onClick={onUnblock}
          className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
        >
          Unblock
        </button>
      </div>
    );
  }

  if (isBlockedByThem) {
    return (
      <div className="p-4 border-t border-white/10 bg-slate-900/50 flex items-center gap-2 text-xs text-rose-300">
        <Ban className="w-4 h-4 shrink-0" />
        <span>Messaging unavailable. You cannot contact this user.</span>
      </div>
    );
  }

  return (
    <div id="message-input-bar" className="p-3 sm:p-4 border-t border-white/10 bg-[#0e131d]/90 relative">
      {/* Rate limit warning if active */}
      {rateLimitError && (
        <div className="mb-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{rateLimitError}</span>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="mb-2 p-2 rounded-xl bg-[#161d2b] border border-white/10 flex items-center gap-1.5 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-lg transition-transform active:scale-125 cursor-pointer shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={() => onOpenShareAttachment('video')}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
            title="Share Video"
          >
            <Film className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenShareAttachment('profile')}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
            title="Share Creator Profile"
          >
            <UserIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'text-cyan-400 bg-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Add Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send)"
            rows={1}
            maxLength={1000}
            className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none max-h-32 transition-colors"
          />
          {text.length > 900 && (
            <span
              className={`absolute right-3 bottom-2 text-[10px] ${
                text.length >= 1000 ? 'text-rose-400 font-bold' : 'text-slate-500'
              }`}
            >
              {1000 - text.length}
            </span>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20 mb-0.5 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Send</span>
        </button>
      </div>
    </div>
  );
}

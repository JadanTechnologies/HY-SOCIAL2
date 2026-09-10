import React, { useState, FormEvent } from 'react';
import { X, User, Image, Link, FileText, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        website: website.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="edit-profile-modal-card"
        className="w-full max-w-lg rounded-2xl bg-[#0e131d] border border-white/10 p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          id="edit-profile-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold font-brand text-white">Edit Profile</h2>
          <p className="text-xs text-slate-400 mt-1">Update your creator identity on VibeTok</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 pb-2">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/60 shrink-0"
            />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Avatar Image URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <Image className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2 pl-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Bio & Headline
              </label>
              <span className="text-[10px] text-slate-500">{bio.length}/120</span>
            </div>
            <textarea
              value={bio}
              maxLength={120}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community what you create..."
              className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              External Website / Portfolio
            </label>
            <div className="relative">
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourportfolio.art"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

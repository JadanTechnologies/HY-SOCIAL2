import { useState, useEffect } from 'react';
import { X, Check, User, Sparkles } from 'lucide-react';
import { User as UserType } from '../../types';
import { api } from '../../services/api';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUserChanged: (user: UserType) => void;
}

export function UserSwitcherModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}: UserSwitcherModalProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getUsers()
        .then((data) => setUsers(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = async (u: UserType) => {
    try {
      const res = await api.switchUser(u.id);
      if (res.success) {
        onUserChanged(res.user);
        onClose();
      }
    } catch (err) {
      console.error('Failed to switch user', err);
    }
  };

  return (
    <div
      id="user-switcher-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="user-switcher-modal"
        className="w-full max-w-md bg-[#161b22] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold text-white">Switch Active Account</h3>
              <p className="text-xs text-gray-400">Test different creator accounts & feeds</p>
            </div>
          </div>
          <button
            id="close-user-switcher-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400 animate-pulse">
              Loading accounts...
            </div>
          ) : (
            users.map((u) => {
              const isSelected = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  id={`switch-user-${u.username}`}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-sm'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{u.displayName}</span>
                        {u.role === 'creator' ? (
                          <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                            Creator
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

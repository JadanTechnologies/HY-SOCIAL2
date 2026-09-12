import React, { useState, FormEvent } from 'react';
import { X, Sparkles, User, Mail, Lock, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export function RegisterModal({
  isOpen,
  onClose,
  onOpenLogin,
}: RegisterModalProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscore).');
      return;
    }
    if (!email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Community Guidelines and Terms.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: cleanUser,
        email: email.trim(),
        password,
        displayName: displayName.trim() || cleanUser,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="register-modal-card"
        className="w-full max-w-md rounded-2xl bg-[#0e131d] border border-white/10 p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        <button
          id="register-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-brand text-white tracking-tight">Join HY</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create your account to discover clips, bookmark favorites, and publish.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Unique Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-500">@</span>
              <input
                id="register-input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="cyber_nomad"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Letters, numbers, and underscores only</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <input
                id="register-input-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Kai Rivers"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                id="register-input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <input
                id="register-input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
            />
            <span>
              I agree to the <span className="text-slate-200">Community Safety Guidelines</span> and Terms of Service.
            </span>
          </label>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20 mt-3"
          >
            {submitting ? 'Creating Account...' : 'Complete Sign Up'}
          </button>
        </form>

        {/* Footer link to login */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            id="register-to-login-link"
            type="button"
            onClick={onOpenLogin}
            className="text-cyan-400 font-semibold hover:underline ml-1"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, FormEvent } from 'react';
import { X, Lock, User, AlertCircle, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenForgotPassword,
}: LoginModalProps) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick preset helper for testing
  const handleQuickLogin = (userIdent: string, pwd = 'password123') => {
    setIdentifier(userIdent);
    setPassword(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="login-modal-card"
        className="w-full max-w-md rounded-2xl bg-[#0e131d] border border-white/10 p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          id="login-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-brand text-white tracking-tight">Log in to HY</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your feed, follow creators, and share original vibes.
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
              Username or Email
            </label>
            <div className="relative">
              <input
                id="login-input-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="jadan, tobi_bakare, or jadan@hy.app"
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-xs text-cyan-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            id="login-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20 mt-2"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Quick Demo Test Logins */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider">
            Quick 1-Click Demo Accounts
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              id="quick-login-jadan"
              onClick={() => handleQuickLogin('jadan', 'jadan')}
              className="px-2 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300 text-center transition-colors"
            >
              Jabir (jadan)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('tobi_bakare')}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 text-center transition-colors"
            >
              Tobi (Filmmaker)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('amaka_steps')}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 text-center transition-colors"
            >
              Amaka (Dancer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('tunde_soundz')}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 text-center transition-colors"
            >
              Tunde (Producer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('kemi_delights')}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 text-center transition-colors"
            >
              Kemi (Chef)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('emeka_skates')}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 text-center transition-colors"
            >
              Emeka (Skater)
            </button>
          </div>
        </div>

        {/* Footer link to register */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            id="login-to-register-link"
            type="button"
            onClick={onOpenRegister}
            className="text-cyan-400 font-semibold hover:underline ml-1"
          >
            Sign up now
          </button>
        </div>
      </div>
    </div>
  );
}

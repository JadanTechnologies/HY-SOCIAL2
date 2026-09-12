import React, { useState, FormEvent } from 'react';
import { X, KeyRound, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onOpenLogin,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Could not find an account with that email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword({ email: email.trim(), newPassword });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="forgot-password-modal-card"
        className="w-full max-w-md rounded-2xl bg-[#0e131d] border border-white/10 p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          id="forgot-password-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-brand text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'request' && 'Enter your registered email address to receive reset instructions.'}
            {step === 'reset' && `Verification code sent to ${email}. Set your new password.`}
            {step === 'success' && 'Your password has been successfully updated.'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Request */}
        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Email
              </label>
              <div className="relative">
                <input
                  id="forgot-input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tobi@hy.app"
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {submitting ? 'Verifying...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        {/* Step 2: New Password */}
        {step === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="reset-input-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="reset-input-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              id="reset-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {submitting ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-300">
              Your password has been reset. You can now log in with your updated credentials.
            </p>
            <button
              id="reset-success-login-btn"
              onClick={onOpenLogin}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Proceed to Log In
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Remembered your password?{' '}
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-cyan-400 font-semibold hover:underline ml-1"
          >
            Back to Log in
          </button>
        </div>
      </div>
    </div>
  );
}

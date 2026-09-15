import React from 'react';
import { Play, Sparkles, Flame, Shield, ArrowRight, Video, Compass, Users } from 'lucide-react';
import { Video as VideoType } from '../../types';

interface LandingViewProps {
  onExplore: () => void;
  onLogin: () => void;
  onRegister: () => void;
  featuredVideos?: VideoType[];
}

export function LandingView({
  onExplore,
  onLogin,
  onRegister,
}: LandingViewProps) {
  return (
    <div id="landing-page-root" className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col justify-between pt-16 md:pt-20">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>HY 1.0 Community Preview</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl font-brand">
          Where Culture Moves in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400">
            Real-Time
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          The next-generation short-form video platform built for independent creators,
          cinematic storytelling, and high-fidelity sound exploration.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            id="landing-cta-explore"
            onClick={onExplore}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2 transition-transform hover:scale-102 active:scale-98 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Watch Trending Vibes</span>
          </button>

          <button
            id="landing-cta-register"
            onClick={onRegister}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm sm:text-base flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="landing-cta-login"
            onClick={onLogin}
            className="px-5 py-3 rounded-xl text-slate-400 hover:text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer"
          >
            Log In
          </button>
        </div>

        {/* Live Preview Reel Cards */}
        <div className="mt-16 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl">
          <div
            onClick={onExplore}
            className="group relative rounded-2xl overflow-hidden aspect-[9/14] bg-slate-900 border border-white/10 shadow-2xl cursor-pointer hover:border-cyan-400/50 transition-all hover:-translate-y-1 flex items-center justify-center"
          >
            <div className="text-center p-6">
              <Play className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-white text-sm font-bold">Start Watching</h3>
              <p className="text-xs text-slate-400 mt-1">Explore content from creators</p>
            </div>
          </div>
          <div
            onClick={onExplore}
            className="group relative rounded-2xl overflow-hidden aspect-[9/14] bg-slate-900 border border-white/10 shadow-2xl cursor-pointer hover:border-cyan-400/50 transition-all hover:-translate-y-1 hidden sm:flex items-center justify-center"
          >
            <div className="text-center p-6">
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-white text-sm font-bold">Discover Vibes</h3>
              <p className="text-xs text-slate-400 mt-1">Trending and fresh content</p>
            </div>
          </div>
          <div
            onClick={onExplore}
            className="group relative rounded-2xl overflow-hidden aspect-[9/14] bg-slate-900 border border-white/10 shadow-2xl cursor-pointer hover:border-cyan-400/50 transition-all hover:-translate-y-1 hidden md:flex items-center justify-center"
          >
            <div className="text-center p-6">
              <Users className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <h3 className="text-white text-sm font-bold">Join Creators</h3>
              <p className="text-xs text-slate-400 mt-1">Sign up and start uploading</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Video className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-base">Uncompressed Sound</h4>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Experience Afrobeats rhythms, original Naija producer beats, and authentic creator sounds recorded across Lagos and beyond.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-base">Organic Discovery</h4>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Explore authentic micro-cinema and niche communities without clickbait or algorithmic trap loops.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-base">Community Safety</h4>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Built-in content reporting, active moderation queue, and respectful creator-first comment threads.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>HY Phase 1 Foundation · Engineered with React, TypeScript & Express</p>
      </footer>
    </div>
  );
}

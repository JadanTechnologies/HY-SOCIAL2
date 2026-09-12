/**
 * HY Toast and Notification Audio Synthesizer
 * Uses the Web Audio API to produce pleasant, crisp, zero-latency notification chimes
 * without external audio asset dependencies.
 */

type SoundType = 'notification' | 'success' | 'message' | 'pop' | 'error';

class ToastSoundService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.6;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hy_sound_enabled');
        if (stored !== null) {
          this.isEnabled = stored === 'true';
        }
        const storedVol = localStorage.getItem('hy_sound_volume');
        if (storedVol !== null) {
          this.volume = parseFloat(storedVol);
        }
      } catch {}
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('hy_sound_enabled', String(enabled));
    } catch {}
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('hy_sound_volume', String(this.volume));
    } catch {}
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Plays a synthesized audio chime corresponding to the toast or notification type
   */
  public play(type: SoundType = 'notification') {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(ctx.destination);

      switch (type) {
        case 'notification':
          // Warm 2-tone chime (F#5 -> C#6)
          this.playChime(ctx, masterGain, [
            { freq: 739.99, start: 0, dur: 0.28, type: 'sine' },
            { freq: 1108.73, start: 0.12, dur: 0.45, type: 'sine' },
          ]);
          break;

        case 'success':
          // Harmonious 3-tone ascending chord (C5 -> E5 -> G5 -> C6)
          this.playChime(ctx, masterGain, [
            { freq: 523.25, start: 0, dur: 0.18, type: 'sine' },
            { freq: 659.25, start: 0.08, dur: 0.22, type: 'sine' },
            { freq: 783.99, start: 0.16, dur: 0.35, type: 'sine' },
            { freq: 1046.50, start: 0.24, dur: 0.55, type: 'sine' },
          ]);
          break;

        case 'message':
          // Soft friendly double-tap chime
          this.playChime(ctx, masterGain, [
            { freq: 880, start: 0, dur: 0.12, type: 'sine' },
            { freq: 1318.51, start: 0.1, dur: 0.3, type: 'sine' },
          ]);
          break;

        case 'pop':
          // Gentle bubble pop for like / quick reactions
          this.playPop(ctx, masterGain);
          break;

        case 'error':
          // Subtle soft descending tone
          this.playChime(ctx, masterGain, [
            { freq: 440, start: 0, dur: 0.15, type: 'triangle' },
            { freq: 330, start: 0.12, dur: 0.3, type: 'triangle' },
          ]);
          break;
      }
    } catch (e) {
      console.warn('[ToastSound] Playback error', e);
    }
  }

  private playChime(
    ctx: AudioContext,
    dest: AudioNode,
    tones: Array<{ freq: number; start: number; dur: number; type?: OscillatorType }>
  ) {
    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type || 'sine';
      osc.frequency.setValueAtTime(tone.freq, ctx.currentTime + tone.start);

      // Smooth attack and soft exponential release
      const startTime = ctx.currentTime + tone.start;
      const endTime = startTime + tone.dur;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(endTime);
    });
  }

  private playPop(ctx: AudioContext, dest: AudioNode) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const toastSound = new ToastSoundService();

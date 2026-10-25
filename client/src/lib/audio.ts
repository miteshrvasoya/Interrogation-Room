/**
 * audio.ts
 * High-performance Web Audio procedural sound synthesizer.
 * Operates offline with zero external audio assets.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.droneGain) {
      this.droneGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Resonant wooden gavel strike
   */
  public playGavel() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Strike impulse (impact)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);

    // Resonant wooden body
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(80, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    bodyGain.gain.setValueAtTime(0.6, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.5);
  }

  /**
   * Dramatic objection sting
   */
  public playObjection() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [220, 277.18, 329.63, 440].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.4);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.02);
      osc.stop(now + 0.5);
    });
  }

  /**
   * High-voltage contradiction exposed sting!
   */
  public playContradiction() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Pitch sweep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(120, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);
  }

  /**
   * Pinning evidence to corkboard
   */
  public playPinEvidence() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Crisp typewriter click
   */
  public playTypewriter() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Tense atmospheric ambient drone
   */
  public startAmbientDrone() {
    if (this.isMuted || this.droneOsc) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.droneOsc = ctx.createOscillator();
    this.droneGain = ctx.createGain();

    this.droneOsc.type = 'triangle';
    this.droneOsc.frequency.setValueAtTime(55, now); // Low A

    this.droneGain.gain.setValueAtTime(0, now);
    this.droneGain.gain.linearRampToValueAtTime(0.04, now + 2);

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(ctx.destination);

    this.droneOsc.start(now);
  }

  public stopAmbientDrone() {
    if (this.droneOsc && this.droneGain && this.ctx) {
      this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => {
        try {
          this.droneOsc?.stop();
          this.droneOsc?.disconnect();
          this.droneOsc = null;
        } catch (_) {}
      }, 1000);
    }
  }
}

export const sounds = new SoundEngine();

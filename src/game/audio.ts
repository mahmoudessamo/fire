// Procedural Web Audio sound manager — no external files.
class AudioManager {
  private ctx: AudioContext | null = null;
  enabled = true;
  private sprayNode: { osc: OscillatorNode; gain: GainNode; noise: AudioBufferSourceNode } | null = null;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext, dur = 1): AudioBuffer {
    const len = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.stopSpray();
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  startSpray() {
    const ctx = this.ensure();
    if (!ctx || this.sprayNode) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx, 2);
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    this.sprayNode = { osc: null as any, gain, noise };
  }

  stopSpray() {
    if (this.sprayNode) {
      try {
        this.sprayNode.gain.gain.exponentialRampToValueAtTime(0.001, (this.ctx?.currentTime || 0) + 0.1);
        this.sprayNode.noise.stop((this.ctx?.currentTime || 0) + 0.12);
      } catch {
        // ignore
      }
      this.sprayNode = null;
    }
  }

  coin() {
    this.tone(880, 0.08, 'square', 0.15);
    setTimeout(() => this.tone(1320, 0.1, 'square', 0.12), 70);
  }

  rescue() {
    this.tone(523, 0.12, 'triangle', 0.18);
    setTimeout(() => this.tone(659, 0.12, 'triangle', 0.18), 100);
    setTimeout(() => this.tone(784, 0.16, 'triangle', 0.18), 200);
  }

  refill() {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  }

  damage() {
    this.tone(140, 0.18, 'sawtooth', 0.2);
  }

  explosion() {
    const ctx = this.ensure();
    if (!ctx) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx, 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.55);
  }

  fireExtinguished() {
    this.tone(660, 0.1, 'sine', 0.14);
    setTimeout(() => this.tone(440, 0.14, 'sine', 0.12), 80);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, 'triangle', 0.18), i * 140)
    );
  }

  lose() {
    [392, 330, 262].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.18), i * 180)
    );
  }

  click() {
    this.tone(600, 0.05, 'square', 0.1);
  }
}

export const audio = new AudioManager();

import {
  Fire,
  Person,
  RefillPoint,
  Hazard,
  Wall,
  Particle,
  SmokeZone,
  LevelConfig,
  MissionResult,
} from './types';
import { audio } from './audio';
import {
  drawFirefighter,
  drawFire,
  drawPerson,
  drawRefill,
  drawHazard,
  roundRect,
} from './render/sprites';

const LOGICAL_W = 1280;
const LOGICAL_H = 720;
const PLAYER_R = 16;
const PLAYER_SPEED = 0.28; // px per ms
const MAX_WATER = 100;
const MAX_HEALTH = 100;
const SPRAY_RANGE = 220;
const SPRAY_CONE = 0.38;

export interface EngineCallbacks {
  onHud: (hud: HudState) => void;
  onComplete: (result: MissionResult) => void;
  onShake: (intensity: number) => void;
}

export interface HudState {
  firesExt: number;
  totalFires: number;
  rescued: number;
  totalPeople: number;
  water: number;
  health: number;
  timeLeft: number;
  coins: number;
  canRefill: boolean;
  canRescue: boolean;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cb: EngineCallbacks;
  private level: LevelConfig;

  private fires: Fire[] = [];
  private people: Person[] = [];
  private refills: RefillPoint[] = [];
  private hazards: Hazard[] = [];
  private walls: Wall[] = [];
  private smoke: SmokeZone[] = [];
  private particles: Particle[] = [];

  private px = 0;
  private py = 0;
  private aimAngle = 0;
  private water = MAX_WATER;
  private health = MAX_HEALTH;
  private timeLeft = 0;
  private coinsEarned = 0;
  private tookDamage = false;

  private keys: Record<string, boolean> = {};
  private spraying = false;
  private mouseX = 0;
  private mouseY = 0;
  private moveVec = { x: 0, y: 0 }; // joystick
  private rescuePressed = false;
  private refillPressed = false;

  private running = false;
  private raf = 0;
  private last = 0;
  private t = 0;
  private damageCooldown = 0;
  private playerState: 'idle' | 'walk' | 'spray' | 'rescue' | 'damage' | 'victory' = 'idle';
  private rescueAnim = 0;

  private scale = 1;
  private offX = 0;
  private offY = 0;
  private hidpiTimer = 0;

  constructor(canvas: HTMLCanvasElement, level: LevelConfig, cb: EngineCallbacks, coins: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.level = level;
    this.cb = cb;
    this.coinsEarned = 0;
    this.initLevel(coins);
    this.bindInput();
  }

  private initLevel(_coins: number) {
    let idc = 0;
    this.fires = this.level.fires.map((f) => ({
      id: idc++,
      x: f.x,
      y: f.y,
      health: f.health,
      maxHealth: f.health,
      radius: f.intense ? 38 : 30,
      spreads: !!f.spreads,
      spreadTimer: 5000 + Math.random() * 4000,
      flicker: Math.random() * Math.PI * 2,
      intense: !!f.intense,
    }));
    this.people = this.level.people.map((p) => ({
      id: idc++,
      x: p.x,
      y: p.y,
      rescued: false,
      isPet: !!p.isPet,
      bob: 0,
    }));
    this.refills = this.level.refills.map((r) => ({ x: r.x, y: r.y, pulse: 0 }));
    this.hazards = (this.level.hazards || []).map((h) => ({
      id: idc++,
      x: h.x,
      y: h.y,
      type: h.type,
      radius: 30,
      timer: h.type === 'gas' ? 3000 + Math.random() * 3000 : 0,
      disabled: false,
    }));
    this.walls = this.level.walls.map((w) => ({
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      type: w.type || 'wall',
    }));
    this.smoke = (this.level.smoke || []).map((s) => ({
      x: s.x,
      y: s.y,
      radius: s.radius,
      drift: Math.random() * Math.PI * 2,
    }));
    this.px = this.level.start.x;
    this.py = this.level.start.y;
    this.water = MAX_WATER;
    this.health = MAX_HEALTH;
    this.timeLeft = this.level.time * 1000;
    this.tookDamage = false;
  }

  private bindInput() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === ' ') {
      e.preventDefault();
      this.spraying = true;
    }
    if (k === 'e') this.rescuePressed = true;
    if (k === 'r') this.refillPressed = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys[k] = false;
    if (k === ' ') this.spraying = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (e.clientX - rect.left - this.offX) / this.scale;
    this.mouseY = (e.clientY - rect.top - this.offY) / this.scale;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.spraying = true;
  };

  private onMouseUp = () => {
    this.spraying = false;
  };

  // ---- Mobile control API ----
  setMove(x: number, y: number) {
    this.moveVec.x = x;
    this.moveVec.y = y;
  }
  setSpray(v: boolean) {
    this.spraying = v;
  }
  triggerRescue() {
    this.rescuePressed = true;
  }
  triggerRefill() {
    this.refillPressed = true;
  }
  aimTowards(cx: number, cy: number) {
    this.mouseX = cx;
    this.mouseY = cy;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.loop(this.last);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    audio.stopSpray();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(now - this.last, 50);
    this.last = now;
    this.t += dt;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private collidesWall(x: number, y: number, r: number): boolean {
    for (const w of this.walls) {
      if (
        x + r > w.x &&
        x - r < w.x + w.w &&
        y + r > w.y &&
        y - r < w.y + w.h
      ) {
        return true;
      }
    }
    return false;
  }

  private update(dt: number) {
    // ---- movement ----
    let dx = 0;
    let dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    dx += this.moveVec.x;
    dy += this.moveVec.y;
    const mag = Math.hypot(dx, dy);
    let moving = false;
    if (mag > 0.05) {
      dx /= mag;
      dy /= mag;
      const speed = PLAYER_SPEED * dt;
      const nx = this.px + dx * speed;
      const ny = this.py + dy * speed;
      if (!this.collidesWall(nx, this.py, PLAYER_R)) this.px = Math.max(PLAYER_R, Math.min(LOGICAL_W - PLAYER_R, nx));
      if (!this.collidesWall(this.px, ny, PLAYER_R)) this.py = Math.max(PLAYER_R, Math.min(LOGICAL_H - PLAYER_R, ny));
      moving = true;
    }

    // block walking into intense fire
    for (const f of this.fires) {
      if (f.intense && f.health > 0) {
        const d = Math.hypot(this.px - f.x, this.py - f.y);
        if (d < f.radius + PLAYER_R - 6) {
          const push = (f.radius + PLAYER_R - 6 - d);
          const a = Math.atan2(this.py - f.y, this.px - f.x);
          this.px += Math.cos(a) * push;
          this.py += Math.sin(a) * push;
        }
      }
    }

    // ---- aim ----
    this.aimAngle = Math.atan2(this.mouseY - this.py, this.mouseX - this.px);

    // ---- spraying ----
    const canSpray = this.spraying && this.water > 0;
    if (canSpray) {
      this.water = Math.max(0, this.water - dt * 0.012);
      audio.startSpray();
      this.emitWaterParticles();
      this.applySpray(dt);
      this.playerState = 'spray';
    } else {
      audio.stopSpray();
    }

    // ---- fire updates ----
    let firesExt = 0;
    for (const f of this.fires) {
      f.flicker += dt * 0.01;
      if (f.health <= 0) {
        firesExt++;
        continue;
      }
      f.radius = (f.intense ? 38 : 30) * (0.5 + 0.5 * (f.health / f.maxHealth));
      // spread
      if (f.spreads) {
        f.spreadTimer -= dt;
        if (f.spreadTimer <= 0) {
          f.spreadTimer = 6000 + Math.random() * 4000;
          this.trySpread(f);
        }
      }
      // damage player if too close
      const d = Math.hypot(this.px - f.x, this.py - f.y);
      if (d < f.radius + PLAYER_R + 4) {
        this.damagePlayer(dt * 0.012, 'fire');
      }
      this.emitSmoke(f, dt);
    }

    // ---- smoke zones damage / vision ----
    for (const s of this.smoke) {
      s.drift += dt * 0.0008;
      const d = Math.hypot(this.px - s.x, this.py - s.y);
      if (d < s.radius) {
        this.damagePlayer(dt * 0.004, 'smoke');
      }
    }

    // ---- hazards ----
    for (const h of this.hazards) {
      if (h.disabled) continue;
      if (h.type === 'gas') {
        h.timer -= dt;
        const d = Math.hypot(this.px - h.x, this.py - h.y);
        if (h.timer <= 0) {
          this.explode(h.x, h.y);
          h.timer = 4000 + Math.random() * 3000;
        }
        if (d < h.radius) this.damagePlayer(dt * 0.006, 'gas');
      } else if (h.type === 'debris') {
        const d = Math.hypot(this.px - h.x, this.py - h.y);
        if (d < h.radius + PLAYER_R) this.damagePlayer(dt * 0.008, 'debris');
      } else if (h.type === 'electric') {
        // electric hazard: spraying water near it damages you until disabled
        const d = Math.hypot(this.px - h.x, this.py - h.y);
        if (canSpray && d < h.radius + 40) {
          this.damagePlayer(dt * 0.02, 'electric');
        }
        // disable by standing adjacent and pressing rescue (acts as 'disable')
        if (d < h.radius + PLAYER_R + 10 && this.rescuePressed) {
          h.disabled = true;
          audio.click();
          this.coinsEarned += 10;
        }
      }
    }

    // ---- refill ----
    let canRefill = false;
    for (const r of this.refills) {
      r.pulse += dt * 0.004;
      const d = Math.hypot(this.px - r.x, this.py - r.y);
      if (d < 40) {
        canRefill = true;
        if (this.refillPressed && this.water < MAX_WATER) {
          this.water = MAX_WATER;
          audio.refill();
          this.emitSplash(r.x, r.y);
        }
      }
    }

    // ---- rescue ----
    let canRescue = false;
    let nearestPerson: Person | null = null;
    let nearestD = 999;
    for (const p of this.people) {
      if (p.rescued) continue;
      p.bob = Math.sin(this.t * 0.005 + p.id) * 3;
      const blocked = this.fires.some(
        (f) => f.health > 0 && Math.hypot(p.x - f.x, p.y - f.y) < f.radius + 28
      );
      const d = Math.hypot(this.px - p.x, this.py - p.y);
      if (!blocked && d < 50) {
        canRescue = true;
        if (d < nearestD) {
          nearestD = d;
          nearestPerson = p;
        }
      }
    }
    if (this.rescuePressed && nearestPerson) {
      nearestPerson.rescued = true;
      this.rescueAnim = 600;
      audio.rescue();
      this.coinsEarned += nearestPerson.isPet ? 60 : 50;
      this.emitConfetti(nearestPerson.x, nearestPerson.y);
    }

    this.rescuePressed = false;
    this.refillPressed = false;

    if (this.rescueAnim > 0) {
      this.rescueAnim -= dt;
      this.playerState = 'rescue';
    } else if (!canSpray) {
      this.playerState = moving ? 'walk' : 'idle';
    }

    if (this.damageCooldown > 0) this.damageCooldown -= dt;

    // ---- particles ----
    this.updateParticles(dt);

    // ---- timer ----
    this.timeLeft -= dt;

    // ---- HUD ----
    const rescuedCount = this.people.filter((p) => p.rescued).length;
    this.cb.onHud({
      firesExt,
      totalFires: this.fires.length,
      rescued: rescuedCount,
      totalPeople: this.people.length,
      water: this.water,
      health: this.health,
      timeLeft: Math.max(0, this.timeLeft),
      coins: this.coinsEarned,
      canRefill,
      canRescue,
    });

    // ---- win / lose ----
    const allFiresOut = this.fires.every((f) => f.health <= 0);
    const allRescued = this.people.every((p) => p.rescued);
    if (allFiresOut && allRescued) {
      this.finish(true);
    } else if (this.timeLeft <= 0) {
      this.finish(false, 'Time ran out!');
    } else if (this.health <= 0) {
      this.finish(false, 'The firefighter lost all health!');
    }
  }

  private applySpray(dt: number) {
    for (const f of this.fires) {
      if (f.health <= 0) continue;
      const d = Math.hypot(f.x - this.px, f.y - this.py);
      if (d > SPRAY_RANGE) continue;
      const a = Math.atan2(f.y - this.py, f.x - this.px);
      let diff = Math.abs(a - this.aimAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < SPRAY_CONE) {
        const blockedByElectric = this.hazards.some(
          (h) => h.type === 'electric' && !h.disabled && Math.hypot(f.x - h.x, f.y - h.y) < h.radius + 30
        );
        const power = blockedByElectric ? 0.01 : 0.06;
        const prev = f.health;
        f.health -= dt * power * (f.intense ? 0.6 : 1);
        if (prev > 0 && f.health <= 0) {
          audio.fireExtinguished();
          this.emitSteam(f.x, f.y);
          this.coinsEarned += f.intense ? 25 : 15;
        }
        if (Math.random() < 0.3) this.emitSteam(f.x, f.y);
      }
    }
  }

  private trySpread(src: Fire) {
    const alive = this.fires.filter((f) => f.health > 0).length;
    if (alive >= 12) return;
    const ang = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 50;
    const nx = src.x + Math.cos(ang) * dist;
    const ny = src.y + Math.sin(ang) * dist;
    if (nx < 50 || nx > LOGICAL_W - 50 || ny < 50 || ny > LOGICAL_H - 50) return;
    if (this.collidesWall(nx, ny, 20)) return;
    // don't spread onto a person
    if (this.people.some((p) => !p.rescued && Math.hypot(p.x - nx, p.y - ny) < 40)) return;
    this.fires.push({
      id: Date.now() + Math.random(),
      x: nx,
      y: ny,
      health: src.maxHealth * 0.6,
      maxHealth: src.maxHealth * 0.6,
      radius: 22,
      spreads: true,
      spreadTimer: 7000 + Math.random() * 4000,
      flicker: Math.random() * Math.PI * 2,
      intense: false,
    });
  }

  private damagePlayer(amount: number, _source: string) {
    this.health = Math.max(0, this.health - amount);
    this.tookDamage = true;
    if (this.damageCooldown <= 0) {
      this.damageCooldown = 400;
      audio.damage();
      this.cb.onShake(6);
      this.playerState = 'damage';
    }
  }

  private explode(x: number, y: number) {
    audio.explosion();
    this.cb.onShake(16);
    if (navigator.vibrate) navigator.vibrate(80);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.1 + Math.random() * 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 600,
        maxLife: 600,
        size: 4 + Math.random() * 8,
        color: Math.random() > 0.5 ? '#ff6b00' : '#ffd000',
        kind: 'spark',
      });
    }
    const d = Math.hypot(this.px - x, this.py - y);
    if (d < 120) this.damagePlayer(20, 'explosion');
    // ignite a new fire at blast
    if (this.fires.filter((f) => f.health > 0).length < 14) {
      this.fires.push({
        id: Date.now() + Math.random(),
        x,
        y,
        health: 70,
        maxHealth: 70,
        radius: 24,
        spreads: false,
        spreadTimer: 9999,
        flicker: 0,
        intense: false,
      });
    }
  }

  private emitWaterParticles() {
    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const a = this.aimAngle + spread;
      const sp = 0.45 + Math.random() * 0.25;
      const startD = 22;
      this.particles.push({
        x: this.px + Math.cos(this.aimAngle) * startD,
        y: this.py + Math.sin(this.aimAngle) * startD,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 380,
        maxLife: 380,
        size: 3 + Math.random() * 3,
        color: 'rgba(140,210,255,0.85)',
        kind: 'water',
      });
    }
  }

  private emitSteam(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -0.08 - Math.random() * 0.05,
      life: 700,
      maxLife: 700,
      size: 8 + Math.random() * 10,
      color: 'rgba(220,220,220,0.5)',
      kind: 'smoke',
    });
  }

  private emitSmoke(f: Fire, _dt: number) {
    if (Math.random() < 0.08) {
      this.particles.push({
        x: f.x + (Math.random() - 0.5) * 16,
        y: f.y - 10,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.06 - Math.random() * 0.04,
        life: 1200,
        maxLife: 1200,
        size: 10 + Math.random() * 12,
        color: 'rgba(60,60,60,0.35)',
        kind: 'smoke',
      });
    }
  }

  private emitSplash(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.1 + Math.random() * 0.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.1,
        life: 400,
        maxLife: 400,
        size: 3 + Math.random() * 3,
        color: 'rgba(140,210,255,0.9)',
        kind: 'splash',
      });
    }
  }

  private emitConfetti(x: number, y: number) {
    const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.1 + Math.random() * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.2,
        life: 900,
        maxLife: 900,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: 'confetti',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'confetti') p.vy += 0.0008 * dt;
      if (p.kind === 'smoke') p.size += 0.01 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private finish(won: boolean, reason?: string) {
    if (!this.running) return;
    this.stop();
    audio.stopSpray();
    const rescuedCount = this.people.filter((p) => p.rescued).length;
    const pets = this.people.filter((p) => p.isPet && p.rescued).length;
    let stars = 0;
    let bonusCoins = 0;
    if (won) {
      stars = 1;
      const timeFrac = this.timeLeft / (this.level.time * 1000);
      const waterFrac = this.water / MAX_WATER;
      if (timeFrac > 0.3 || !this.tookDamage) stars = 2;
      if (timeFrac > 0.3 && !this.tookDamage && waterFrac > 0.2) stars = 3;
      else if (timeFrac > 0.4 && waterFrac > 0.3) stars = 3;
      bonusCoins = 100 + stars * 50 + Math.floor(timeFrac * 100);
      audio.win();
      this.cb.onShake(0);
      // confetti burst
      for (let i = 0; i < 5; i++) this.emitConfetti(this.px, this.py);
      this.playerState = 'victory';
    } else {
      audio.lose();
    }
    const result: MissionResult = {
      won,
      reason,
      stars,
      coins: this.coinsEarned + bonusCoins,
      firesExt: this.fires.filter((f) => f.health <= 0).length,
      totalFires: this.fires.length,
      rescued: rescuedCount,
      totalPeople: this.people.length,
      petsRescued: pets,
      timeRemaining: Math.max(0, Math.floor(this.timeLeft / 1000)),
      waterRemaining: Math.round(this.water),
      noDamage: !this.tookDamage,
    };
    setTimeout(() => this.cb.onComplete(result), won ? 800 : 400);
  }

  // ---------- RENDER ----------
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    const sx = (rect.width * dpr) / LOGICAL_W;
    const sy = (rect.height * dpr) / LOGICAL_H;
    this.scale = Math.min(sx, sy);
    this.offX = (this.canvas.width - LOGICAL_W * this.scale) / 2;
    this.offY = (this.canvas.height - LOGICAL_H * this.scale) / 2;
    // store css-space transform for input mapping
    this.scale = this.scale / dpr;
    this.offX = this.offX / dpr;
    this.offY = this.offY / dpr;
    this.dpr = dpr;
  }

  private dpr = 1;

  private render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.translate(this.offX, this.offY);
    ctx.scale(this.scale, this.scale);

    // clip to play area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.clip();

    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    g.addColorStop(0, this.level.bg[0]);
    g.addColorStop(1, this.level.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // floor grid texture
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < LOGICAL_W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_H);
      ctx.stroke();
    }
    for (let y = 0; y < LOGICAL_H; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(LOGICAL_W, y);
      ctx.stroke();
    }

    // walls
    for (const w of this.walls) {
      if (w.type === 'water') {
        ctx.fillStyle = '#1e6091';
      } else {
        ctx.fillStyle = '#3d3d3d';
      }
      roundRect(ctx, w.x, w.y, w.w, w.h, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // brick lines
      if (w.type !== 'water') {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let bx = w.x; bx < w.x + w.w; bx += 24) {
          ctx.beginPath();
          ctx.moveTo(bx, w.y);
          ctx.lineTo(bx, w.y + w.h);
          ctx.stroke();
        }
      }
    }

    // refill points
    for (const r of this.refills) drawRefill(ctx, r.x, r.y, r.pulse);

    // hazards (under fire)
    for (const h of this.hazards) drawHazard(ctx, h.x, h.y, h.type, this.t, h.disabled);

    // people
    for (const p of this.people) {
      if (p.rescued) continue;
      const inDanger = this.fires.some(
        (f) => f.health > 0 && Math.hypot(p.x - f.x, p.y - f.y) < f.radius + 50
      );
      drawPerson(ctx, p.x, p.y, p.isPet, p.bob, inDanger);
    }

    // smoke particles (behind fire glow)
    this.renderParticles(ctx, ['smoke']);

    // fires
    for (const f of this.fires) {
      if (f.health <= 0) continue;
      drawFire(ctx, f.x, f.y, f.radius, f.flicker, f.intense);
      // fire health ring
      const frac = f.health / f.maxHealth;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(f.x, f.y - f.radius - 14, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = frac > 0.5 ? '#52b788' : frac > 0.25 ? '#ffd000' : '#e63946';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(f.x, f.y - f.radius - 14, 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }

    // spray cone indicator (faint)
    if (this.spraying && this.water > 0) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.rotate(this.aimAngle);
      const grad = ctx.createLinearGradient(0, 0, SPRAY_RANGE, 0);
      grad.addColorStop(0, 'rgba(140,210,255,0.25)');
      grad.addColorStop(1, 'rgba(140,210,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.arc(0, 0, SPRAY_RANGE, -SPRAY_CONE, SPRAY_CONE);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // water/splash/spark/confetti particles
    this.renderParticles(ctx, ['water', 'splash', 'spark', 'confetti']);

    // player
    const flash = this.damageCooldown > 200;
    drawFirefighter(ctx, this.px, this.py, this.aimAngle, this.playerState, this.t, flash);

    // aim reticle
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.mouseX, this.mouseY, 8, 0, Math.PI * 2);
    ctx.moveTo(this.mouseX - 12, this.mouseY);
    ctx.lineTo(this.mouseX + 12, this.mouseY);
    ctx.moveTo(this.mouseX, this.mouseY - 12);
    ctx.lineTo(this.mouseX, this.mouseY + 12);
    ctx.stroke();

    // smoke zone fog (reduced visibility) - drawn on top
    for (const s of this.smoke) {
      const fog = ctx.createRadialGradient(s.x, s.y, s.radius * 0.2, s.x, s.y, s.radius);
      fog.addColorStop(0, 'rgba(40,40,40,0.55)');
      fog.addColorStop(1, 'rgba(40,40,40,0)');
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // clip
    ctx.restore(); // transform
  }

  private renderParticles(ctx: CanvasRenderingContext2D, kinds: string[]) {
    for (const p of this.particles) {
      if (!kinds.includes(p.kind)) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      if (p.kind === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.x * 0.1 + this.t * 0.01);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

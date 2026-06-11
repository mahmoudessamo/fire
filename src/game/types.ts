export type Vec = { x: number; y: number };

export interface Fire {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  radius: number;
  spreads: boolean;
  spreadTimer: number;
  flicker: number;
  intense: boolean;
}

export interface Person {
  id: number;
  x: number;
  y: number;
  rescued: boolean;
  isPet: boolean;
  bob: number;
}

export interface RefillPoint {
  x: number;
  y: number;
  pulse: number;
}

export interface Hazard {
  id: number;
  x: number;
  y: number;
  type: 'debris' | 'gas' | 'electric';
  radius: number;
  timer: number;
  disabled: boolean;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'wall' | 'water';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'water' | 'smoke' | 'spark' | 'confetti' | 'splash';
}

export interface SmokeZone {
  x: number;
  y: number;
  radius: number;
  drift: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  theme: string;
  bg: [string, string];
  time: number;
  fires: { x: number; y: number; health: number; spreads?: boolean; intense?: boolean }[];
  people: { x: number; y: number; isPet?: boolean }[];
  refills: { x: number; y: number }[];
  walls: { x: number; y: number; w: number; h: number; type?: 'wall' | 'water' }[];
  hazards?: { x: number; y: number; type: 'debris' | 'gas' | 'electric' }[];
  smoke?: { x: number; y: number; radius: number }[];
  start: { x: number; y: number };
  requireRefill?: boolean;
}

export interface SaveData {
  unlockedLevel: number;
  stars: Record<number, number>;
  coins: number;
  equipment: string[];
  soundOn: boolean;
}

export interface MissionResult {
  won: boolean;
  reason?: string;
  stars: number;
  coins: number;
  firesExt: number;
  totalFires: number;
  rescued: number;
  totalPeople: number;
  petsRescued: number;
  timeRemaining: number;
  waterRemaining: number;
  noDamage: boolean;
}

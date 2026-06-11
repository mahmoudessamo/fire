import { SaveData } from './types';
import { LEVELS } from './levels';

const KEY = 'fire-rescue-rush-save-v1';

const DEFAULT: SaveData = {
  unlockedLevel: 1,
  stars: {},
  coins: 0,
  equipment: ['hose'],
  soundOn: true,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT, ...parsed, stars: parsed.stars || {} };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function recordResult(
  save: SaveData,
  levelId: number,
  stars: number,
  coins: number
): SaveData {
  const next: SaveData = { ...save, stars: { ...save.stars } };
  const prev = next.stars[levelId] || 0;
  if (stars > prev) next.stars[levelId] = stars;
  next.coins += coins;
  if (levelId >= next.unlockedLevel && levelId < LEVELS.length) {
    next.unlockedLevel = Math.max(next.unlockedLevel, levelId + 1);
  }
  saveSave(next);
  return next;
}

export function buyEquipment(save: SaveData, id: string, price: number): SaveData {
  if (save.equipment.includes(id) || save.coins < price) return save;
  const next: SaveData = {
    ...save,
    coins: save.coins - price,
    equipment: [...save.equipment, id],
  };
  saveSave(next);
  return next;
}

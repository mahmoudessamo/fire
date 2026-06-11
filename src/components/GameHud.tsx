import React from 'react';
import { Pause, Volume2, VolumeX, Heart, Droplets, Clock, Coins, Flame, Users } from 'lucide-react';
import { HudState } from '../game/GameEngine';

export function GameHud({
  hud,
  levelName,
  levelId,
  soundOn,
  onPause,
  onToggleSound,
}: {
  hud: HudState;
  levelName: string;
  levelId: number;
  soundOn: boolean;
  onPause: () => void;
  onToggleSound: () => void;
}) {
  const mins = Math.floor(hud.timeLeft / 60000);
  const secs = Math.floor((hud.timeLeft % 60000) / 1000);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const lowTime = hud.timeLeft < 15000;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-start justify-between p-2 sm:p-3 gap-2">
        {/* Left: level + objectives */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 text-white">
            <div className="text-[10px] uppercase tracking-wider text-orange-300 font-bold">
              Level {levelId}
            </div>
            <div className="text-sm font-bold leading-tight">{levelName}</div>
          </div>
          <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-2 text-white text-xs font-bold flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-orange-400" />
              <span>Fires: {hud.firesExt}/{hud.totalFires}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-emerald-400" />
              <span>Rescued: {hud.rescued}/{hud.totalPeople}</span>
            </div>
          </div>
        </div>

        {/* Center: timer */}
        <div
          className={`bg-black/60 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2 ${
            lowTime ? 'animate-pulse' : ''
          }`}
        >
          <Clock size={20} className={lowTime ? 'text-red-400' : 'text-white'} />
          <span className={`text-2xl font-black tabular-nums ${lowTime ? 'text-red-400' : 'text-white'}`}>
            {timeStr}
          </span>
        </div>

        {/* Right: bars + buttons */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={onToggleSound}
              className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={onPause}
              className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <Pause size={18} />
            </button>
          </div>
          <Bar
            icon={<Heart size={14} className="text-red-400" />}
            value={hud.health}
            max={100}
            color="bg-gradient-to-r from-red-500 to-rose-400"
            label={`${Math.round(hud.health)}`}
          />
          <Bar
            icon={<Droplets size={14} className="text-sky-400" />}
            value={hud.water}
            max={100}
            color="bg-gradient-to-r from-sky-500 to-blue-400"
            label={`${Math.round(hud.water)}%`}
          />
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur rounded-xl px-3 py-1 text-yellow-300 font-bold text-sm">
            <Coins size={14} /> {hud.coins}
          </div>
        </div>
      </div>

      {/* Action hints */}
      <div className="flex justify-center gap-2 mt-1">
        {hud.canRescue && (
          <div className="bg-emerald-600/90 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
            Press E to Rescue
          </div>
        )}
        {hud.canRefill && (
          <div className="bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
            Press R to Refill
          </div>
        )}
      </div>
    </div>
  );
}

function Bar({
  icon,
  value,
  max,
  color,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-xl px-2 py-1">
      {icon}
      <div className="w-24 sm:w-32 h-3 rounded-full bg-white/15 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-200`}
          style={{ width: `${Math.max(0, (value / max) * 100)}%` }}
        />
      </div>
      <span className="text-white text-xs font-bold tabular-nums w-9 text-right">{label}</span>
    </div>
  );
}

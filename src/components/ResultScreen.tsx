import React, { useEffect } from 'react';
import { Home, RotateCcw, ChevronRight, Coins, Flame, Users, Clock, Droplets, Heart } from 'lucide-react';
import { MissionResult } from '../game/types';
import { StarRow } from './StarRow';

export function ResultScreen({
  result,
  hasNext,
  onNext,
  onReplay,
  onHome,
}: {
  result: MissionResult;
  hasNext: boolean;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 text-white shadow-2xl ${
          result.won
            ? 'bg-gradient-to-b from-emerald-700 to-emerald-900 border-2 border-emerald-400/50'
            : 'bg-gradient-to-b from-red-800 to-red-950 border-2 border-red-500/50'
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-1">
          {result.won ? 'Mission Complete!' : 'Mission Failed'}
        </h2>
        {!result.won && result.reason && (
          <p className="text-center text-red-200 font-medium mb-4">{result.reason}</p>
        )}

        {result.won && (
          <div className="flex justify-center my-4 scale-150">
            <StarRow count={result.stars} size={28} />
          </div>
        )}

        <div className="space-y-2 my-4 bg-black/20 rounded-2xl p-4">
          <Row icon={<Flame size={18} className="text-orange-400" />} label="Fires Extinguished" value={`${result.firesExt}/${result.totalFires}`} />
          <Row icon={<Users size={18} className="text-emerald-300" />} label="Civilians & Pets Rescued" value={`${result.rescued}/${result.totalPeople}`} />
          <Row icon={<Clock size={18} className="text-sky-300" />} label="Time Remaining" value={`${result.timeRemaining}s`} />
          <Row icon={<Droplets size={18} className="text-blue-300" />} label="Water Remaining" value={`${result.waterRemaining}%`} />
          <Row icon={<Heart size={18} className="text-rose-300" />} label="No Damage Bonus" value={result.noDamage ? 'Yes ✓' : 'No'} />
          <div className="h-px bg-white/20 my-2" />
          <Row icon={<Coins size={18} className="text-yellow-300" />} label="Coins Earned" value={`+${result.coins}`} highlight />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 font-bold transition"
          >
            <Home size={20} /> Home
          </button>
          <button
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 font-bold transition"
          >
            <RotateCcw size={20} /> Replay
          </button>
          {result.won && hasNext && (
            <button
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black transition"
            >
              Next <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-white/80">
        {icon} {label}
      </span>
      <span className={`font-bold ${highlight ? 'text-yellow-300 text-lg' : ''}`}>{value}</span>
    </div>
  );
}

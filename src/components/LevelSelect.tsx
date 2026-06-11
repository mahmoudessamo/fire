import React from 'react';
import { ArrowLeft, Lock, Wrench, Coins } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { SaveData } from '../game/types';
import { StarRow } from './StarRow';

export function LevelSelect({
  save,
  onBack,
  onSelect,
  onEquipment,
}: {
  save: SaveData;
  onBack: () => void;
  onSelect: (id: number) => void;
  onEquipment: () => void;
}) {
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-orange-400">Select Mission</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 font-bold">
            <Coins size={18} /> {save.coins}
          </div>
          <button
            onClick={onEquipment}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 font-bold transition"
          >
            <Wrench size={18} /> Gear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {LEVELS.map((lvl) => {
            const unlocked = lvl.id <= save.unlockedLevel;
            const stars = save.stars[lvl.id] || 0;
            return (
              <button
                key={lvl.id}
                disabled={!unlocked}
                onClick={() => onSelect(lvl.id)}
                className={`relative rounded-2xl p-4 text-left transition-all overflow-hidden ${
                  unlocked
                    ? 'bg-gradient-to-br hover:scale-[1.03] hover:shadow-xl cursor-pointer'
                    : 'bg-slate-700/50 cursor-not-allowed opacity-70'
                }`}
                style={
                  unlocked
                    ? { backgroundImage: `linear-gradient(135deg, ${lvl.bg[0]}, ${lvl.bg[1]})` }
                    : undefined
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl font-black text-white/90 drop-shadow">{lvl.id}</span>
                  {!unlocked && <Lock className="text-white/60" size={22} />}
                </div>
                <h3 className="font-bold text-sm leading-tight mb-1 text-white drop-shadow">
                  {lvl.name}
                </h3>
                <p className="text-xs text-white/70 mb-3">{lvl.theme}</p>
                {unlocked && <StarRow count={stars} size={16} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

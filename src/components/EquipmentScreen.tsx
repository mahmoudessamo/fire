import React from 'react';
import { ArrowLeft, Coins, Check, Lock } from 'lucide-react';
import { SaveData } from '../game/types';

const TOOLS = [
  { id: 'hose', name: 'Fire Hose', desc: 'Standard water hose', price: 0, icon: '🌊' },
  { id: 'extinguisher', name: 'Fire Extinguisher', desc: 'Quick small-fire burst', price: 150, icon: '🧯' },
  { id: 'axe', name: 'Fire Axe', desc: 'Break locked doors', price: 250, icon: '🪓' },
  { id: 'mask', name: 'Protective Mask', desc: 'Less smoke damage', price: 300, icon: '😷' },
  { id: 'flashlight', name: 'Flashlight', desc: 'See in dark levels', price: 200, icon: '🔦' },
  { id: 'ladder', name: 'Ladder', desc: 'Reach upper floors', price: 350, icon: '🪜' },
  { id: 'firstaid', name: 'First-Aid Kit', desc: 'Heal during missions', price: 400, icon: '🩹' },
  { id: 'backpack', name: 'Water Backpack', desc: '+50% water tank', price: 500, icon: '🎒' },
  { id: 'suit', name: 'Heat-Resistant Suit', desc: 'Less fire damage', price: 700, icon: '🦺' },
];

export function EquipmentScreen({
  save,
  onBack,
  onBuy,
}: {
  save: SaveData;
  onBack: () => void;
  onBuy: (id: string, price: number) => void;
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
        <h2 className="text-2xl sm:text-3xl font-black text-orange-400">Equipment</h2>
        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 font-bold">
          <Coins size={18} /> {save.coins}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {TOOLS.map((tool) => {
            const owned = save.equipment.includes(tool.id);
            const canBuy = !owned && save.coins >= tool.price;
            return (
              <div
                key={tool.id}
                className={`rounded-2xl p-5 border-2 transition ${
                  owned
                    ? 'bg-emerald-900/30 border-emerald-500/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{tool.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{tool.name}</h3>
                    <p className="text-sm text-white/60">{tool.desc}</p>
                  </div>
                </div>
                {owned ? (
                  <div className="flex items-center justify-center gap-2 mt-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                    <Check size={18} /> Equipped
                  </div>
                ) : (
                  <button
                    onClick={() => canBuy && onBuy(tool.id, tool.price)}
                    disabled={!canBuy}
                    className={`w-full flex items-center justify-center gap-2 mt-3 py-2 rounded-xl font-bold transition ${
                      canBuy
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950'
                        : 'bg-slate-700 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {canBuy ? <Coins size={18} /> : <Lock size={18} />}
                    {tool.price} coins
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

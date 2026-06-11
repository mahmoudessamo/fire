import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

export function PauseMenu({
  soundOn,
  onResume,
  onRestart,
  onHome,
  onToggleSound,
}: {
  soundOn: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onToggleSound: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-3xl p-6 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-white/10 text-white shadow-2xl">
        <h2 className="text-3xl font-black text-center mb-6 text-orange-400">Paused</h2>
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black transition"
          >
            <Play size={20} className="fill-yellow-950" /> Resume
          </button>
          <button
            onClick={onToggleSound}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 font-bold transition"
          >
            {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            Sound: {soundOn ? 'On' : 'Off'}
          </button>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 font-bold transition"
          >
            <RotateCcw size={20} /> Restart
          </button>
          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 font-bold transition"
          >
            <Home size={20} /> Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { Flame, Play } from 'lucide-react';
import { drawFirefighter, drawFire } from '../game/render/sprites';

export function StartScreen({ onPlay }: { onPlay: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let t = 0;
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      // truck body
      ctx.save();
      ctx.translate(w / 2 - 60, h / 2 + 30);
      ctx.fillStyle = '#c1121f';
      roundRectLocal(ctx, -90, -50, 180, 70, 10);
      ctx.fill();
      ctx.fillStyle = '#9d0208';
      roundRectLocal(ctx, 40, -70, 50, 40, 8);
      ctx.fill();
      // window
      ctx.fillStyle = '#a8dadc';
      roundRectLocal(ctx, 50, -62, 32, 24, 4);
      ctx.fill();
      // stripe
      ctx.fillStyle = '#ffd000';
      ctx.fillRect(-90, -10, 180, 8);
      // wheels
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-50, 25, 16, 0, Math.PI * 2);
      ctx.arc(55, 25, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6c757d';
      ctx.beginPath();
      ctx.arc(-50, 25, 7, 0, Math.PI * 2);
      ctx.arc(55, 25, 7, 0, Math.PI * 2);
      ctx.fill();
      // light bar
      ctx.fillStyle = Math.sin(t * 0.01) > 0 ? '#ff0000' : '#0066ff';
      roundRectLocal(ctx, 45, -78, 40, 8, 3);
      ctx.fill();
      ctx.restore();

      // firefighter
      drawFirefighter(ctx, w / 2 + 120, h / 2 + 50, -0.4, 'victory', t, false);

      // flames
      drawFire(ctx, 80, h - 70, 36, t * 0.01, true);
      drawFire(ctx, w - 80, h - 60, 30, t * 0.012, false);
      drawFire(ctx, 160, h - 50, 24, t * 0.014, false);

      t += 16;
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-orange-900 via-red-900 to-gray-900">
      <div className="absolute inset-0 opacity-30">
        <canvas ref={canvasRef} width={900} height={500} className="w-full h-full object-contain" />
      </div>
      <div className="relative z-10 text-center px-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Flame className="text-orange-400 animate-pulse" size={56} />
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]">
            FIRE RESCUE
          </h1>
          <Flame className="text-orange-400 animate-pulse" size={56} />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-widest drop-shadow-lg">
          RUSH
        </h2>
        <p className="text-lg sm:text-xl text-orange-100 mb-10 max-w-md mx-auto font-medium">
          Extinguish the flames and rescue everyone in time!
        </p>
        <button
          onClick={onPlay}
          className="group relative inline-flex items-center gap-3 px-12 py-5 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 text-red-950 text-2xl font-black shadow-[0_8px_0_#9a3412,0_12px_24px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-[0_4px_0_#9a3412,0_8px_16px_rgba(0,0,0,0.5)] active:translate-y-2 transition-all"
        >
          <Play className="fill-red-950" size={28} />
          PLAY
        </button>
      </div>
    </div>
  );
}

function roundRectLocal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

import React, { useRef, useCallback } from 'react';
import { Droplets, Heart, RefreshCw } from 'lucide-react';

export function MobileControls({
  onMove,
  onSpray,
  onRescue,
  onRefill,
  canRefill,
  canRescue,
}: {
  onMove: (x: number, y: number) => void;
  onSpray: (v: boolean) => void;
  onRescue: () => void;
  onRefill: () => void;
  canRefill: boolean;
  canRescue: boolean;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current!;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = rect.width / 2;
      const dist = Math.hypot(dx, dy);
      if (dist > max) {
        dx = (dx / dist) * max;
        dy = (dy / dist) * max;
      }
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      onMove(dx / max, dy / max);
    },
    [onMove]
  );

  const reset = useCallback(() => {
    activeId.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0,0)';
    onMove(0, 0);
  }, [onMove]);

  return (
    <div className="md:hidden absolute inset-0 pointer-events-none select-none">
      {/* Joystick */}
      <div
        ref={baseRef}
        className="absolute bottom-6 left-6 w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 backdrop-blur pointer-events-auto touch-none"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          activeId.current = t.identifier;
          handleMove(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === activeId.current) handleMove(t.clientX, t.clientY);
          }
        }}
        onTouchEnd={reset}
        onTouchCancel={reset}
      >
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-orange-500/80 border-2 border-white/40 shadow-lg"
          style={{ marginLeft: -32, marginTop: -32 }}
        />
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {canRefill && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onRefill();
            }}
            className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition"
          >
            <RefreshCw size={26} />
          </button>
        )}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onRescue();
          }}
          className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg active:scale-90 transition ${
            canRescue ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-700/60'
          }`}
        >
          <Heart size={26} />
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onSpray(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onSpray(false);
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-xl active:scale-90 transition border-4 border-white/30"
        >
          <Droplets size={40} />
        </button>
      </div>
    </div>
  );
}

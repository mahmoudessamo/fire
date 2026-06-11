import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, HudState } from '../game/GameEngine';
import { LEVELS } from '../game/levels';
import { MissionResult, SaveData } from '../game/types';
import { audio } from '../game/audio';
import { GameHud } from './GameHud';
import { MobileControls } from './MobileControls';
import { ResultScreen } from './ResultScreen';
import { PauseMenu } from './PauseMenu';

const EMPTY_HUD: HudState = {
  firesExt: 0,
  totalFires: 0,
  rescued: 0,
  totalPeople: 0,
  water: 100,
  health: 100,
  timeLeft: 0,
  coins: 0,
  canRefill: false,
  canRescue: false,
};

export function GameScreen({
  levelId,
  save,
  onComplete,
  onHome,
  onToggleSound,
}: {
  levelId: number;
  save: SaveData;
  onComplete: (result: MissionResult, levelId: number) => void;
  onHome: () => void;
  onToggleSound: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [paused, setPaused] = useState(false);
  const shakeRef = useRef(0);

  const level = LEVELS.find((l) => l.id === levelId)!;

  const buildEngine = useCallback(() => {
    const canvas = canvasRef.current!;
    const engine = new GameEngine(
      canvas,
      level,
      {
        onHud: (h) => setHud(h),
        onComplete: (r) => setResult(r),
        onShake: (i) => {
          shakeRef.current = i;
          const wrap = wrapRef.current;
          if (wrap && i > 0) {
            wrap.style.transform = `translate(${(Math.random() - 0.5) * i}px, ${(Math.random() - 0.5) * i}px)`;
            setTimeout(() => {
              if (wrap) wrap.style.transform = 'translate(0,0)';
            }, 80);
          }
        },
      },
      save.coins
    );
    engine.resize();
    engine.start();
    engineRef.current = engine;
  }, [level, save.coins]);

  useEffect(() => {
    audio.setEnabled(save.soundOn);
    buildEngine();
    const onResize = () => engineRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  const handlePause = () => {
    setPaused(true);
    engineRef.current?.stop();
    audio.stopSpray();
  };
  const handleResume = () => {
    setPaused(false);
    engineRef.current?.start();
  };
  const handleRestart = () => {
    setPaused(false);
    setResult(null);
    engineRef.current?.destroy();
    setHud(EMPTY_HUD);
    setTimeout(buildEngine, 0);
  };

  const handleResultNext = () => {
    if (result) onComplete(result, levelId);
    const next = LEVELS.find((l) => l.id === levelId + 1);
    if (next) {
      setResult(null);
      engineRef.current?.destroy();
      setHud(EMPTY_HUD);
      // parent will re-mount with new level via key, but also restart locally
    }
  };

  const handleResultReplay = () => {
    if (result) onComplete(result, levelId);
    handleRestart();
  };

  const handleResultHome = () => {
    if (result) onComplete(result, levelId);
    onHome();
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      <div ref={wrapRef} className="relative w-full h-full" style={{ transition: 'transform 0.05s' }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <GameHud
        hud={hud}
        levelName={level.name}
        levelId={levelId}
        soundOn={save.soundOn}
        onPause={handlePause}
        onToggleSound={onToggleSound}
      />

      <MobileControls
        onMove={(x, y) => engineRef.current?.setMove(x, y)}
        onSpray={(v) => engineRef.current?.setSpray(v)}
        onRescue={() => engineRef.current?.triggerRescue()}
        onRefill={() => engineRef.current?.triggerRefill()}
        canRefill={hud.canRefill}
        canRescue={hud.canRescue}
      />

      {paused && (
        <PauseMenu
          soundOn={save.soundOn}
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={() => {
            if (result) onComplete(result, levelId);
            onHome();
          }}
          onToggleSound={onToggleSound}
        />
      )}

      {result && (
        <ResultScreen
          result={result}
          hasNext={!!LEVELS.find((l) => l.id === levelId + 1) && result.won}
          onNext={handleResultNext}
          onReplay={handleResultReplay}
          onHome={handleResultHome}
        />
      )}
    </div>
  );
}

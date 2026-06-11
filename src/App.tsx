import React, { useState, useCallback, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { LevelSelect } from './components/LevelSelect';
import { EquipmentScreen } from './components/EquipmentScreen';
import { GameScreen } from './components/GameScreen';
import { loadSave, saveSave, recordResult, buyEquipment } from './game/storage';
import { SaveData, MissionResult } from './game/types';
import { audio } from './game/audio';
import { LEVELS } from './game/levels';

type Screen = 'start' | 'levels' | 'equipment' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    audio.setEnabled(save.soundOn);
  }, [save.soundOn]);

  const startLevel = useCallback((id: number) => {
    audio.click();
    setCurrentLevel(id);
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const handleComplete = useCallback(
    (result: MissionResult, levelId: number) => {
      if (result.won) {
        setSave((prev) => recordResult(prev, levelId, result.stars, result.coins));
      } else {
        setSave((prev) => {
          const next = { ...prev, coins: prev.coins + Math.floor(result.coins * 0.3) };
          saveSave(next);
          return next;
        });
      }
    },
    []
  );

  const toggleSound = useCallback(() => {
    setSave((prev) => {
      const next = { ...prev, soundOn: !prev.soundOn };
      saveSave(next);
      audio.setEnabled(next.soundOn);
      return next;
    });
  }, []);

  const handleBuy = useCallback((id: string, price: number) => {
    audio.click();
    setSave((prev) => buyEquipment(prev, id, price));
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {screen === 'start' && (
        <StartScreen
          onPlay={() => {
            audio.click();
            setScreen('levels');
          }}
        />
      )}

      {screen === 'levels' && (
        <LevelSelect
          save={save}
          onBack={() => setScreen('start')}
          onSelect={startLevel}
          onEquipment={() => setScreen('equipment')}
        />
      )}

      {screen === 'equipment' && (
        <EquipmentScreen save={save} onBack={() => setScreen('levels')} onBuy={handleBuy} />
      )}

      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          levelId={currentLevel}
          save={save}
          onComplete={handleComplete}
          onHome={() => setScreen('levels')}
          onToggleSound={toggleSound}
        />
      )}
    </div>
  );
}

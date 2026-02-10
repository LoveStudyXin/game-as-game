'use client';

import React, { useState } from 'react';
import { useCreationStore } from '@/lib/store';
import { CLASSIC_DNA_PRESETS } from '@/engine/dna-presets';
import { GENRE_LABELS } from '@/engine/dna-questions';
import type { GameGenre } from '@/engine/types';

type Mode = 'explore' | 'classic';

export default function StepChooseWorld() {
  const { dna, setDNAGenre, applyPreset, nextStep } = useCreationStore();
  const [mode, setMode] = useState<Mode>('explore');

  const genres: GameGenre[] = ['action', 'narrative', 'card', 'board', 'puzzle_logic', 'rhythm'];

  const handleGenreSelect = (genre: GameGenre) => {
    setDNAGenre(genre);
    nextStep(); // go to Step 1: Discover DNA
  };

  const handlePresetSelect = (preset: typeof CLASSIC_DNA_PRESETS[number]) => {
    applyPreset(preset.choices); // goes to Step 2 automatically
  };

  return (
    <div className="space-y-5">
      <h2 className="font-pixel text-[11px] text-pixel-gold text-center mb-1">
        🌍 选择你的世界
      </h2>

      {/* Mode toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setMode('explore')}
          className={`font-pixel text-[9px] px-4 py-1.5 border-2 transition-all cursor-pointer ${
            mode === 'explore'
              ? 'border-pixel-blue bg-pixel-blue/10 text-pixel-blue'
              : 'border-pixel-border text-[#9090b0] hover:border-pixel-light hover:text-pixel-light'
          }`}
        >
          🔮 探索未知
        </button>
        <button
          onClick={() => setMode('classic')}
          className={`font-pixel text-[9px] px-4 py-1.5 border-2 transition-all cursor-pointer ${
            mode === 'classic'
              ? 'border-pixel-gold bg-pixel-gold/10 text-pixel-gold'
              : 'border-pixel-border text-[#9090b0] hover:border-pixel-light hover:text-pixel-light'
          }`}
        >
          ⭐ 致敬经典
        </button>
      </div>

      {mode === 'explore' ? (
        /* ===== Explore mode: 6 genre cards ===== */
        <div>
          <p className="font-pixel text-[7px] text-[#aaaacc] text-center mb-4">
            选择一个世界类型，然后回答几个问题来发现你的游戏DNA
          </p>
          <div className="grid grid-cols-2 gap-3">
            {genres.map((genre) => {
              const info = GENRE_LABELS[genre];
              const isSelected = dna.genre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => handleGenreSelect(genre)}
                  className={`text-left p-3 border-2 transition-all cursor-pointer group
                    ${isSelected
                      ? 'border-pixel-blue bg-pixel-blue/10'
                      : 'border-pixel-border hover:border-pixel-blue bg-pixel-surface/30 hover:bg-pixel-blue/5'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[16px]">{info.icon}</span>
                    <span className={`font-pixel text-[10px] transition-colors
                      ${isSelected ? 'text-pixel-blue' : 'text-pixel-light group-hover:text-pixel-blue'}`}
                    >
                      {info.name}
                    </span>
                  </div>
                  <p className="font-pixel text-[7px] text-[#9090b0] leading-relaxed">
                    {info.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== Classic mode: 6 preset tribute cards ===== */
        <div>
          <p className="font-pixel text-[7px] text-[#aaaacc] text-center mb-4">
            选择一个经典灵魂，一键生成致敬经典的游戏！
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CLASSIC_DNA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="text-left p-3 border-2 border-pixel-border hover:border-pixel-gold transition-all cursor-pointer group bg-pixel-surface/30 hover:bg-pixel-gold/5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[16px]">{preset.icon}</span>
                  <span className="font-pixel text-[10px] text-pixel-light group-hover:text-pixel-gold transition-colors">
                    {preset.name}
                  </span>
                </div>
                <p className="font-pixel text-[7px] text-[#9090b0] leading-relaxed">
                  {preset.story}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

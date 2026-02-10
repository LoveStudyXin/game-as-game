'use client';

import React, { useMemo } from 'react';
import PixelInput from '@/components/pixel/PixelInput';
import PixelSlider from '@/components/pixel/PixelSlider';
import { useCreationStore } from '@/lib/store';
import { DNA_BANKS, SCENE_PLACEHOLDERS, GENRE_LABELS } from '@/engine/dna-questions';
import { CHAOS_COLOR_STOPS, CHAOS_MARKS } from './option-data';

export default function StepDiscoverDNA() {
  const { dna, setDNAAnswer, updateDNA } = useCreationStore();

  const bank = useMemo(() => DNA_BANKS[dna.genre], [dna.genre]);
  const genreInfo = GENRE_LABELS[dna.genre];
  const scenePlaceholder = SCENE_PLACEHOLDERS[dna.genre];

  if (!bank) return null;

  return (
    <div className="space-y-6">
      <h2 className="font-pixel text-[11px] text-pixel-gold text-center mb-1">
        🧬 发现你的DNA
      </h2>
      <p className="font-pixel text-[7px] text-[#aaaacc] text-center mb-2">
        {genreInfo.icon} {genreInfo.name} — 回答几个问题，让我们了解你的游戏灵魂
      </p>

      {/* Scenario-based questions */}
      {bank.questions.map((question, qIdx) => (
        <div key={question.id}>
          <h3 className="font-pixel text-[9px] text-pixel-light mb-3">
            <span className="text-pixel-blue mr-1">Q{qIdx + 1}.</span>
            {question.prompt}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {question.options.map((option) => {
              const isSelected = dna.answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setDNAAnswer(question.id, option.id)}
                  className={`text-left p-3 border-2 transition-all cursor-pointer group
                    ${isSelected
                      ? 'border-pixel-blue bg-pixel-blue/10'
                      : 'border-pixel-border hover:border-pixel-blue/50 bg-pixel-surface/20 hover:bg-pixel-blue/5'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] shrink-0">{option.icon}</span>
                    <div className="min-w-0">
                      <span className={`font-pixel text-[9px] transition-colors
                        ${isSelected ? 'text-pixel-blue' : 'text-pixel-light group-hover:text-pixel-blue'}`}
                      >
                        {option.label}
                      </span>
                      <p className="font-pixel text-[7px] text-[#9090b0] mt-0.5 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="font-pixel text-[8px] text-pixel-blue ml-auto shrink-0">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Divider */}
      <div className="border-t border-pixel-border/50 my-2" />

      {/* Free-text: scene description */}
      <PixelInput
        label="✨ 描述你梦中的场景（可选）"
        value={dna.sceneDescription}
        onChange={(v) => updateDNA({ sceneDescription: v })}
        placeholder={scenePlaceholder}
        maxLength={50}
      />

      {/* Free-text: game name */}
      <PixelInput
        label="📝 给你的游戏取个名字（可选）"
        value={dna.gameName}
        onChange={(v) => updateDNA({ gameName: v })}
        placeholder="留空的话我们会帮你取一个"
        maxLength={30}
      />

      {/* Chaos slider */}
      <div>
        <h3 className="font-pixel text-[9px] text-pixel-light mb-2">
          🎲 命运之轮
        </h3>
        <p className="font-pixel text-[7px] text-[#9090b0] mb-3">
          你的游戏世界有多不可预测？
        </p>
        <PixelSlider
          value={dna.chaosLevel}
          onChange={(v) => updateDNA({ chaosLevel: v })}
          min={0}
          max={100}
          step={1}
          label="命运之轮"
          colorStops={CHAOS_COLOR_STOPS}
          marks={CHAOS_MARKS}
        />
      </div>
    </div>
  );
}

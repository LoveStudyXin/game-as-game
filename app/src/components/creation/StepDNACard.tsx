'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import PixelSelect from '@/components/pixel/PixelSelect';
import PixelInput from '@/components/pixel/PixelInput';
import PixelSlider from '@/components/pixel/PixelSlider';
import { useCreationStore, useAuthStore } from '@/lib/store';
import { mapDNAToChoices, extractVisibleGenes, generateSoulText } from '@/engine/dna-mapper';
import type { GameConfig, CoreVerb, GravityMode, WorldBoundary, SpecialPhysics, DifficultyStyle, GamePace, SkillLuckRatio, VisualStyle } from '@/engine/types';
import {
  GENRE_VERBS,
  GENRE_GRAVITY,
  GENRE_BOUNDARY,
  GENRE_SPECIAL,
  GENRE_DIFFICULTY,
  GENRE_PACE,
  GENRE_SKILL_LUCK,
  STYLE_OPTIONS,
  GENRE_NAMES,
  ARCHETYPE_NAMES,
  CHAOS_COLOR_STOPS,
  CHAOS_MARKS,
} from './option-data';

export default function StepDNACard() {
  const router = useRouter();
  const { choices, dna, isPreset, updateChoices, setGeneratedConfig } = useCreationStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labOpen, setLabOpen] = useState(false);

  // Compute choices from DNA when not preset
  useEffect(() => {
    if (!isPreset) {
      const mapped = mapDNAToChoices(dna);
      updateChoices(mapped);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dna, isPreset]);

  // Visible genes
  const visibleGenes = useMemo(() => {
    if (isPreset) return [];
    return extractVisibleGenes(dna);
  }, [dna, isPreset]);

  // Soul text
  const soulText = useMemo(() => {
    if (isPreset) {
      const genreName = GENRE_NAMES[choices.genre] || '游戏';
      const archName = ARCHETYPE_NAMES[choices.characterArchetype] || '冒险者';
      return `一段${archName}在${genreName}世界中的经典冒险`;
    }
    return generateSoulText(dna);
  }, [dna, isPreset, choices.genre, choices.characterArchetype]);

  // Game name for display
  const displayName = dna.gameName.trim() || '未命名的游戏';

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const { generateGame } = await import('@/engine/generator');
      const config: GameConfig = generateGame(choices);
      setGeneratedConfig(config);

      // Save to backend
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          seedCode: config.seedCode,
          config,
          name: config.name,
          description: config.description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }

      router.push(`/play/${config.seedCode}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '生成失败，请重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Lab mode sections
  const genre = choices.genre;
  const gravitySection = GENRE_GRAVITY[genre] || GENRE_GRAVITY.action;
  const boundarySection = GENRE_BOUNDARY[genre] || GENRE_BOUNDARY.action;
  const specialSection = GENRE_SPECIAL[genre] || GENRE_SPECIAL.action;
  const difficultySection = GENRE_DIFFICULTY[genre] || GENRE_DIFFICULTY.action;
  const paceSection = GENRE_PACE[genre] || GENRE_PACE.action;
  const skillSection = GENRE_SKILL_LUCK[genre] || GENRE_SKILL_LUCK.action;
  const verbOptions = GENRE_VERBS[genre] || GENRE_VERBS.action;

  return (
    <div className="space-y-5">
      <h2 className="font-pixel text-[11px] text-pixel-gold text-center mb-2">
        🧬 你的游戏DNA
      </h2>

      {/* ===== DNA Card ===== */}
      <PixelCard variant="glow" className="!p-0 overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Game name */}
          <div className="text-center">
            <p className="font-pixel text-[12px] text-pixel-gold">
              {displayName}
            </p>
            <p className="font-pixel text-[7px] text-[#9090b0] mt-1">
              {GENRE_NAMES[choices.genre] || choices.genre}
            </p>
          </div>

          {/* Visible genes (显性基因) */}
          {visibleGenes.length > 0 && (
            <div>
              <p className="font-pixel text-[7px] text-[#aaaacc] mb-1.5">显性基因</p>
              <div className="flex flex-wrap gap-1.5">
                {visibleGenes.map((gene, i) => (
                  <span
                    key={i}
                    className="font-pixel text-[8px] text-pixel-blue bg-pixel-blue/10 border border-pixel-blue/30 px-2 py-0.5"
                  >
                    {gene.icon} {gene.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hidden genes (隐性基因) */}
          <div>
            <p className="font-pixel text-[7px] text-[#aaaacc] mb-1.5">隐性基因</p>
            <div className="flex flex-wrap gap-1.5">
              {dna.sceneDescription.trim() && (
                <span className="font-pixel text-[8px] text-pixel-purple bg-pixel-purple/10 border border-pixel-purple/30 px-2 py-0.5">
                  ✨ {dna.sceneDescription.trim().slice(0, 20)}
                  {dna.sceneDescription.trim().length > 20 ? '...' : ''}
                </span>
              )}
              <span className="font-pixel text-[8px] text-pixel-accent bg-pixel-accent/10 border border-pixel-accent/30 px-2 py-0.5">
                🎲 混沌 {dna.chaosLevel}%
              </span>
            </div>
          </div>

          {/* Soul description */}
          <div className="border-t border-pixel-border/30 pt-2">
            <p className="font-pixel text-[7px] text-[#aaaacc] mb-1">灵魂描述</p>
            <p className="font-pixel text-[8px] text-pixel-light leading-relaxed italic">
              &ldquo;{soulText}&rdquo;
            </p>
          </div>
        </div>
      </PixelCard>

      {/* ===== Lab Mode Toggle ===== */}
      <div className="text-center">
        <button
          onClick={() => setLabOpen(!labOpen)}
          className="font-pixel text-[7px] text-[#9090b0] hover:text-pixel-light cursor-pointer transition-colors"
        >
          {labOpen ? '🔬 收起实验室' : '🔬 实验室模式（高级）'}
        </button>
      </div>

      {/* ===== Lab Mode Content ===== */}
      {labOpen && (
        <div className="space-y-5 border-2 border-pixel-border/50 p-3 bg-pixel-surface/20">
          <p className="font-pixel text-[7px] text-[#9090b0] text-center">
            在这里精细调整所有游戏参数。修改会覆盖DNA推导的结果。
          </p>

          {/* Visual Style */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-2">视觉风格</h3>
            <PixelSelect
              options={STYLE_OPTIONS}
              value={choices.visualStyle}
              onChange={(v) => updateChoices({ visualStyle: v as VisualStyle })}
              layout="grid"
            />
          </div>

          {/* Verbs */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-2">核心动词</h3>
            <PixelSelect
              options={verbOptions}
              value={choices.verbs}
              onChange={(v) => updateChoices({ verbs: v as CoreVerb[] })}
              multiple
              maxSelect={3}
              layout="grid"
            />
          </div>

          {/* Gravity */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-1">{gravitySection.title}</h3>
            <p className="font-pixel text-[6px] text-[#9090b0] mb-2">{gravitySection.desc}</p>
            <PixelSelect
              options={gravitySection.options}
              value={choices.gravity}
              onChange={(v) => updateChoices({ gravity: v as GravityMode })}
              layout="grid"
            />
          </div>

          {/* Boundary */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-1">{boundarySection.title}</h3>
            <PixelSelect
              options={boundarySection.options}
              value={choices.boundary}
              onChange={(v) => updateChoices({ boundary: v as WorldBoundary })}
              layout="list"
            />
          </div>

          {/* Special Physics */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-1">{specialSection.title}</h3>
            <PixelSelect
              options={specialSection.options}
              value={choices.specialPhysics}
              onChange={(v) => updateChoices({ specialPhysics: v as SpecialPhysics })}
              layout="list"
            />
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-1">{difficultySection.title}</h3>
            <PixelSelect
              options={difficultySection.options}
              value={choices.difficultyStyle}
              onChange={(v) => updateChoices({ difficultyStyle: v as DifficultyStyle })}
              layout="grid"
            />
          </div>

          {/* Pace */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-1">{paceSection.title}</h3>
            <PixelSelect
              options={paceSection.options}
              value={choices.gamePace}
              onChange={(v) => updateChoices({ gamePace: v as GamePace })}
              layout="list"
            />
          </div>

          {/* Skill/Luck */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-1">{skillSection.title}</h3>
            <PixelSelect
              options={skillSection.options}
              value={choices.skillLuckRatio}
              onChange={(v) => updateChoices({ skillLuckRatio: v as SkillLuckRatio })}
              layout="grid"
            />
          </div>

          {/* Custom Element */}
          <PixelInput
            label="特别元素"
            value={choices.customElement}
            onChange={(v) => updateChoices({ customElement: v })}
            placeholder="添加独特的元素..."
            maxLength={50}
          />

          {/* Chaos override */}
          <div>
            <h3 className="font-pixel text-[9px] text-pixel-blue mb-2">混沌等级</h3>
            <PixelSlider
              value={choices.chaosLevel}
              onChange={(v) => updateChoices({ chaosLevel: v })}
              min={0}
              max={100}
              step={1}
              label="混沌"
              colorStops={CHAOS_COLOR_STOPS}
              marks={CHAOS_MARKS}
            />
          </div>
        </div>
      )}

      {/* ===== Error ===== */}
      {error && (
        <p className="font-pixel text-[8px] text-pixel-accent text-center">{error}</p>
      )}

      {/* ===== Generate Button ===== */}
      <div className="flex flex-col items-center gap-3">
        <PixelButton
          variant="accent"
          size="lg"
          onClick={handleGenerate}
          disabled={loading}
          fullWidth
        >
          {loading ? '正在生成...' : '⚡ 开始冒险'}
        </PixelButton>

        <p className="font-pixel text-[6px] text-[#9090b0] text-center">
          即使选择完全相同，每次生成也会产生独一无二的游戏
        </p>
      </div>
    </div>
  );
}

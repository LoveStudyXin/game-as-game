'use client';

import React, { useState } from 'react';
import PixelSelect from '@/components/pixel/PixelSelect';
import { useCreationStore } from '@/lib/store';
import type { GameGenre, VisualStyle, UserChoices } from '@/engine/types';

// ===== Quick-start presets =====
interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  choices: Partial<UserChoices>;
}

const PRESETS: Preset[] = [
  {
    id: 'mystery_detective',
    name: '暴风雪山庄',
    icon: '🔍',
    description: '经典密室推理，在封闭空间里寻找线索、推理真相',
    choices: {
      genre: 'narrative',
      visualStyle: 'pixel',
      verbs: ['explore', 'activate', 'collect'],
      objectTypes: [],
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'slippery',
      worldDifference: 'sound_solid',
      characterArchetype: 'collector',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'skill_heavy',
      chaosLevel: 10,
    },
  },
  {
    id: 'card_battle',
    name: '元素之战',
    icon: '🃏',
    description: '用卡牌策略击败AI对手，玩法类似炉石',
    choices: {
      genre: 'card',
      visualStyle: 'neon',
      verbs: ['activate', 'collect', 'defend'],
      objectTypes: [],
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'sticky',
      worldDifference: 'colors_alive',
      characterArchetype: 'guardian',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'balanced',
      chaosLevel: 0,
    },
  },
  {
    id: 'action_run',
    name: '霓虹跑酷',
    icon: '🏃',
    description: '在赛博朋克风格的世界里跳跃、射击、躲避',
    choices: {
      genre: 'action',
      visualStyle: 'neon',
      verbs: ['jump', 'shoot', 'dodge'],
      objectTypes: [],
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'elastic',
      worldDifference: 'colors_alive',
      characterArchetype: 'fugitive',
      difficultyStyle: 'steady',
      gamePace: 'fast',
      skillLuckRatio: 'pure_skill',
      chaosLevel: 20,
    },
  },
  {
    id: 'board_tactics',
    name: '魔法战棋',
    icon: '♟️',
    description: '在棋盘上排兵布阵，用策略击败敌方',
    choices: {
      genre: 'board',
      visualStyle: 'pixel',
      verbs: ['activate', 'push', 'defend'],
      objectTypes: [],
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'sticky',
      worldDifference: 'colors_alive',
      characterArchetype: 'guardian',
      difficultyStyle: 'steady',
      gamePace: 'slow',
      skillLuckRatio: 'skill_heavy',
      chaosLevel: 0,
    },
  },
  {
    id: 'puzzle_brain',
    name: '逻辑大师',
    icon: '🧩',
    description: '数独、连线和逻辑推理，考验你的脑力',
    choices: {
      genre: 'puzzle_logic',
      visualStyle: 'minimal',
      verbs: ['activate', 'push'],
      objectTypes: [],
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'elastic',
      worldDifference: 'colors_alive',
      characterArchetype: 'explorer',
      difficultyStyle: 'steady',
      gamePace: 'slow',
      skillLuckRatio: 'pure_skill',
      chaosLevel: 0,
    },
  },
  {
    id: 'rhythm_beat',
    name: '节拍风暴',
    icon: '🎵',
    description: '跟着节奏按键，追求Perfect判定',
    choices: {
      genre: 'rhythm',
      visualStyle: 'neon',
      verbs: ['activate', 'dodge', 'dash'],
      objectTypes: [],
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'slippery',
      worldDifference: 'sound_solid',
      characterArchetype: 'collector',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'pure_skill',
      chaosLevel: 5,
    },
  },
];

const GENRE_OPTIONS = [
  {
    value: 'action',
    label: '动作冒险',
    icon: '🏃',
    description: '在场景中操控角色战斗和探索',
  },
  {
    value: 'narrative',
    label: '文字推理',
    icon: '📖',
    description: '阅读线索、做选择、推理真相',
  },
  {
    value: 'card',
    label: '卡牌对战',
    icon: '🃏',
    description: '抽牌出牌、资源管理、策略对决',
  },
  {
    value: 'board',
    label: '棋盘战棋',
    icon: '♟️',
    description: '在棋盘上布局和战斗',
  },
  {
    value: 'puzzle_logic',
    label: '逻辑解谜',
    icon: '🧩',
    description: '数独、连线、逻辑推理',
  },
  {
    value: 'rhythm',
    label: '节奏动作',
    icon: '🎵',
    description: '跟随节拍按键',
  },
];

const STYLE_OPTIONS = [
  {
    value: 'pixel',
    label: '像素风',
    icon: '👾',
    description: '经典像素艺术，锐利边缘',
  },
  {
    value: 'neon',
    label: '霓虹光',
    icon: '✨',
    description: '发光线条，暗色背景，赛博朋克',
  },
  {
    value: 'minimal',
    label: '极简几何',
    icon: '◆',
    description: '干净几何形状，柔和配色',
  },
  {
    value: 'watercolor',
    label: '水彩画',
    icon: '🎨',
    description: '柔和渐变，有机形态，温暖色调',
  },
  {
    value: 'retro_crt',
    label: '复古CRT',
    icon: '📺',
    description: 'CRT扫描线、色差效果、怀旧风',
  },
];

export default function StepGameStyle() {
  const { choices, updateChoices, setStep } = useCreationStore();
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');

  const handlePresetSelect = (preset: Preset) => {
    updateChoices(preset.choices as Partial<UserChoices>);
    // Jump directly to the preview step (step 6)
    setStep(6);
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 justify-center mb-2">
        <button
          onClick={() => setMode('preset')}
          className={`font-pixel text-[9px] px-4 py-1.5 border-2 transition-all cursor-pointer ${
            mode === 'preset'
              ? 'border-pixel-gold bg-pixel-gold/10 text-pixel-gold'
              : 'border-pixel-border text-[#9090b0] hover:border-pixel-light hover:text-pixel-light'
          }`}
        >
          ⚡ 快速开始
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`font-pixel text-[9px] px-4 py-1.5 border-2 transition-all cursor-pointer ${
            mode === 'custom'
              ? 'border-pixel-blue bg-pixel-blue/10 text-pixel-blue'
              : 'border-pixel-border text-[#9090b0] hover:border-pixel-light hover:text-pixel-light'
          }`}
        >
          🔧 自定义
        </button>
      </div>

      {mode === 'preset' ? (
        /* ===== Preset mode ===== */
        <div>
          <p className="font-pixel text-[8px] text-pixel-light text-center mb-4">
            选择一个预设模板，一键生成游戏！不确定选什么就从这里开始
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PRESETS.map((preset) => (
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
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ===== Custom mode ===== */
        <div className="space-y-6">
          <div>
            <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
              游戏类型 <span className="text-pixel-gold">(核心)</span>
            </h2>
            <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
              选择一个类型，决定游戏的基本玩法框架
            </p>
            <PixelSelect
              options={GENRE_OPTIONS}
              value={choices.genre}
              onChange={(v) => {
                const genre = v as GameGenre;
                updateChoices({ genre, verbs: [] }); // reset verbs when genre changes
              }}
              layout="grid"
            />
          </div>

          <div>
            <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
              视觉风格
            </h2>
            <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
              选择游戏的画面风格
            </p>
            <PixelSelect
              options={STYLE_OPTIONS}
              value={choices.visualStyle}
              onChange={(v) => updateChoices({ visualStyle: v as VisualStyle })}
              layout="grid"
            />
          </div>
        </div>
      )}
    </div>
  );
}

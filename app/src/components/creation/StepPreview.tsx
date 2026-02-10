'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PixelButton from '@/components/pixel/PixelButton';
import { useCreationStore, useAuthStore } from '@/lib/store';
import type { GameConfig } from '@/engine/types';

// Verb display names
const VERB_NAMES: Record<string, string> = {
  jump: '跳跃', shoot: '射击', collect: '收集', dodge: '躲避', build: '建造',
  explore: '探索', push: '推动', activate: '激活', craft: '制作', defend: '防御', dash: '冲刺',
};

const GENRE_NAMES: Record<string, string> = {
  action: '动作冒险', narrative: '文字推理', card: '卡牌对战',
  board: '棋盘战棋', puzzle_logic: '逻辑解谜', rhythm: '节奏动作',
};

const STYLE_NAMES: Record<string, string> = {
  pixel: '像素风', neon: '霓虹光', minimal: '极简几何',
  watercolor: '水彩画', retro_crt: '复古CRT',
};

const GRAVITY_NAMES: Record<string, string> = {
  normal: '正常', low: '低重力', shifting: '变化的', reverse: '反向',
};

const BOUNDARY_NAMES: Record<string, string> = {
  walled: '有墙', loop: '循环', infinite: '无尽',
};

const PHYSICS_NAMES: Record<string, string> = {
  elastic: '弹性碰撞', slippery: '滑溜地面', sticky: '粘性表面',
};

const DIFFICULTY_NAMES: Record<string, string> = {
  relaxed: '轻松漫步', steady: '稳步挑战', hardcore: '硬核试炼', rollercoaster: '过山车',
};

const ARCHETYPE_NAMES: Record<string, string> = {
  explorer: '探险家', guardian: '守护者', fugitive: '逃亡者', collector: '收藏家',
};

export default function StepPreview() {
  const router = useRouter();
  const { choices, setGeneratedConfig } = useCreationStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soulText, setSoulText] = useState('');

  // Generate a "soul description" for this game
  const generateSoul = useCallback(() => {
    const verbText = choices.verbs.map(v => VERB_NAMES[v] || v).join('和');
    const worldText = choices.worldDifference;
    const chaosText = choices.chaosLevel > 70 ? '在不断变化的' : choices.chaosLevel > 30 ? '有些奇妙的' : '';
    const archetypeText = ARCHETYPE_NAMES[choices.characterArchetype] || '冒险者';

    const souls = [
      `一个${archetypeText}在${chaosText}${worldText}的世界中${verbText}的故事`,
      `${chaosText}世界里，一位${archetypeText}通过${verbText}寻找答案`,
      `当${worldText}成为现实，${archetypeText}必须${verbText}才能生存`,
    ];
    setSoulText(souls[Math.floor(Math.random() * souls.length)]);
  }, [choices]);

  React.useEffect(() => {
    generateSoul();
  }, [generateSoul]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      // Dynamically import the generator to keep it client-side only
      const { generateGame } = await import('@/engine/generator');
      const config = generateGame(choices);
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

      // Navigate to play page
      router.push(`/play/${config.seedCode}`);
    } catch (err: any) {
      setError(err.message || '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReroll = () => {
    generateSoul();
  };

  // Only show physics-related parameters for action genre
  const isActionGenre = choices.genre === 'action';

  // Genre-specific summary labels
  const GENRE_EXTRA_LABELS: Record<string, { label1: string; label2: string }> = {
    narrative: { label1: '故事类型', label2: '推理风格' },
    card: { label1: '卡组策略', label2: '对战模式' },
    board: { label1: '棋盘规模', label2: '战术风格' },
    puzzle_logic: { label1: '谜题类型', label2: '推理模式' },
    rhythm: { label1: '节拍风格', label2: '判定难度' },
  };

  return (
    <div className="space-y-5">
      <h2 className="font-pixel text-[11px] text-pixel-gold text-center mb-2">
        🎮 游戏预览
      </h2>

      {/* Soul description */}
      <div className="text-center p-3 bg-pixel-black border-2 border-pixel-border">
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-1">这个游戏的灵魂：</p>
        <p className="font-pixel text-[9px] text-pixel-light leading-relaxed">
          "{soulText}"
        </p>
        <button
          onClick={handleReroll}
          className="font-pixel text-[7px] text-pixel-blue mt-2 hover:text-pixel-light cursor-pointer"
        >
          🎲 换一个描述
        </button>
      </div>

      {/* Config summary — genre-aware display */}
      <div className="grid grid-cols-2 gap-3 text-[8px]">
        <div>
          <span className="font-pixel text-[#aaaacc]">游戏类型：</span>
          <span className="font-pixel text-pixel-gold">
            {GENRE_NAMES[choices.genre] || choices.genre}
          </span>
        </div>
        <div>
          <span className="font-pixel text-[#aaaacc]">视觉风格：</span>
          <span className="font-pixel text-pixel-gold">
            {STYLE_NAMES[choices.visualStyle] || choices.visualStyle}
          </span>
        </div>

        {/* Show verbs for action; show genre-appropriate info for others */}
        {isActionGenre ? (
          <>
            <div>
              <span className="font-pixel text-[#aaaacc]">核心动词：</span>
              <span className="font-pixel text-pixel-blue">
                {choices.verbs.map(v => VERB_NAMES[v] || v).join('、') || '未选择'}
              </span>
            </div>
            <div>
              <span className="font-pixel text-[#aaaacc]">重力：</span>
              <span className="font-pixel text-pixel-green">
                {GRAVITY_NAMES[choices.gravity] || choices.gravity}
              </span>
            </div>
            <div>
              <span className="font-pixel text-[#aaaacc]">边界：</span>
              <span className="font-pixel text-pixel-green">
                {BOUNDARY_NAMES[choices.boundary] || choices.boundary}
              </span>
            </div>
            <div>
              <span className="font-pixel text-[#aaaacc]">物理：</span>
              <span className="font-pixel text-pixel-green">
                {PHYSICS_NAMES[choices.specialPhysics] || choices.specialPhysics}
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="font-pixel text-[#aaaacc]">角色：</span>
              <span className="font-pixel text-pixel-purple">
                {ARCHETYPE_NAMES[choices.characterArchetype] || choices.characterArchetype}
              </span>
            </div>
            <div>
              <span className="font-pixel text-[#aaaacc]">难度：</span>
              <span className="font-pixel text-pixel-orange">
                {DIFFICULTY_NAMES[choices.difficultyStyle] || choices.difficultyStyle}
              </span>
            </div>
          </>
        )}

        {/* Action genre also shows character & difficulty */}
        {isActionGenre && (
          <>
            <div>
              <span className="font-pixel text-[#aaaacc]">角色：</span>
              <span className="font-pixel text-pixel-purple">
                {ARCHETYPE_NAMES[choices.characterArchetype] || choices.characterArchetype}
              </span>
            </div>
            <div>
              <span className="font-pixel text-[#aaaacc]">难度：</span>
              <span className="font-pixel text-pixel-orange">
                {DIFFICULTY_NAMES[choices.difficultyStyle] || choices.difficultyStyle}
              </span>
            </div>
          </>
        )}

        <div className="col-span-2">
          <span className="font-pixel text-[#aaaacc]">混沌：</span>
          <span className="font-pixel text-pixel-accent">
            {choices.chaosLevel}%
          </span>
        </div>
      </div>

      {error && (
        <p className="font-pixel text-[8px] text-pixel-accent text-center">{error}</p>
      )}

      {/* Generate button */}
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
          提示：即使选择完全相同，每次生成也会产生不同的游戏
        </p>
      </div>
    </div>
  );
}

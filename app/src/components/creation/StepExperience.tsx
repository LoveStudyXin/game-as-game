'use client';

import React, { useMemo } from 'react';
import PixelSelect from '@/components/pixel/PixelSelect';
import { useCreationStore } from '@/lib/store';
import type { DifficultyStyle, GamePace, SkillLuckRatio, GameGenre } from '@/engine/types';

interface ExpOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// ===== Genre-specific difficulty options =====
const GENRE_DIFFICULTY: Record<GameGenre, { title: string; desc: string; options: ExpOption[] }> = {
  action: {
    title: '难度风格',
    desc: '你喜欢什么样的挑战节奏？',
    options: [
      { value: 'relaxed', label: '轻松漫步', icon: '🌸', description: '享受探索，不太有压力' },
      { value: 'steady', label: '稳步挑战', icon: '📈', description: '逐渐增加的挑战感' },
      { value: 'hardcore', label: '硬核试炼', icon: '🔥', description: '从一开始就考验你的极限' },
      { value: 'rollercoaster', label: '过山车', icon: '🎢', description: '难度忽高忽低，充满惊喜' },
    ],
  },
  narrative: {
    title: '推理难度',
    desc: '你喜欢多烧脑的推理？',
    options: [
      { value: 'relaxed', label: '轻松推理', icon: '🌸', description: '线索明显，享受故事' },
      { value: 'steady', label: '适度推理', icon: '🧠', description: '需要思考但不会太难' },
      { value: 'hardcore', label: '烧脑推理', icon: '🔥', description: '隐藏线索多，需要深度分析' },
      { value: 'rollercoaster', label: '反转推理', icon: '🎭', description: '真相不断反转，出乎意料' },
    ],
  },
  card: {
    title: 'AI对手强度',
    desc: 'AI对手有多聪明？',
    options: [
      { value: 'relaxed', label: '新手AI', icon: '🤖', description: '随机出牌，容易打败' },
      { value: 'steady', label: '普通AI', icon: '🧮', description: '有基本策略的对手' },
      { value: 'hardcore', label: '高手AI', icon: '🧠', description: '会计算最优策略' },
      { value: 'rollercoaster', label: '变化AI', icon: '🎭', description: '策略不断变化，难以预测' },
    ],
  },
  board: {
    title: '战斗难度',
    desc: '敌方AI有多强？',
    options: [
      { value: 'relaxed', label: '入门战役', icon: '🌱', description: '敌方行动保守，适合新手' },
      { value: 'steady', label: '正规战役', icon: '⚔️', description: '敌方有一定战术' },
      { value: 'hardcore', label: '精英战役', icon: '🔥', description: '敌方占数量和位置优势' },
      { value: 'rollercoaster', label: '混战模式', icon: '🌪️', description: '局势瞬息万变' },
    ],
  },
  puzzle_logic: {
    title: '谜题难度',
    desc: '你喜欢多难的谜题？',
    options: [
      { value: 'relaxed', label: '入门级', icon: '🟢', description: '简单谜题，享受解题乐趣' },
      { value: 'steady', label: '中等难度', icon: '🟡', description: '需要思考的标准谜题' },
      { value: 'hardcore', label: '专家级', icon: '🔴', description: '高难度谜题，考验极限' },
      { value: 'rollercoaster', label: '渐进式', icon: '📈', description: '从简单到复杂逐步递进' },
    ],
  },
  rhythm: {
    title: '谱面难度',
    desc: '你想挑战什么难度的谱面？',
    options: [
      { value: 'relaxed', label: 'Easy', icon: '🟢', description: '音符稀疏，节奏舒缓' },
      { value: 'steady', label: 'Normal', icon: '🟡', description: '标准密度，有些挑战' },
      { value: 'hardcore', label: 'Expert', icon: '🔴', description: '密集音符，高速滚动' },
      { value: 'rollercoaster', label: 'Dynamic', icon: '🌊', description: '快慢交替，节奏变化多端' },
    ],
  },
};

// ===== Genre-specific pace options =====
const GENRE_PACE: Record<GameGenre, { title: string; desc: string; options: ExpOption[] }> = {
  action: {
    title: '游戏节奏',
    desc: '游戏的节奏有多快？',
    options: [
      { value: 'fast', label: '快', icon: '⚡', description: '紧张刺激，反应至上' },
      { value: 'medium', label: '中', icon: '🎵', description: '节奏适中，可以思考' },
      { value: 'slow', label: '慢', icon: '🌊', description: '缓慢沉浸，享受氛围' },
    ],
  },
  narrative: {
    title: '阅读节奏',
    desc: '故事展开的速度？',
    options: [
      { value: 'fast', label: '紧凑', icon: '⚡', description: '快速推进，悬念不断' },
      { value: 'medium', label: '适中', icon: '📖', description: '有张有弛的叙事节奏' },
      { value: 'slow', label: '沉浸', icon: '🌊', description: '细腻描写，深度沉浸' },
    ],
  },
  card: {
    title: '回合节奏',
    desc: '每回合有多少思考时间？',
    options: [
      { value: 'fast', label: '闪电战', icon: '⚡', description: '快速决策，30秒回合' },
      { value: 'medium', label: '标准', icon: '⏱️', description: '充足思考时间' },
      { value: 'slow', label: '深思', icon: '🧐', description: '无时间限制，充分思考' },
    ],
  },
  board: {
    title: '回合时长',
    desc: '每回合的决策时间？',
    options: [
      { value: 'fast', label: '闪击战', icon: '⚡', description: '快速决策，考验直觉' },
      { value: 'medium', label: '标准回合', icon: '⏱️', description: '合理的思考时间' },
      { value: 'slow', label: '运筹帷幄', icon: '🧐', description: '不限时间，深思熟虑' },
    ],
  },
  puzzle_logic: {
    title: '时间限制',
    desc: '解题有时间限制吗？',
    options: [
      { value: 'fast', label: '限时挑战', icon: '⏱️', description: '每题有严格时间限制' },
      { value: 'medium', label: '宽松限时', icon: '⏳', description: '有时间限制但比较宽松' },
      { value: 'slow', label: '无限制', icon: '♾️', description: '没有时间压力，慢慢想' },
    ],
  },
  rhythm: {
    title: 'BPM范围',
    desc: '曲子有多快？',
    options: [
      { value: 'fast', label: '高速', icon: '🚀', description: '160+ BPM，手速考验' },
      { value: 'medium', label: '中速', icon: '🎵', description: '120-160 BPM，舒适节奏' },
      { value: 'slow', label: '慢速', icon: '🌙', description: '80-120 BPM，轻松享受' },
    ],
  },
};

// ===== Genre-specific skill/luck options =====
const GENRE_SKILL_LUCK: Record<GameGenre, { title: string; desc: string; options: ExpOption[] }> = {
  action: {
    title: '技巧-运气比',
    desc: '游戏结果主要由什么决定？',
    options: [
      { value: 'pure_skill', label: '纯技巧', icon: '🎯', description: '一切取决于你的操作' },
      { value: 'skill_heavy', label: '偏技巧', icon: '🏹', description: '主要靠技巧，有一点运气' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '技巧与运气各占一半' },
      { value: 'luck_heavy', label: '偏运气', icon: '🎰', description: '很大程度上看运气' },
    ],
  },
  narrative: {
    title: '推理-直觉比',
    desc: '解谜主要靠逻辑还是直觉？',
    options: [
      { value: 'pure_skill', label: '纯逻辑', icon: '🧮', description: '每个线索都有逻辑联系' },
      { value: 'skill_heavy', label: '偏逻辑', icon: '🔍', description: '主要靠推理，偶尔需要灵感' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '逻辑推理和直觉灵感各半' },
      { value: 'luck_heavy', label: '偏直觉', icon: '💡', description: '更多依靠直觉和选择' },
    ],
  },
  card: {
    title: '策略-抽卡比',
    desc: '胜利主要靠策略还是运气？',
    options: [
      { value: 'pure_skill', label: '纯策略', icon: '🧠', description: '牌库固定，纯靠决策' },
      { value: 'skill_heavy', label: '偏策略', icon: '🎯', description: '好策略能弥补运气差' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '策略和抽牌运各占一半' },
      { value: 'luck_heavy', label: '偏运气', icon: '🎰', description: '抽到好牌就能赢' },
    ],
  },
  board: {
    title: '策略-运气比',
    desc: '胜负主要由什么决定？',
    options: [
      { value: 'pure_skill', label: '纯策略', icon: '♟️', description: '像国际象棋一样无随机' },
      { value: 'skill_heavy', label: '偏策略', icon: '🎯', description: '主要靠策略，有少量随机' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '策略和运气各占一半' },
      { value: 'luck_heavy', label: '偏运气', icon: '🎲', description: '骰子和随机事件影响大' },
    ],
  },
  puzzle_logic: {
    title: '逻辑-灵感比',
    desc: '解题需要什么样的思维？',
    options: [
      { value: 'pure_skill', label: '纯逻辑', icon: '🧮', description: '严格的逻辑推理题' },
      { value: 'skill_heavy', label: '偏逻辑', icon: '🔍', description: '主要靠推理，偶尔要灵光一闪' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '逻辑和创造性思维各半' },
      { value: 'luck_heavy', label: '偏灵感', icon: '✨', description: '需要跳跃性思维和联想' },
    ],
  },
  rhythm: {
    title: '反应-记忆比',
    desc: '靠即时反应还是记忆谱面？',
    options: [
      { value: 'pure_skill', label: '纯反应', icon: '⚡', description: '完全靠即时反应' },
      { value: 'skill_heavy', label: '偏反应', icon: '🎯', description: '主要靠反应，背谱有帮助' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '反应和记忆同样重要' },
      { value: 'luck_heavy', label: '偏模式', icon: '🔄', description: '固定模式，记住就能打' },
    ],
  },
};

export default function StepExperience() {
  const { choices, updateChoices } = useCreationStore();

  const diffSection = useMemo(() => GENRE_DIFFICULTY[choices.genre] || GENRE_DIFFICULTY.action, [choices.genre]);
  const paceSection = useMemo(() => GENRE_PACE[choices.genre] || GENRE_PACE.action, [choices.genre]);
  const skillSection = useMemo(() => GENRE_SKILL_LUCK[choices.genre] || GENRE_SKILL_LUCK.action, [choices.genre]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {diffSection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {diffSection.desc}
        </p>
        <PixelSelect
          options={diffSection.options}
          value={choices.difficultyStyle}
          onChange={(v) => updateChoices({ difficultyStyle: v as DifficultyStyle })}
          layout="grid"
        />
      </div>

      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {paceSection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {paceSection.desc}
        </p>
        <PixelSelect
          options={paceSection.options}
          value={choices.gamePace}
          onChange={(v) => updateChoices({ gamePace: v as GamePace })}
          layout="list"
        />
      </div>

      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {skillSection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {skillSection.desc}
        </p>
        <PixelSelect
          options={skillSection.options}
          value={choices.skillLuckRatio}
          onChange={(v) => updateChoices({ skillLuckRatio: v as SkillLuckRatio })}
          layout="grid"
        />
      </div>
    </div>
  );
}

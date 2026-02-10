'use client';

import React, { useMemo } from 'react';
import PixelSelect from '@/components/pixel/PixelSelect';
import PixelInput from '@/components/pixel/PixelInput';
import { useCreationStore } from '@/lib/store';
import type { CharacterArchetype, GameGenre } from '@/engine/types';

interface NarrativeOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// ===== Genre-specific "World Difference" (narrative seed) =====
const GENRE_WORLD_DIFF: Record<GameGenre, { title: string; desc: string; options: NarrativeOption[] }> = {
  action: {
    title: '世界的关键差异',
    desc: '"这个世界和现实的关键差异是什么？"',
    options: [
      { value: 'colors_alive', label: '颜色有生命', icon: '🎨', description: '在这个世界里，颜色是活着的生物' },
      { value: 'sound_solid', label: '声音是固体', icon: '🔊', description: '声音会结晶成固体的形状' },
      { value: 'memory_touch', label: '记忆可触摸', icon: '💭', description: '记忆是可以触碰和交易的物品' },
      { value: 'time_uneven', label: '时间不均匀', icon: '⏰', description: '时间在不同地方以不同速度流逝' },
    ],
  },
  narrative: {
    title: '故事舞台',
    desc: '你的推理故事发生在什么样的世界？',
    options: [
      { value: 'colors_alive', label: '维多利亚迷雾', icon: '🌫️', description: '雾都伦敦式的神秘氛围' },
      { value: 'sound_solid', label: '封闭空间', icon: '🚢', description: '暴风雪山庄式的密闭环境' },
      { value: 'memory_touch', label: '记忆迷宫', icon: '🧠', description: '故事发生在某人的记忆中' },
      { value: 'time_uneven', label: '时间错乱', icon: '⏳', description: '时间线被打乱的世界' },
    ],
  },
  card: {
    title: '卡牌世界观',
    desc: '你的卡牌对战发生在什么背景下？',
    options: [
      { value: 'colors_alive', label: '元素之争', icon: '🔥', description: '五种元素力量的对决' },
      { value: 'sound_solid', label: '机械帝国', icon: '⚙️', description: '蒸汽朋克机械战争' },
      { value: 'memory_touch', label: '灵魂召唤', icon: '👻', description: '召唤灵魂进行战斗' },
      { value: 'time_uneven', label: '时空裂隙', icon: '🌀', description: '跨时空的卡牌对决' },
    ],
  },
  board: {
    title: '战场背景',
    desc: '你的战棋发生在什么世界？',
    options: [
      { value: 'colors_alive', label: '魔法大陆', icon: '🏰', description: '魔法王国的领土争夺' },
      { value: 'sound_solid', label: '星际战场', icon: '🚀', description: '太空中的舰队对决' },
      { value: 'memory_touch', label: '历史战役', icon: '⚔️', description: '重现经典历史战役' },
      { value: 'time_uneven', label: '异界入侵', icon: '🌀', description: '抵御来自异世界的入侵' },
    ],
  },
  puzzle_logic: {
    title: '谜题主题',
    desc: '你的谜题有什么样的主题包装？',
    options: [
      { value: 'colors_alive', label: '数学之美', icon: '🔢', description: '纯粹的数字与逻辑之美' },
      { value: 'sound_solid', label: '古代遗迹', icon: '🏛️', description: '破解古代文明的谜题' },
      { value: 'memory_touch', label: '科学实验', icon: '🔬', description: '用科学知识解决谜题' },
      { value: 'time_uneven', label: '密码破译', icon: '🔐', description: '破解加密信息和密码' },
    ],
  },
  rhythm: {
    title: '音乐风格',
    desc: '你的节奏游戏是什么音乐风格？',
    options: [
      { value: 'colors_alive', label: '电子舞曲', icon: '🎹', description: '充满活力的电子音乐' },
      { value: 'sound_solid', label: '摇滚金属', icon: '🎸', description: '激烈的摇滚节奏' },
      { value: 'memory_touch', label: '古典优雅', icon: '🎻', description: '优美的古典乐章' },
      { value: 'time_uneven', label: '嘻哈节拍', icon: '🎤', description: '充满律动的嘻哈节拍' },
    ],
  },
};

// ===== Genre-specific "Character Archetype" =====
const GENRE_ARCHETYPE: Record<GameGenre, { title: string; desc: string; options: NarrativeOption[] }> = {
  action: {
    title: '角色原型',
    desc: '你在这个世界中扮演什么角色？',
    options: [
      { value: 'explorer', label: '探险家', icon: '🧭', description: '动机：发现未知。恐惧：停滞不前' },
      { value: 'guardian', label: '守护者', icon: '🛡️', description: '动机：保护重要的东西。恐惧：失败' },
      { value: 'fugitive', label: '逃亡者', icon: '🏃', description: '动机：逃离并生存。恐惧：被抓住' },
      { value: 'collector', label: '收藏家', icon: '📦', description: '动机：找到它们全部。恐惧：遗漏' },
    ],
  },
  narrative: {
    title: '侦探风格',
    desc: '你是什么类型的侦探？',
    options: [
      { value: 'explorer', label: '直觉型侦探', icon: '🔮', description: '依靠直觉和灵感解谜' },
      { value: 'guardian', label: '正义型侦探', icon: '⚖️', description: '为了正义不惜一切代价' },
      { value: 'fugitive', label: '灰色地带', icon: '🕶️', description: '游走在法律边缘的调查者' },
      { value: 'collector', label: '证据收集者', icon: '🔍', description: '一丝不苟地收集每条线索' },
    ],
  },
  card: {
    title: '战斗风格',
    desc: '你喜欢什么样的卡牌策略？',
    options: [
      { value: 'explorer', label: '冒险型', icon: '🎲', description: '喜欢高风险高回报的策略' },
      { value: 'guardian', label: '防御型', icon: '🛡️', description: '稳扎稳打，以守为攻' },
      { value: 'fugitive', label: '速攻型', icon: '⚡', description: '追求快速击倒对手' },
      { value: 'collector', label: '控制型', icon: '🎯', description: '控制局面，慢慢耗死对手' },
    ],
  },
  board: {
    title: '指挥官风格',
    desc: '你是什么类型的指挥官？',
    options: [
      { value: 'explorer', label: '先锋指挥官', icon: '🏴', description: '喜欢快速推进和侦察' },
      { value: 'guardian', label: '防御指挥官', icon: '🏰', description: '构建坚固防线，稳步推进' },
      { value: 'fugitive', label: '游击指挥官', icon: '💨', description: '灵活机动，出其不意' },
      { value: 'collector', label: '资源指挥官', icon: '📊', description: '掌控资源点，以多胜少' },
    ],
  },
  puzzle_logic: {
    title: '解题风格',
    desc: '你喜欢怎样解决谜题？',
    options: [
      { value: 'explorer', label: '尝试型', icon: '🧪', description: '大胆尝试，排除错误' },
      { value: 'guardian', label: '系统型', icon: '📋', description: '系统分析，逐步推理' },
      { value: 'fugitive', label: '直觉型', icon: '💡', description: '依靠灵感和直觉' },
      { value: 'collector', label: '穷举型', icon: '📊', description: '列出所有可能性逐一验证' },
    ],
  },
  rhythm: {
    title: '演奏风格',
    desc: '你喜欢什么样的演奏风格？',
    options: [
      { value: 'explorer', label: '自由即兴', icon: '🎷', description: '追求自由和即兴发挥' },
      { value: 'guardian', label: '精确演奏', icon: '🎯', description: '追求每个音符的完美' },
      { value: 'fugitive', label: '疯狂节奏', icon: '🥁', description: '追求极限速度和难度' },
      { value: 'collector', label: '全曲收集', icon: '⭐', description: '追求全部Perfect判定' },
    ],
  },
};

// Custom input labels per genre
const GENRE_CUSTOM_WORLD: Record<GameGenre, { label: string; placeholder: string }> = {
  action: { label: '或者，自定义你的世界观', placeholder: '输入你想象的世界差异...' },
  narrative: { label: '或者，自定义你的故事舞台', placeholder: '描述你想要的故事背景...' },
  card: { label: '或者，自定义卡牌世界', placeholder: '描述你想要的卡牌世界观...' },
  board: { label: '或者，自定义战场背景', placeholder: '描述你想要的战场背景...' },
  puzzle_logic: { label: '或者，自定义谜题主题', placeholder: '描述你想要的谜题主题...' },
  rhythm: { label: '或者，自定义音乐风格', placeholder: '描述你想要的音乐风格...' },
};

export default function StepNarrative() {
  const { choices, updateChoices } = useCreationStore();

  const worldSection = useMemo(() => GENRE_WORLD_DIFF[choices.genre] || GENRE_WORLD_DIFF.action, [choices.genre]);
  const archetypeSection = useMemo(() => GENRE_ARCHETYPE[choices.genre] || GENRE_ARCHETYPE.action, [choices.genre]);
  const customWorld = GENRE_CUSTOM_WORLD[choices.genre] || GENRE_CUSTOM_WORLD.action;

  const predefinedValues = worldSection.options.map(o => o.value);
  const isCustomWorld = !predefinedValues.includes(choices.worldDifference);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {worldSection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {worldSection.desc}
        </p>
        <PixelSelect
          options={worldSection.options}
          value={choices.worldDifference}
          onChange={(v) => updateChoices({ worldDifference: v as string })}
          layout="list"
        />
        <div className="mt-3">
          <PixelInput
            label={customWorld.label}
            value={isCustomWorld ? choices.worldDifference : ''}
            onChange={(v) => updateChoices({ worldDifference: v || 'colors_alive' })}
            placeholder={customWorld.placeholder}
            maxLength={60}
          />
        </div>
      </div>

      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {archetypeSection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {archetypeSection.desc}
        </p>
        <PixelSelect
          options={archetypeSection.options}
          value={choices.characterArchetype}
          onChange={(v) => updateChoices({ characterArchetype: v as CharacterArchetype })}
          layout="grid"
        />
      </div>
    </div>
  );
}

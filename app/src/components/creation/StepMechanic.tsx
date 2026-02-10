'use client';

import React, { useMemo } from 'react';
import PixelSelect from '@/components/pixel/PixelSelect';
import PixelInput from '@/components/pixel/PixelInput';
import { useCreationStore } from '@/lib/store';
import type { CoreVerb, ObjectType, GameGenre } from '@/engine/types';

interface VerbOption {
  value: CoreVerb;
  label: string;
  icon: string;
  description: string;
}

interface ObjectOption {
  value: ObjectType;
  label: string;
  icon: string;
  description: string;
}

// Each genre offers a different verb palette
const GENRE_VERBS: Record<GameGenre, VerbOption[]> = {
  action: [
    { value: 'jump', label: '跳跃', icon: '⬆️', description: '在平台间飞跃' },
    { value: 'shoot', label: '射击', icon: '💥', description: '向敌人发射弹幕' },
    { value: 'collect', label: '收集', icon: '✨', description: '搜集散落的宝物' },
    { value: 'dodge', label: '躲避', icon: '💨', description: '闪躲危险的障碍' },
    { value: 'build', label: '建造', icon: '🧱', description: '放置方块改变地形' },
  ],
  narrative: [
    { value: 'explore', label: '调查', icon: '🔍', description: '搜索线索和证据' },
    { value: 'activate', label: '对话', icon: '💬', description: '与角色交谈获取信息' },
    { value: 'collect', label: '收集', icon: '📋', description: '收集关键线索' },
    { value: 'craft', label: '推理', icon: '🧠', description: '将线索拼凑成真相' },
    { value: 'defend', label: '质问', icon: '⚖️', description: '用证据质疑嫌疑人' },
  ],
  card: [
    { value: 'collect', label: '抽牌', icon: '🎴', description: '从牌库抽取新牌' },
    { value: 'shoot', label: '攻击', icon: '⚔️', description: '使用攻击牌造成伤害' },
    { value: 'defend', label: '防御', icon: '🛡️', description: '使用防御牌减少伤害' },
    { value: 'craft', label: '合成', icon: '✨', description: '组合牌产生强力效果' },
    { value: 'activate', label: '施法', icon: '🔮', description: '释放法术牌的特殊效果' },
  ],
  board: [
    { value: 'push', label: '移动', icon: '♟️', description: '移动棋子到新位置' },
    { value: 'shoot', label: '攻击', icon: '⚔️', description: '攻击范围内的敌方棋子' },
    { value: 'defend', label: '防守', icon: '🛡️', description: '强化棋子的防御力' },
    { value: 'activate', label: '技能', icon: '⚡', description: '使用棋子的特殊技能' },
    { value: 'explore', label: '侦察', icon: '👁️', description: '揭示战争迷雾' },
  ],
  puzzle_logic: [
    { value: 'activate', label: '填入', icon: '✏️', description: '在格子中填入答案' },
    { value: 'explore', label: '推理', icon: '🧠', description: '根据线索进行推理' },
    { value: 'collect', label: '连接', icon: '🔗', description: '找到隐藏的关联' },
    { value: 'push', label: '排列', icon: '📊', description: '将元素排列到正确位置' },
    { value: 'craft', label: '组合', icon: '🧩', description: '将碎片组合成完整图案' },
  ],
  rhythm: [
    { value: 'activate', label: '击打', icon: '🥁', description: '精准时机触发音符' },
    { value: 'dodge', label: '闪避', icon: '💃', description: '随音乐节奏闪躲' },
    { value: 'collect', label: '收集', icon: '⭐', description: '在节拍点上收集音符' },
    { value: 'dash', label: '滑动', icon: '〰️', description: '沿轨道滑行' },
    { value: 'jump', label: '跳跃', icon: '🎵', description: '跟随节拍跳跃' },
  ],
};

// Each genre has its own set of interactive objects
const GENRE_OBJECTS: Record<GameGenre, ObjectOption[]> = {
  action: [
    { value: 'platform', label: '平台', icon: '▬', description: '可站立的表面' },
    { value: 'enemy', label: '敌人', icon: '👾', description: '危险的对手' },
    { value: 'puzzle', label: '机关', icon: '🔑', description: '需要解开的机关' },
    { value: 'resource', label: '资源', icon: '💎', description: '可收集的物品' },
  ],
  narrative: [
    { value: 'puzzle', label: '线索', icon: '🔍', description: '推动剧情的关键线索' },
    { value: 'resource', label: '证据', icon: '📄', description: '可收集的证据物品' },
    { value: 'enemy', label: '嫌疑人', icon: '🕵️', description: '值得怀疑的角色' },
    { value: 'platform', label: '场景', icon: '🏠', description: '可探索的地点' },
  ],
  card: [
    { value: 'resource', label: '法力', icon: '💧', description: '出牌消耗的能量' },
    { value: 'enemy', label: '对手', icon: '🤖', description: 'AI对手的策略' },
    { value: 'puzzle', label: '连锁', icon: '🔗', description: '牌效果的连锁机制' },
    { value: 'platform', label: '牌桌', icon: '🃏', description: '战场区域布局' },
  ],
  board: [
    { value: 'platform', label: '地形', icon: '🗺️', description: '影响移动的地形类型' },
    { value: 'enemy', label: '敌军', icon: '⚔️', description: '敌方棋子单位' },
    { value: 'resource', label: '补给', icon: '🏥', description: '恢复和增强道具' },
    { value: 'puzzle', label: '据点', icon: '🏰', description: '需要占领的目标' },
  ],
  puzzle_logic: [
    { value: 'puzzle', label: '谜题', icon: '🧩', description: '需要解开的核心谜题' },
    { value: 'resource', label: '提示', icon: '💡', description: '辅助解题的提示系统' },
    { value: 'platform', label: '网格', icon: '📐', description: '谜题的网格结构' },
    { value: 'enemy', label: '陷阱', icon: '⚠️', description: '误导和干扰因素' },
  ],
  rhythm: [
    { value: 'resource', label: '音符', icon: '🎵', description: '需要击中的音符' },
    { value: 'puzzle', label: '节拍', icon: '🥁', description: '需要跟随的节奏' },
    { value: 'enemy', label: '障碍', icon: '🚫', description: '需要避开的干扰' },
    { value: 'platform', label: '轨道', icon: '〰️', description: '音符滚动的轨道' },
  ],
};

// Description / title for the objects section per genre
const GENRE_OBJECT_LABELS: Record<GameGenre, { title: string; desc: string }> = {
  action: { title: '互动对象', desc: '你的世界里有什么东西？' },
  narrative: { title: '故事元素', desc: '你的故事由哪些要素组成？' },
  card: { title: '卡牌系统', desc: '你的卡牌世界包含什么？' },
  board: { title: '棋盘要素', desc: '你的棋盘上有什么？' },
  puzzle_logic: { title: '谜题元素', desc: '你的谜题由什么构成？' },
  rhythm: { title: '节奏元素', desc: '你的音乐世界包含什么？' },
};

const GENRE_LABELS: Record<GameGenre, string> = {
  action: '动作冒险',
  narrative: '文字推理',
  card: '卡牌对战',
  board: '棋盘战棋',
  puzzle_logic: '逻辑解谜',
  rhythm: '节奏动作',
};

export default function StepMechanic() {
  const { choices, updateChoices } = useCreationStore();

  const verbOptions = useMemo(() => {
    return GENRE_VERBS[choices.genre] || GENRE_VERBS.action;
  }, [choices.genre]);

  const objectOptions = useMemo(() => {
    return GENRE_OBJECTS[choices.genre] || GENRE_OBJECTS.action;
  }, [choices.genre]);

  const objectLabels = GENRE_OBJECT_LABELS[choices.genre] || GENRE_OBJECT_LABELS.action;
  const genreLabel = GENRE_LABELS[choices.genre] || '动作冒险';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          核心动词 <span className="text-pixel-gold">{genreLabel}</span>
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          选择 1-3 个核心动作，这决定了你的游戏怎么玩
        </p>
        <PixelSelect
          options={verbOptions}
          value={choices.verbs}
          onChange={(v) => updateChoices({ verbs: v as CoreVerb[] })}
          multiple
          maxSelect={3}
          layout="grid"
        />
      </div>

      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {objectLabels.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {objectLabels.desc}
        </p>
        <PixelSelect
          options={objectOptions}
          value={choices.objectTypes}
          onChange={(v) => updateChoices({ objectTypes: v as ObjectType[] })}
          multiple
          maxSelect={4}
          layout="grid"
        />
      </div>

      <PixelInput
        label="特别元素（可选）"
        value={choices.customElement}
        onChange={(v) => updateChoices({ customElement: v })}
        placeholder="你想加入什么特别的元素？比如：时间减速..."
        maxLength={50}
      />
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import PixelSelect from '@/components/pixel/PixelSelect';
import PixelInput from '@/components/pixel/PixelInput';
import { useCreationStore } from '@/lib/store';
import type { GravityMode, WorldBoundary, SpecialPhysics, GameGenre } from '@/engine/types';

// ===== Genre-specific world rule options =====

interface WorldOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// --- Section 1: "Gravity" equivalent per genre ---
const GENRE_GRAVITY: Record<GameGenre, { title: string; desc: string; options: WorldOption[] }> = {
  action: {
    title: '重力模式',
    desc: '这个世界的重力是怎样的？',
    options: [
      { value: 'normal', label: '正常', icon: '⬇️', description: '标准重力，脚踏实地' },
      { value: 'low', label: '低重力', icon: '🌙', description: '月球般轻盈的跳跃' },
      { value: 'shifting', label: '变化的', icon: '🔄', description: '重力会随时间改变' },
      { value: 'reverse', label: '反向', icon: '⬆️', description: '天花板才是地面' },
    ],
  },
  narrative: {
    title: '叙事节奏',
    desc: '故事的推进方式是怎样的？',
    options: [
      { value: 'normal', label: '线性叙事', icon: '📖', description: '按时间顺序平稳推进' },
      { value: 'low', label: '碎片叙事', icon: '🧩', description: '打乱时间线，拼凑真相' },
      { value: 'shifting', label: '多线叙事', icon: '🔀', description: '多条线索交织推进' },
      { value: 'reverse', label: '倒叙推理', icon: '⏪', description: '从结果倒推原因' },
    ],
  },
  card: {
    title: '资源模式',
    desc: '法力恢复的规则是怎样的？',
    options: [
      { value: 'normal', label: '每回合+1', icon: '💧', description: '每回合法力上限增加1' },
      { value: 'low', label: '固定法力', icon: '🔒', description: '每回合恢复固定法力' },
      { value: 'shifting', label: '波动法力', icon: '🌊', description: '法力恢复量随机变化' },
      { value: 'reverse', label: '消耗递减', icon: '📉', description: '使用越多卡牌费用越低' },
    ],
  },
  board: {
    title: '地形规则',
    desc: '棋盘的地形如何影响战斗？',
    options: [
      { value: 'normal', label: '标准地形', icon: '🗺️', description: '山地减速，水域阻隔' },
      { value: 'low', label: '平坦棋盘', icon: '⬜', description: '无地形影响，纯策略' },
      { value: 'shifting', label: '动态地形', icon: '🌋', description: '地形每回合会变化' },
      { value: 'reverse', label: '极端地形', icon: '🏔️', description: '地形效果加倍，影响显著' },
    ],
  },
  puzzle_logic: {
    title: '规则复杂度',
    desc: '谜题的规则有多复杂？',
    options: [
      { value: 'normal', label: '标准规则', icon: '📐', description: '经典谜题规则' },
      { value: 'low', label: '简化规则', icon: '🟢', description: '更少约束，入门友好' },
      { value: 'shifting', label: '渐进规则', icon: '📈', description: '每道题增加新规则' },
      { value: 'reverse', label: '变体规则', icon: '🔄', description: '每道题的规则都不同' },
    ],
  },
  rhythm: {
    title: '节奏模式',
    desc: '音符的运动方式是怎样的？',
    options: [
      { value: 'normal', label: '恒速滚动', icon: '➡️', description: '音符匀速从右向左' },
      { value: 'low', label: '慢速模式', icon: '🐢', description: '音符移动较慢，更容易判定' },
      { value: 'shifting', label: '变速滚动', icon: '🌊', description: '音符速度随节拍变化' },
      { value: 'reverse', label: '逆向滚动', icon: '⬅️', description: '音符从左向右滚动' },
    ],
  },
};

// --- Section 2: "Boundary" equivalent per genre ---
const GENRE_BOUNDARY: Record<GameGenre, { title: string; desc: string; options: WorldOption[] }> = {
  action: {
    title: '世界边界',
    desc: '到达世界边缘会怎样？',
    options: [
      { value: 'walled', label: '有墙', icon: '🧱', description: '世界有明确的边界' },
      { value: 'loop', label: '循环', icon: '🔁', description: '从一边出去另一边进来' },
      { value: 'infinite', label: '无尽', icon: '♾️', description: '世界无限延伸' },
    ],
  },
  narrative: {
    title: '剧情结构',
    desc: '故事有多少分支？',
    options: [
      { value: 'walled', label: '单线结局', icon: '🎯', description: '一条主线，一个结局' },
      { value: 'loop', label: '多重结局', icon: '🔀', description: '选择影响最终结局' },
      { value: 'infinite', label: '开放叙事', icon: '🌐', description: '无固定结局，持续探索' },
    ],
  },
  card: {
    title: '对局模式',
    desc: '赢得胜利的方式？',
    options: [
      { value: 'walled', label: '单局制', icon: '1️⃣', description: '一局定胜负' },
      { value: 'loop', label: '三局两胜', icon: '🔄', description: '三局中赢两局获胜' },
      { value: 'infinite', label: '无限续战', icon: '♾️', description: '不断挑战更强的对手' },
    ],
  },
  board: {
    title: '战场范围',
    desc: '棋盘有多大？',
    options: [
      { value: 'walled', label: '标准棋盘', icon: '⬛', description: '8x8固定棋盘' },
      { value: 'loop', label: '环形棋盘', icon: '🔄', description: '边缘相连的环形战场' },
      { value: 'infinite', label: '扩展棋盘', icon: '📐', description: '随战斗进行扩展' },
    ],
  },
  puzzle_logic: {
    title: '谜题关联',
    desc: '谜题之间如何关联？',
    options: [
      { value: 'walled', label: '独立谜题', icon: '📦', description: '每道题完全独立' },
      { value: 'loop', label: '线索串联', icon: '🔗', description: '前题答案是后题线索' },
      { value: 'infinite', label: '无限生成', icon: '♾️', description: '通关后生成新谜题' },
    ],
  },
  rhythm: {
    title: '曲目模式',
    desc: '游戏的曲目结构？',
    options: [
      { value: 'walled', label: '单曲模式', icon: '🎵', description: '完成一首曲子' },
      { value: 'loop', label: '串烧模式', icon: '🎶', description: '多首曲子连续播放' },
      { value: 'infinite', label: '无限模式', icon: '♾️', description: '永不停歇的节奏' },
    ],
  },
};

// --- Section 3: "Special Physics" equivalent per genre ---
const GENRE_SPECIAL: Record<GameGenre, { title: string; desc: string; options: WorldOption[] }> = {
  action: {
    title: '特殊物理',
    desc: '碰撞和运动有什么特殊效果？',
    options: [
      { value: 'elastic', label: '弹性碰撞', icon: '🏀', description: '一切都会弹开' },
      { value: 'slippery', label: '滑溜地面', icon: '🧊', description: '刹不住车的感觉' },
      { value: 'sticky', label: '粘性表面', icon: '🍯', description: '走路像踩在口香糖上' },
    ],
  },
  narrative: {
    title: '信息可靠性',
    desc: '你获得的信息有多可靠？',
    options: [
      { value: 'elastic', label: '可靠叙述', icon: '✅', description: '所有信息都是真实的' },
      { value: 'slippery', label: '不可靠叙述', icon: '❓', description: '部分信息可能是谎言' },
      { value: 'sticky', label: '矛盾叙述', icon: '⚡', description: '不同角色的说法互相矛盾' },
    ],
  },
  card: {
    title: '牌效果特性',
    desc: '卡牌效果有什么特殊规则？',
    options: [
      { value: 'elastic', label: '反弹效果', icon: '🔄', description: '伤害溢出会弹回自身' },
      { value: 'slippery', label: '连锁效果', icon: '⚡', description: '同类牌连续出触发额外效果' },
      { value: 'sticky', label: '叠加效果', icon: '📚', description: 'Buff/Debuff可以叠加' },
    ],
  },
  board: {
    title: '特殊机制',
    desc: '战斗有什么特殊机制？',
    options: [
      { value: 'elastic', label: '反击机制', icon: '🔄', description: '被攻击时有几率反击' },
      { value: 'slippery', label: '移动干扰', icon: '💨', description: '经过敌方棋子会被干扰' },
      { value: 'sticky', label: '阵型加成', icon: '🤝', description: '相邻友军互相增益' },
    ],
  },
  puzzle_logic: {
    title: '辅助系统',
    desc: '解题时有什么辅助？',
    options: [
      { value: 'elastic', label: '撤销自由', icon: '↩️', description: '可以无限撤销操作' },
      { value: 'slippery', label: '限制撤销', icon: '⚠️', description: '只能撤销有限次数' },
      { value: 'sticky', label: '无法撤销', icon: '🔒', description: '落子无悔，增加紧张感' },
    ],
  },
  rhythm: {
    title: '判定严格度',
    desc: '按键时机的判定有多严格？',
    options: [
      { value: 'elastic', label: '宽松判定', icon: '🟢', description: '较大的判定窗口' },
      { value: 'slippery', label: '标准判定', icon: '🟡', description: '正常的判定窗口' },
      { value: 'sticky', label: '严格判定', icon: '🔴', description: '极小的判定窗口' },
    ],
  },
};

// --- Custom input label per genre ---
const GENRE_CUSTOM_LABEL: Record<GameGenre, { label: string; placeholder: string }> = {
  action: { label: '独特的物理法则（可选）', placeholder: '这个世界有什么独特的物理法则？' },
  narrative: { label: '独特的叙事规则（可选）', placeholder: '故事有什么特殊的叙述方式？' },
  card: { label: '独特的卡牌规则（可选）', placeholder: '有什么特殊的卡牌机制？' },
  board: { label: '独特的棋盘规则（可选）', placeholder: '棋盘有什么特殊的战斗规则？' },
  puzzle_logic: { label: '独特的谜题规则（可选）', placeholder: '谜题有什么特殊的解法限制？' },
  rhythm: { label: '独特的节奏规则（可选）', placeholder: '节奏游戏有什么特殊机制？' },
};

export default function StepWorld() {
  const { choices, updateChoices } = useCreationStore();

  const gravitySection = useMemo(() => GENRE_GRAVITY[choices.genre] || GENRE_GRAVITY.action, [choices.genre]);
  const boundarySection = useMemo(() => GENRE_BOUNDARY[choices.genre] || GENRE_BOUNDARY.action, [choices.genre]);
  const specialSection = useMemo(() => GENRE_SPECIAL[choices.genre] || GENRE_SPECIAL.action, [choices.genre]);
  const customLabel = GENRE_CUSTOM_LABEL[choices.genre] || GENRE_CUSTOM_LABEL.action;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {gravitySection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {gravitySection.desc}
        </p>
        <PixelSelect
          options={gravitySection.options}
          value={choices.gravity}
          onChange={(v) => updateChoices({ gravity: v as GravityMode })}
          layout="grid"
        />
      </div>

      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {boundarySection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {boundarySection.desc}
        </p>
        <PixelSelect
          options={boundarySection.options}
          value={choices.boundary}
          onChange={(v) => updateChoices({ boundary: v as WorldBoundary })}
          layout="list"
        />
      </div>

      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {specialSection.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#aaaacc] mb-3">
          {specialSection.desc}
        </p>
        <PixelSelect
          options={specialSection.options}
          value={choices.specialPhysics}
          onChange={(v) => updateChoices({ specialPhysics: v as SpecialPhysics })}
          layout="list"
        />
      </div>

      <PixelInput
        label={customLabel.label}
        value={choices.customPhysics}
        onChange={(v) => updateChoices({ customPhysics: v })}
        placeholder={customLabel.placeholder}
        maxLength={50}
      />
    </div>
  );
}

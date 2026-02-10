'use client';

import React, { useMemo } from 'react';
import PixelSlider from '@/components/pixel/PixelSlider';
import { useCreationStore } from '@/lib/store';
import type { GameGenre } from '@/engine/types';

const CHAOS_DESCRIPTIONS: { min: number; max: number; label: string; desc: string; color: string }[] = [
  { min: 0, max: 0, label: '秩序', desc: '经典稳定的游戏体验。严格遵循经典叙事结构和稳健的规则。', color: '#00ff88' },
  { min: 1, max: 30, label: '微风', desc: '偶尔出现温和的变化。规则会产生微小的波动，但一切尽在掌控。', color: '#00d4ff' },
  { min: 31, max: 60, label: '涌现', desc: '规则开始产生奇妙的交互。不同的系统会出现意外的组合效果。', color: '#b388ff' },
  { min: 61, max: 90, label: '狂野', desc: '规则频繁突变，世界不断重组。一切都可能突然改变。', color: '#ff9800' },
  { min: 91, max: 100, label: '超现实', desc: '一切皆可变。规则在不断地解构和重建。', color: '#e94560' },
];

function getChaosInfo(level: number) {
  return CHAOS_DESCRIPTIONS.find(d => level >= d.min && level <= d.max) || CHAOS_DESCRIPTIONS[0];
}

// Genre-specific mutation effect previews
interface MutationPreview {
  threshold: number; // chaos level threshold
  effects: [string, string]; // two effects per tier
}

const GENRE_MUTATIONS: Record<GameGenre, MutationPreview[]> = {
  action: [
    { threshold: 1, effects: ['重力反转', '颜色反转'] },
    { threshold: 30, effects: ['地面变冰面', '世界镜像'] },
    { threshold: 50, effects: ['敌人变友军', '子弹变平台'] },
    { threshold: 70, effects: ['分数倒扣', '大小不断变化'] },
    { threshold: 90, effects: ['文字变怪物', '胜利条件突变'] },
  ],
  narrative: [
    { threshold: 1, effects: ['措辞微妙变化', '线索顺序打乱'] },
    { threshold: 30, effects: ['对话出现矛盾', '新选项突然出现'] },
    { threshold: 50, effects: ['叙述者立场改变', '时间线发生跳跃'] },
    { threshold: 70, effects: ['已知线索被推翻', '角色身份互换'] },
    { threshold: 90, effects: ['故事自我解构', '读者变成嫌疑人'] },
  ],
  card: [
    { threshold: 1, effects: ['卡牌费用微调', '手牌上限波动'] },
    { threshold: 30, effects: ['随机卡牌效果增强', '法力恢复变化'] },
    { threshold: 50, effects: ['牌效果随机互换', '对手策略突变'] },
    { threshold: 70, effects: ['手牌被强制交换', '费用规则颠覆'] },
    { threshold: 90, effects: ['牌桌规则完全重写', '胜利条件变化'] },
  ],
  board: [
    { threshold: 1, effects: ['地形微小变化', '移动范围波动'] },
    { threshold: 30, effects: ['随机地形出现', '棋子能力增减'] },
    { threshold: 50, effects: ['地形大规模变化', '友军变敌军'] },
    { threshold: 70, effects: ['棋盘形状改变', '攻击规则突变'] },
    { threshold: 90, effects: ['所有规则重置', '棋子能力随机重分配'] },
  ],
  puzzle_logic: [
    { threshold: 1, effects: ['提示措辞变化', '时间限制微调'] },
    { threshold: 30, effects: ['额外规则出现', '部分线索隐藏'] },
    { threshold: 50, effects: ['规则突然变化', '已填答案被清除'] },
    { threshold: 70, effects: ['谜题类型突变', '规则互相矛盾'] },
    { threshold: 90, effects: ['谜题自我重组', '解题标准不断变化'] },
  ],
  rhythm: [
    { threshold: 1, effects: ['音符速度微调', '判定窗口变化'] },
    { threshold: 30, effects: ['音符轨道偶尔互换', '速度突然加快'] },
    { threshold: 50, effects: ['隐藏音符出现', '轨道位置重排'] },
    { threshold: 70, effects: ['节拍完全反转', '按键映射互换'] },
    { threshold: 90, effects: ['音符方向反转', '判定规则不断变化'] },
  ],
};

// Genre-specific chaos slider title
const GENRE_CHAOS_TITLE: Record<GameGenre, { title: string; desc: string }> = {
  action: { title: '混乱程度', desc: '从秩序到超现实，你想要多少惊喜？' },
  narrative: { title: '叙事混乱度', desc: '故事有多不可预测？' },
  card: { title: '规则混乱度', desc: '卡牌规则有多不稳定？' },
  board: { title: '战场混乱度', desc: '战场有多不可预测？' },
  puzzle_logic: { title: '谜题混乱度', desc: '谜题规则有多善变？' },
  rhythm: { title: '节奏混乱度', desc: '节奏有多不可预测？' },
};

// Color tiers for mutations
const TIER_COLORS = ['text-pixel-green', 'text-pixel-blue', 'text-pixel-purple', 'text-pixel-orange', 'text-pixel-accent'];

export default function StepChaos() {
  const { choices, updateChoices } = useCreationStore();
  const chaosInfo = getChaosInfo(choices.chaosLevel);

  const chaosTitle = GENRE_CHAOS_TITLE[choices.genre] || GENRE_CHAOS_TITLE.action;
  const mutations = useMemo(() => GENRE_MUTATIONS[choices.genre] || GENRE_MUTATIONS.action, [choices.genre]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-pixel text-[11px] text-pixel-blue mb-1">
          {chaosTitle.title}
        </h2>
        <p className="font-pixel text-[7px] text-[#9090b0] mb-4">
          {chaosTitle.desc}
        </p>

        <PixelSlider
          value={choices.chaosLevel}
          onChange={(v) => updateChoices({ chaosLevel: v })}
          min={0}
          max={100}
          step={1}
          label="混沌滑块"
          colorStops={[
            { at: 0, color: '#00ff88' },
            { at: 25, color: '#00d4ff' },
            { at: 50, color: '#b388ff' },
            { at: 75, color: '#ff9800' },
            { at: 90, color: '#e94560' },
          ]}
          marks={[
            { value: 0, label: '秩序' },
            { value: 50, label: '涌现' },
            { value: 100, label: '超现实' },
          ]}
        />
      </div>

      {/* Chaos level display */}
      <div
        className="p-4 border-3 transition-all duration-300"
        style={{
          borderColor: chaosInfo.color,
          backgroundColor: `${chaosInfo.color}10`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-4 h-4"
            style={{ backgroundColor: chaosInfo.color }}
          />
          <span className="font-pixel text-[11px]" style={{ color: chaosInfo.color }}>
            {chaosInfo.label}
          </span>
          <span className="font-pixel text-[8px] text-[#9090b0] ml-auto">
            {choices.chaosLevel}%
          </span>
        </div>
        <p className="font-pixel text-[7px] text-pixel-light leading-relaxed">
          {chaosInfo.desc}
        </p>
      </div>

      {/* Preview of what mutations might occur */}
      {choices.chaosLevel > 0 && (
        <div>
          <h3 className="font-pixel text-[9px] text-[#9090b0] mb-2">
            可能出现的突变效果：
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {mutations.map((tier, idx) => (
              choices.chaosLevel >= tier.threshold && (
                <React.Fragment key={idx}>
                  <span className={`font-pixel text-[7px] ${TIER_COLORS[idx] || 'text-pixel-light'}`}>
                    • {tier.effects[0]}
                  </span>
                  <span className={`font-pixel text-[7px] ${TIER_COLORS[idx] || 'text-pixel-light'}`}>
                    • {tier.effects[1]}
                  </span>
                </React.Fragment>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

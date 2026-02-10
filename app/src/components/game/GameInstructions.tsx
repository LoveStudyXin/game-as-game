'use client';

import React, { useState } from 'react';
import type { GameGenre } from '@/engine/types';

interface GameInstructionsProps {
  genre: GameGenre;
  gameName: string;
  onStart: () => void;
}

// Genre-specific instructions
const GENRE_INSTRUCTIONS: Record<GameGenre, {
  title: string;
  icon: string;
  controls: { key: string; action: string }[];
  tips: string[];
}> = {
  action: {
    title: '动作游戏',
    icon: '🎮',
    controls: [
      { key: '← →', action: '左右移动' },
      { key: '↑ / 空格', action: '跳跃' },
      { key: 'Z', action: '攻击' },
      { key: 'ESC', action: '暂停' },
    ],
    tips: [
      '收集金币增加分数',
      '躲避敌人或踩在它们头上',
      '注意血量，不要硬碰',
    ],
  },
  narrative: {
    title: '叙事推理',
    icon: '🔍',
    controls: [
      { key: '点击选项', action: '推进剧情' },
      { key: '点击文字', action: '跳过打字效果' },
    ],
    tips: [
      '仔细阅读场景描述，寻找线索',
      '收集到的线索会显示在右侧面板',
      '不同的选择会导向不同的剧情走向',
      '注意角色之间的矛盾和疑点',
    ],
  },
  card: {
    title: '卡牌对战',
    icon: '🃏',
    controls: [
      { key: '点击手牌', action: '打出卡牌' },
      { key: '点击结束回合', action: '结束当前回合' },
    ],
    tips: [
      '每回合会获得法力值用于出牌',
      '合理规划每回合出牌顺序',
      '注意对手的血量和你的血量变化',
      '先打增益牌再打攻击牌效果更好',
    ],
  },
  board: {
    title: '棋盘战棋',
    icon: '♟️',
    controls: [
      { key: '点击棋子', action: '选中/取消选中' },
      { key: '点击蓝色区域', action: '移动棋子' },
      { key: '点击红框敌人', action: '攻击敌人' },
    ],
    tips: [
      '不同地形影响移动消耗（山地2格、森林1.5格）',
      '水域和岩浆无法通行',
      '善用地形优势，占据有利位置',
      '先集中火力消灭弱小的敌方棋子',
    ],
  },
  puzzle_logic: {
    title: '逻辑解谜',
    icon: '🧩',
    controls: [
      { key: '点击格子', action: '选中/填入' },
      { key: '点击数字', action: '填入数字（数独）' },
      { key: '点击单词', action: '选择关联项' },
    ],
    tips: [
      '每道谜题有不同的规则，注意题目说明',
      '做得越快，时间奖励分数越高',
      '遇到困难先跳过，回头再看',
    ],
  },
  rhythm: {
    title: '节奏游戏',
    icon: '🎵',
    controls: [
      { key: 'D', action: '第1轨道' },
      { key: 'F', action: '第2轨道' },
      { key: 'J', action: '第3轨道' },
      { key: 'K', action: '第4轨道' },
    ],
    tips: [
      '音符落到判定线时按下对应按键',
      '连续Perfect和Great可以增加连击倍率',
      '长按音符需要按住直到结束',
      '注意节奏，跟着拍子来',
    ],
  },
};

export default function GameInstructions({ genre, gameName, onStart }: GameInstructionsProps) {
  const info = GENRE_INSTRUCTIONS[genre];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0a1a]/95">
      <div className="w-[90%] max-w-[420px] max-h-[85%] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="text-[28px] sm:text-[36px] mb-2">{info.icon}</div>
          <h2 className="font-pixel text-[11px] sm:text-[14px] text-pixel-gold mb-1">
            {info.title}
          </h2>
          <p className="font-pixel text-[7px] sm:text-[8px] text-[#9090b0] leading-relaxed">
            {gameName}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-4 sm:mb-5">
          <h3 className="font-pixel text-[8px] sm:text-[9px] text-pixel-blue mb-2 sm:mb-3">
            操作说明
          </h3>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {info.controls.map((c, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <span
                  className="font-pixel text-[7px] sm:text-[8px] text-pixel-gold bg-pixel-surface
                             px-2 py-1 border border-pixel-border min-w-[60px] sm:min-w-[70px] text-center
                             shrink-0"
                >
                  {c.key}
                </span>
                <span className="font-pixel text-[7px] sm:text-[8px] text-pixel-light">
                  {c.action}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-5 sm:mb-6">
          <h3 className="font-pixel text-[8px] sm:text-[9px] text-pixel-green mb-2 sm:mb-3">
            游戏提示
          </h3>
          <ul className="flex flex-col gap-1.5 sm:gap-2">
            {info.tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-pixel text-[7px] sm:text-[8px] text-pixel-green shrink-0">▸</span>
                <span className="font-pixel text-[7px] sm:text-[8px] text-pixel-light/80 leading-relaxed">
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={onStart}
            className="font-pixel text-[10px] sm:text-[12px] text-pixel-black bg-pixel-gold
                       px-6 sm:px-8 py-2.5 sm:py-3 cursor-pointer border-3 border-[#ffed4a]
                       shadow-[inset_-2px_-2px_0_0_#c4a200,inset_2px_2px_0_0_#ffe44d,4px_4px_0_0_#0a0a1a]
                       active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                       transition-all duration-100 hover:bg-[#ffed4a]"
          >
            ▶ 开始游戏
          </button>
        </div>
      </div>
    </div>
  );
}

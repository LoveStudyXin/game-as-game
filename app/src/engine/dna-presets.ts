// ============================================================================
// Classic DNA Presets ("致敬经典")
//
// 6 presets that pay tribute to iconic game archetypes.
// Each preset contains a complete UserChoices object — it bypasses the
// DNA question flow entirely, going straight to preview/generate.
// ============================================================================

import type { ClassicDNAProfile } from './dna-types';

export const CLASSIC_DNA_PRESETS: ClassicDNAProfile[] = [
  // ---- Action: 马里奥的灵魂 ----
  {
    id: 'mario_soul',
    name: '马里奥的灵魂',
    icon: '🍄',
    story: '一个水管工在蘑菇王国的冒险——跳跃、踩踏、收集金币',
    genre: 'action',
    choices: {
      genre: 'action',
      visualStyle: 'pixel',
      verbs: ['jump', 'collect', 'dash'],
      objectTypes: [],
      customElement: '蘑菇变大',
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'elastic',
      customPhysics: '',
      worldDifference: 'colors_alive',
      characterArchetype: 'explorer',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'skill_heavy',
      chaosLevel: 15,
    },
  },

  // ---- Narrative: 福尔摩斯之眼 ----
  {
    id: 'holmes_eye',
    name: '福尔摩斯之眼',
    icon: '🔍',
    story: '雾都伦敦，贝克街221B——每一个不起眼的细节都是破案关键',
    genre: 'narrative',
    choices: {
      genre: 'narrative',
      visualStyle: 'retro_crt',
      verbs: ['explore', 'collect', 'craft'],
      objectTypes: [],
      customElement: '放大镜',
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'slippery',
      customPhysics: '',
      worldDifference: 'sound_solid',
      characterArchetype: 'collector',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'pure_skill',
      chaosLevel: 10,
    },
  },

  // ---- Card: 游戏王的决斗 ----
  {
    id: 'yugioh_duel',
    name: '游戏王的决斗',
    icon: '🃏',
    story: '决斗盘启动——是时候展示真正的卡组实力了！',
    genre: 'card',
    choices: {
      genre: 'card',
      visualStyle: 'neon',
      verbs: ['activate', 'defend', 'collect'],
      objectTypes: [],
      customElement: '陷阱卡',
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'elastic',
      customPhysics: '',
      worldDifference: 'colors_alive',
      characterArchetype: 'guardian',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'balanced',
      chaosLevel: 20,
    },
  },

  // ---- Board: 三国志的棋局 ----
  {
    id: 'sanguo_chess',
    name: '三国志的棋局',
    icon: '♟️',
    story: '天下三分，群雄逐鹿——在棋盘上运筹帷幄，以少胜多',
    genre: 'board',
    choices: {
      genre: 'board',
      visualStyle: 'pixel',
      verbs: ['push', 'defend', 'activate'],
      objectTypes: [],
      customElement: '火计',
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'sticky',
      customPhysics: '',
      worldDifference: 'sound_solid',
      characterArchetype: 'guardian',
      difficultyStyle: 'steady',
      gamePace: 'slow',
      skillLuckRatio: 'skill_heavy',
      chaosLevel: 5,
    },
  },

  // ---- Puzzle: 数独大师 ----
  {
    id: 'sudoku_master',
    name: '数独大师',
    icon: '🧩',
    story: '数字之间隐藏的和谐——用逻辑填满每一个空格',
    genre: 'puzzle_logic',
    choices: {
      genre: 'puzzle_logic',
      visualStyle: 'minimal',
      verbs: ['activate', 'explore'],
      objectTypes: [],
      customElement: '候选数标记',
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'elastic',
      customPhysics: '',
      worldDifference: 'time_uneven',
      characterArchetype: 'explorer',
      difficultyStyle: 'steady',
      gamePace: 'slow',
      skillLuckRatio: 'pure_skill',
      chaosLevel: 0,
    },
  },

  // ---- Rhythm: 太鼓达人 ----
  {
    id: 'taiko_master',
    name: '太鼓达人',
    icon: '🥁',
    story: '咚！咔！——跟着节奏敲击，让全场为你沸腾',
    genre: 'rhythm',
    choices: {
      genre: 'rhythm',
      visualStyle: 'neon',
      verbs: ['activate', 'dash', 'dodge'],
      objectTypes: [],
      customElement: '连打',
      gravity: 'normal',
      boundary: 'walled',
      specialPhysics: 'elastic',
      customPhysics: '',
      worldDifference: 'sound_solid',
      characterArchetype: 'guardian',
      difficultyStyle: 'steady',
      gamePace: 'medium',
      skillLuckRatio: 'pure_skill',
      chaosLevel: 5,
    },
  },
];

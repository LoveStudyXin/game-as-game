// ============================================================================
// Complete Mutation Library for the Chaos System
// ============================================================================

// ---------------------------------------------------------------------------
// Mutation Interface
// ---------------------------------------------------------------------------

export type MutationCategory = 'physics' | 'entity' | 'visual' | 'rule' | 'narrative';

export interface Mutation {
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Chinese) */
  nameZh: string;
  /** Description (English) */
  description: string;
  /** Description (Chinese) */
  descriptionZh: string;
  /** Which category this mutation belongs to */
  category: MutationCategory;
  /** Minimum chaos level (0-100) required for this mutation to appear */
  minChaosLevel: number;
  /** Duration in milliseconds. -1 means permanent until replaced */
  duration: number;
  /** Apply the mutation to the game config / state */
  apply: (config: Record<string, unknown>) => Record<string, unknown>;
  /** Revert the mutation, restoring original values */
  revert: (config: Record<string, unknown>) => Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Physics Mutations
// ---------------------------------------------------------------------------

export const GRAVITY_FLIP: Mutation = {
  id: 'gravity_flip',
  name: 'Gravity Flip',
  nameZh: '重力翻转',
  description: 'Gravity reverses direction, sending everything skyward',
  descriptionZh: '重力方向反转，一切飘向天空',
  category: 'physics',
  minChaosLevel: 10,
  duration: 15_000,
  apply: (config) => {
    const prev = (config['gravityY'] as number) ?? 800;
    config['_prev_gravityY'] = prev;
    config['gravityY'] = -prev;
    return config;
  },
  revert: (config) => {
    if (config['_prev_gravityY'] !== undefined) {
      config['gravityY'] = config['_prev_gravityY'];
      delete config['_prev_gravityY'];
    }
    return config;
  },
};

export const GRAVITY_FLOAT: Mutation = {
  id: 'gravity_float',
  name: 'Zero-G Float',
  nameZh: '失重漂浮',
  description: 'Gravity nearly vanishes, everything floats',
  descriptionZh: '重力几乎消失，一切漂浮',
  category: 'physics',
  minChaosLevel: 15,
  duration: 12_000,
  apply: (config) => {
    const prev = (config['gravityY'] as number) ?? 800;
    config['_prev_gravityY_float'] = prev;
    config['gravityY'] = 50;
    return config;
  },
  revert: (config) => {
    if (config['_prev_gravityY_float'] !== undefined) {
      config['gravityY'] = config['_prev_gravityY_float'];
      delete config['_prev_gravityY_float'];
    }
    return config;
  },
};

export const FRICTION_ICE: Mutation = {
  id: 'friction_ice',
  name: 'Ice World',
  nameZh: '冰冻世界',
  description: 'All surfaces become slippery as ice',
  descriptionZh: '所有表面变得像冰一样滑',
  category: 'physics',
  minChaosLevel: 10,
  duration: 20_000,
  apply: (config) => {
    const prev = (config['friction'] as number) ?? 0.3;
    config['_prev_friction'] = prev;
    config['friction'] = 0.02;
    return config;
  },
  revert: (config) => {
    if (config['_prev_friction'] !== undefined) {
      config['friction'] = config['_prev_friction'];
      delete config['_prev_friction'];
    }
    return config;
  },
};

export const FRICTION_HONEY: Mutation = {
  id: 'friction_honey',
  name: 'Honey World',
  nameZh: '蜂蜜世界',
  description: 'Everything moves through thick honey',
  descriptionZh: '一切都在浓稠的蜂蜜中移动',
  category: 'physics',
  minChaosLevel: 15,
  duration: 15_000,
  apply: (config) => {
    const prev = (config['friction'] as number) ?? 0.3;
    config['_prev_friction_honey'] = prev;
    config['friction'] = 0.98;
    return config;
  },
  revert: (config) => {
    if (config['_prev_friction_honey'] !== undefined) {
      config['friction'] = config['_prev_friction_honey'];
      delete config['_prev_friction_honey'];
    }
    return config;
  },
};

export const BOUNCE_EXTREME: Mutation = {
  id: 'bounce_extreme',
  name: 'Trampoline World',
  nameZh: '蹦床世界',
  description: 'Everything bounces with extreme force',
  descriptionZh: '一切都以极大的力量弹跳',
  category: 'physics',
  minChaosLevel: 20,
  duration: 18_000,
  apply: (config) => {
    const prev = (config['bounciness'] as number) ?? 0.3;
    config['_prev_bounciness'] = prev;
    config['bounciness'] = 1.5;
    return config;
  },
  revert: (config) => {
    if (config['_prev_bounciness'] !== undefined) {
      config['bounciness'] = config['_prev_bounciness'];
      delete config['_prev_bounciness'];
    }
    return config;
  },
};

// ---------------------------------------------------------------------------
// Entity Mutations
// ---------------------------------------------------------------------------

export const ENEMY_FRIEND: Mutation = {
  id: 'enemy_friend',
  name: 'Frenemies',
  nameZh: '亦敌亦友',
  description: 'Enemies become friendly and follow you around',
  descriptionZh: '敌人变得友好，跟随你左右',
  category: 'entity',
  minChaosLevel: 35,
  duration: 20_000,
  apply: (config) => {
    config['_prev_enemyBehavior'] = config['enemyBehavior'] ?? 'hostile';
    config['enemyBehavior'] = 'friendly';
    config['enemyColor'] = '#44FF44';
    return config;
  },
  revert: (config) => {
    if (config['_prev_enemyBehavior'] !== undefined) {
      config['enemyBehavior'] = config['_prev_enemyBehavior'];
      delete config['_prev_enemyBehavior'];
    }
    delete config['enemyColor'];
    return config;
  },
};

export const BULLET_PLATFORM: Mutation = {
  id: 'bullet_platform',
  name: 'Bullet Platforms',
  nameZh: '子弹平台',
  description: 'Bullets freeze in place and become platforms you can stand on',
  descriptionZh: '子弹凝固在空中，变成可以踩踏的平台',
  category: 'entity',
  minChaosLevel: 40,
  duration: 25_000,
  apply: (config) => {
    config['_prev_bulletBehavior'] = config['bulletBehavior'] ?? 'projectile';
    config['bulletBehavior'] = 'platform';
    config['bulletSolid'] = true;
    config['bulletLifetime'] = 5000;
    return config;
  },
  revert: (config) => {
    if (config['_prev_bulletBehavior'] !== undefined) {
      config['bulletBehavior'] = config['_prev_bulletBehavior'];
      delete config['_prev_bulletBehavior'];
    }
    delete config['bulletSolid'];
    delete config['bulletLifetime'];
    return config;
  },
};

export const COLLECTIBLE_TRAP: Mutation = {
  id: 'collectible_trap',
  name: 'Trick Treasures',
  nameZh: '陷阱宝物',
  description: 'Some collectibles become traps that damage you',
  descriptionZh: '部分收集品变成陷阱，会对你造成伤害',
  category: 'entity',
  minChaosLevel: 45,
  duration: 20_000,
  apply: (config) => {
    config['_prev_trapChance'] = config['collectibleTrapChance'] ?? 0;
    config['collectibleTrapChance'] = 0.4;
    config['trapDamage'] = 1;
    return config;
  },
  revert: (config) => {
    if (config['_prev_trapChance'] !== undefined) {
      config['collectibleTrapChance'] = config['_prev_trapChance'];
      delete config['_prev_trapChance'];
    }
    delete config['trapDamage'];
    return config;
  },
};

export const PLATFORM_MOVING: Mutation = {
  id: 'platform_moving',
  name: 'Restless Ground',
  nameZh: '不安的地面',
  description: 'All static platforms begin moving randomly',
  descriptionZh: '所有静止平台开始随机移动',
  category: 'entity',
  minChaosLevel: 35,
  duration: 20_000,
  apply: (config) => {
    config['_prev_platformsMoving'] = config['platformsMoving'] ?? false;
    config['platformsMoving'] = true;
    config['platformMoveSpeed'] = 60;
    config['platformMoveRange'] = 80;
    return config;
  },
  revert: (config) => {
    if (config['_prev_platformsMoving'] !== undefined) {
      config['platformsMoving'] = config['_prev_platformsMoving'];
      delete config['_prev_platformsMoving'];
    }
    delete config['platformMoveSpeed'];
    delete config['platformMoveRange'];
    return config;
  },
};

// ---------------------------------------------------------------------------
// Visual Mutations
// ---------------------------------------------------------------------------

export const COLOR_INVERT: Mutation = {
  id: 'color_invert',
  name: 'Negative World',
  nameZh: '底片世界',
  description: 'All colors invert to their complements',
  descriptionZh: '所有颜色反转为互补色',
  category: 'visual',
  minChaosLevel: 5,
  duration: 15_000,
  apply: (config) => {
    config['_prev_colorInvert'] = config['colorInvert'] ?? false;
    config['colorInvert'] = true;
    return config;
  },
  revert: (config) => {
    if (config['_prev_colorInvert'] !== undefined) {
      config['colorInvert'] = config['_prev_colorInvert'];
      delete config['_prev_colorInvert'];
    }
    return config;
  },
};

export const PIXEL_MEGA: Mutation = {
  id: 'pixel_mega',
  name: 'Mega Pixels',
  nameZh: '像素巨化',
  description: 'Resolution drops dramatically, everything becomes huge chunky pixels',
  descriptionZh: '分辨率急剧下降，一切变成巨大的像素块',
  category: 'visual',
  minChaosLevel: 10,
  duration: 12_000,
  apply: (config) => {
    config['_prev_pixelScale'] = config['pixelScale'] ?? 1;
    config['pixelScale'] = 8;
    return config;
  },
  revert: (config) => {
    if (config['_prev_pixelScale'] !== undefined) {
      config['pixelScale'] = config['_prev_pixelScale'];
      delete config['_prev_pixelScale'];
    }
    return config;
  },
};

export const MIRROR_WORLD: Mutation = {
  id: 'mirror_world',
  name: 'Mirror World',
  nameZh: '镜像世界',
  description: 'The entire world flips horizontally',
  descriptionZh: '整个世界水平翻转',
  category: 'visual',
  minChaosLevel: 15,
  duration: 15_000,
  apply: (config) => {
    config['_prev_mirrorX'] = config['mirrorX'] ?? false;
    config['mirrorX'] = true;
    return config;
  },
  revert: (config) => {
    if (config['_prev_mirrorX'] !== undefined) {
      config['mirrorX'] = config['_prev_mirrorX'];
      delete config['_prev_mirrorX'];
    }
    return config;
  },
};

// ---------------------------------------------------------------------------
// Rule Mutations
// ---------------------------------------------------------------------------

export const SCORE_REVERSE: Mutation = {
  id: 'score_reverse',
  name: 'Score Reversal',
  nameZh: '分数反转',
  description: 'Gaining points now costs points and losing points gains them',
  descriptionZh: '得分变成扣分，扣分变成得分',
  category: 'rule',
  minChaosLevel: 65,
  duration: 15_000,
  apply: (config) => {
    config['_prev_scoreMultiplier'] = config['scoreMultiplier'] ?? 1;
    config['scoreMultiplier'] = -1;
    return config;
  },
  revert: (config) => {
    if (config['_prev_scoreMultiplier'] !== undefined) {
      config['scoreMultiplier'] = config['_prev_scoreMultiplier'];
      delete config['_prev_scoreMultiplier'];
    }
    return config;
  },
};

export const TIME_WARP: Mutation = {
  id: 'time_warp',
  name: 'Time Warp',
  nameZh: '时间扭曲',
  description: 'Game speed oscillates between slow-motion and fast-forward',
  descriptionZh: '游戏速度在慢动作和快进之间震荡',
  category: 'rule',
  minChaosLevel: 60,
  duration: 20_000,
  apply: (config) => {
    config['_prev_timeWarp'] = config['timeWarp'] ?? false;
    config['timeWarp'] = true;
    config['timeWarpMinScale'] = 0.3;
    config['timeWarpMaxScale'] = 2.5;
    config['timeWarpPeriodMs'] = 4000;
    return config;
  },
  revert: (config) => {
    if (config['_prev_timeWarp'] !== undefined) {
      config['timeWarp'] = config['_prev_timeWarp'];
      delete config['_prev_timeWarp'];
    }
    delete config['timeWarpMinScale'];
    delete config['timeWarpMaxScale'];
    delete config['timeWarpPeriodMs'];
    return config;
  },
};

export const SIZE_SHIFT: Mutation = {
  id: 'size_shift',
  name: 'Size Shift',
  nameZh: '大小变换',
  description: 'Player and enemies randomly grow and shrink',
  descriptionZh: '玩家和敌人随机变大变小',
  category: 'rule',
  minChaosLevel: 55,
  duration: 18_000,
  apply: (config) => {
    config['_prev_sizeShift'] = config['sizeShift'] ?? false;
    config['sizeShift'] = true;
    config['sizeShiftMin'] = 0.4;
    config['sizeShiftMax'] = 2.5;
    config['sizeShiftIntervalMs'] = 3000;
    return config;
  },
  revert: (config) => {
    if (config['_prev_sizeShift'] !== undefined) {
      config['sizeShift'] = config['_prev_sizeShift'];
      delete config['_prev_sizeShift'];
    }
    delete config['sizeShiftMin'];
    delete config['sizeShiftMax'];
    delete config['sizeShiftIntervalMs'];
    return config;
  },
};

// ---------------------------------------------------------------------------
// Narrative Mutations (high chaos only, minChaosLevel >= 70)
// ---------------------------------------------------------------------------

export const TEXT_MONSTER: Mutation = {
  id: 'text_monster',
  name: 'Text Monster',
  nameZh: '文字怪兽',
  description: 'UI text comes alive as hostile entities that chase the player',
  descriptionZh: 'UI文字活过来变成追逐玩家的敌对实体',
  category: 'narrative',
  minChaosLevel: 70,
  duration: 20_000,
  apply: (config) => {
    config['_prev_textMonster'] = config['textMonster'] ?? false;
    config['textMonster'] = true;
    config['textMonsterSpeed'] = 120;
    config['textMonsterDamage'] = 1;
    return config;
  },
  revert: (config) => {
    if (config['_prev_textMonster'] !== undefined) {
      config['textMonster'] = config['_prev_textMonster'];
      delete config['_prev_textMonster'];
    }
    delete config['textMonsterSpeed'];
    delete config['textMonsterDamage'];
    return config;
  },
};

export const GOAL_SHIFT: Mutation = {
  id: 'goal_shift',
  name: 'Goal Shift',
  nameZh: '目标漂移',
  description: 'The level goal changes mid-game to something completely different',
  descriptionZh: '关卡目标在游戏中途变成完全不同的东西',
  category: 'narrative',
  minChaosLevel: 75,
  duration: -1, // permanent until replaced
  apply: (config) => {
    config['_prev_goalType'] = config['goalType'] ?? 'reach_goal';
    const goals = ['score_threshold', 'survive_time', 'collect_all', 'reach_goal'];
    const current = config['goalType'] as string;
    const others = goals.filter((g) => g !== current);
    config['goalType'] = others[Math.floor(Math.random() * others.length)];
    config['goalShifted'] = true;
    return config;
  },
  revert: (config) => {
    if (config['_prev_goalType'] !== undefined) {
      config['goalType'] = config['_prev_goalType'];
      delete config['_prev_goalType'];
    }
    delete config['goalShifted'];
    return config;
  },
};

export const NARRATOR_CHAOS: Mutation = {
  id: 'narrator_chaos',
  name: 'Unreliable Narrator',
  nameZh: '不可靠叙述者',
  description: 'The narrator starts lying about what is happening, UI displays wrong information',
  descriptionZh: '叙述者开始对正在发生的事撒谎，UI显示错误信息',
  category: 'narrative',
  minChaosLevel: 80,
  duration: 25_000,
  apply: (config) => {
    config['_prev_narratorChaos'] = config['narratorChaos'] ?? false;
    config['narratorChaos'] = true;
    config['scoreDisplayOffset'] = Math.floor(Math.random() * 200) - 100;
    config['healthDisplayOffset'] = Math.floor(Math.random() * 3) - 1;
    config['fakeDeathChance'] = 0.2;
    return config;
  },
  revert: (config) => {
    if (config['_prev_narratorChaos'] !== undefined) {
      config['narratorChaos'] = config['_prev_narratorChaos'];
      delete config['_prev_narratorChaos'];
    }
    delete config['scoreDisplayOffset'];
    delete config['healthDisplayOffset'];
    delete config['fakeDeathChance'];
    return config;
  },
};

// ---------------------------------------------------------------------------
// All Mutations Registry
// ---------------------------------------------------------------------------

/** Complete list of all available mutations */
export const ALL_MUTATIONS: Mutation[] = [
  // Physics (5)
  GRAVITY_FLIP,
  GRAVITY_FLOAT,
  FRICTION_ICE,
  FRICTION_HONEY,
  BOUNCE_EXTREME,
  // Entity (4)
  ENEMY_FRIEND,
  BULLET_PLATFORM,
  COLLECTIBLE_TRAP,
  PLATFORM_MOVING,
  // Visual (3)
  COLOR_INVERT,
  PIXEL_MEGA,
  MIRROR_WORLD,
  // Rule (3)
  SCORE_REVERSE,
  TIME_WARP,
  SIZE_SHIFT,
  // Narrative (3)
  TEXT_MONSTER,
  GOAL_SHIFT,
  NARRATOR_CHAOS,
];

/**
 * Get mutations filtered by category.
 */
export function getMutationsByCategory(category: MutationCategory): Mutation[] {
  return ALL_MUTATIONS.filter((m) => m.category === category);
}

/**
 * Get mutations eligible for a given chaos level.
 */
export function getEligibleMutations(chaosLevel: number): Mutation[] {
  return ALL_MUTATIONS.filter((m) => m.minChaosLevel <= chaosLevel);
}

/**
 * Look up a mutation by its ID. Returns undefined if not found.
 */
export function getMutationById(id: string): Mutation | undefined {
  return ALL_MUTATIONS.find((m) => m.id === id);
}

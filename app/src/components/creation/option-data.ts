// ============================================================================
// Option Data — shared constants extracted from old Step components.
// Used by the "Lab Mode" in StepDNACard.tsx for advanced parameter tuning.
// ============================================================================

import type {
  GameGenre,
  CoreVerb,
  GravityMode,
  WorldBoundary,
  SpecialPhysics,
  DifficultyStyle,
  GamePace,
  SkillLuckRatio,
  VisualStyle,
} from '@/engine/types';

// ---------------------------------------------------------------------------
// Option type shared across all sections
// ---------------------------------------------------------------------------
export interface LabOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export interface LabSection {
  title: string;
  desc: string;
  options: LabOption[];
}

// ---------------------------------------------------------------------------
// Visual Style options
// ---------------------------------------------------------------------------
export const STYLE_OPTIONS: LabOption[] = [
  { value: 'pixel', label: '像素风', icon: '👾', description: '经典像素艺术，锐利边缘' },
  { value: 'neon', label: '霓虹光', icon: '✨', description: '发光线条，暗色背景，赛博朋克' },
  { value: 'minimal', label: '极简几何', icon: '◆', description: '干净几何形状，柔和配色' },
  { value: 'watercolor', label: '水彩画', icon: '🎨', description: '柔和渐变，有机形态，温暖色调' },
  { value: 'retro_crt', label: '复古CRT', icon: '📺', description: 'CRT扫描线、色差效果、怀旧风' },
];

// ---------------------------------------------------------------------------
// Genre-specific verb palettes
// ---------------------------------------------------------------------------
export const GENRE_VERBS: Record<GameGenre, LabOption[]> = {
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

// ---------------------------------------------------------------------------
// Genre-specific gravity / narrative structure
// ---------------------------------------------------------------------------
export const GENRE_GRAVITY: Record<GameGenre, LabSection> = {
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
    title: '叙事节奏', desc: '故事的推进方式',
    options: [
      { value: 'normal', label: '线性叙事', icon: '📖', description: '按时间顺序平稳推进' },
      { value: 'low', label: '碎片叙事', icon: '🧩', description: '打乱时间线拼凑真相' },
      { value: 'shifting', label: '多线叙事', icon: '🔀', description: '多条线索交织' },
      { value: 'reverse', label: '倒叙推理', icon: '⏪', description: '从结果倒推原因' },
    ],
  },
  card: {
    title: '资源模式', desc: '法力恢复的规则',
    options: [
      { value: 'normal', label: '每回合+1', icon: '💧', description: '每回合法力上限+1' },
      { value: 'low', label: '固定法力', icon: '🔒', description: '每回合恢复固定法力' },
      { value: 'shifting', label: '波动法力', icon: '🌊', description: '法力恢复量随机变化' },
      { value: 'reverse', label: '消耗递减', icon: '📉', description: '使用越多费用越低' },
    ],
  },
  board: {
    title: '地形规则', desc: '地形如何影响战斗',
    options: [
      { value: 'normal', label: '标准地形', icon: '🗺️', description: '山地减速，水域阻隔' },
      { value: 'low', label: '平坦棋盘', icon: '⬜', description: '无地形影响' },
      { value: 'shifting', label: '动态地形', icon: '🌋', description: '地形每回合变化' },
      { value: 'reverse', label: '极端地形', icon: '🏔️', description: '地形效果加倍' },
    ],
  },
  puzzle_logic: {
    title: '规则复杂度', desc: '谜题规则的复杂度',
    options: [
      { value: 'normal', label: '标准规则', icon: '📐', description: '经典谜题规则' },
      { value: 'low', label: '简化规则', icon: '🟢', description: '更少约束' },
      { value: 'shifting', label: '渐进规则', icon: '📈', description: '每道题增加新规则' },
      { value: 'reverse', label: '变体规则', icon: '🔄', description: '每道题规则不同' },
    ],
  },
  rhythm: {
    title: '节奏模式', desc: '音符的运动方式',
    options: [
      { value: 'normal', label: '恒速滚动', icon: '➡️', description: '匀速从右向左' },
      { value: 'low', label: '慢速模式', icon: '🐢', description: '移动较慢' },
      { value: 'shifting', label: '变速滚动', icon: '🌊', description: '速度随节拍变化' },
      { value: 'reverse', label: '逆向滚动', icon: '⬅️', description: '从左向右' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Genre-specific boundary / structure
// ---------------------------------------------------------------------------
export const GENRE_BOUNDARY: Record<GameGenre, LabSection> = {
  action: {
    title: '世界边界', desc: '到达世界边缘会怎样？',
    options: [
      { value: 'walled', label: '有墙', icon: '🧱', description: '世界有明确边界' },
      { value: 'loop', label: '循环', icon: '🔁', description: '从一边出另一边进' },
      { value: 'infinite', label: '无尽', icon: '♾️', description: '世界无限延伸' },
    ],
  },
  narrative: {
    title: '剧情结构', desc: '故事有多少分支？',
    options: [
      { value: 'walled', label: '单线结局', icon: '🎯', description: '一个结局' },
      { value: 'loop', label: '多重结局', icon: '🔀', description: '选择影响结局' },
      { value: 'infinite', label: '开放叙事', icon: '🌐', description: '无固定结局' },
    ],
  },
  card: {
    title: '对局模式', desc: '胜利方式',
    options: [
      { value: 'walled', label: '单局制', icon: '1️⃣', description: '一局定胜负' },
      { value: 'loop', label: '三局两胜', icon: '🔄', description: '三局中赢两局' },
      { value: 'infinite', label: '无限续战', icon: '♾️', description: '不断挑战更强对手' },
    ],
  },
  board: {
    title: '战场范围', desc: '棋盘大小',
    options: [
      { value: 'walled', label: '标准棋盘', icon: '⬛', description: '固定棋盘' },
      { value: 'loop', label: '环形棋盘', icon: '🔄', description: '边缘相连' },
      { value: 'infinite', label: '扩展棋盘', icon: '📐', description: '随战斗扩展' },
    ],
  },
  puzzle_logic: {
    title: '谜题关联', desc: '谜题之间如何关联',
    options: [
      { value: 'walled', label: '独立谜题', icon: '📦', description: '每题独立' },
      { value: 'loop', label: '线索串联', icon: '🔗', description: '答案是下题线索' },
      { value: 'infinite', label: '无限生成', icon: '♾️', description: '通关后生成新题' },
    ],
  },
  rhythm: {
    title: '曲目模式', desc: '游戏的曲目结构',
    options: [
      { value: 'walled', label: '单曲模式', icon: '🎵', description: '完成一首' },
      { value: 'loop', label: '串烧模式', icon: '🎶', description: '多首连续' },
      { value: 'infinite', label: '无限模式', icon: '♾️', description: '永不停歇' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Genre-specific special physics / mechanics
// ---------------------------------------------------------------------------
export const GENRE_SPECIAL: Record<GameGenre, LabSection> = {
  action: {
    title: '特殊物理', desc: '碰撞和运动的特殊效果',
    options: [
      { value: 'elastic', label: '弹性碰撞', icon: '🏀', description: '一切都会弹开' },
      { value: 'slippery', label: '滑溜地面', icon: '🧊', description: '刹不住车' },
      { value: 'sticky', label: '粘性表面', icon: '🍯', description: '走路像踩口香糖' },
    ],
  },
  narrative: {
    title: '信息可靠性', desc: '获得的信息可靠吗？',
    options: [
      { value: 'elastic', label: '可靠叙述', icon: '✅', description: '所有信息真实' },
      { value: 'slippery', label: '不可靠叙述', icon: '❓', description: '部分可能是谎言' },
      { value: 'sticky', label: '矛盾叙述', icon: '⚡', description: '说法互相矛盾' },
    ],
  },
  card: {
    title: '牌效果特性', desc: '卡牌效果的特殊规则',
    options: [
      { value: 'elastic', label: '反弹效果', icon: '🔄', description: '伤害溢出弹回自身' },
      { value: 'slippery', label: '连锁效果', icon: '⚡', description: '同类牌连续出触发额外效果' },
      { value: 'sticky', label: '叠加效果', icon: '📚', description: 'Buff/Debuff可以叠加' },
    ],
  },
  board: {
    title: '特殊机制', desc: '战斗的特殊机制',
    options: [
      { value: 'elastic', label: '反击机制', icon: '🔄', description: '被攻击时几率反击' },
      { value: 'slippery', label: '移动干扰', icon: '💨', description: '经过敌方会被干扰' },
      { value: 'sticky', label: '阵型加成', icon: '🤝', description: '相邻友军互相增益' },
    ],
  },
  puzzle_logic: {
    title: '辅助系统', desc: '解题时的辅助',
    options: [
      { value: 'elastic', label: '撤销自由', icon: '↩️', description: '无限撤销' },
      { value: 'slippery', label: '限制撤销', icon: '⚠️', description: '有限次数' },
      { value: 'sticky', label: '无法撤销', icon: '🔒', description: '落子无悔' },
    ],
  },
  rhythm: {
    title: '判定严格度', desc: '按键判定的严格度',
    options: [
      { value: 'elastic', label: '宽松判定', icon: '🟢', description: '较大判定窗口' },
      { value: 'slippery', label: '标准判定', icon: '🟡', description: '正常判定' },
      { value: 'sticky', label: '严格判定', icon: '🔴', description: '极小判定窗口' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Genre-specific difficulty
// ---------------------------------------------------------------------------
export const GENRE_DIFFICULTY: Record<GameGenre, LabSection> = {
  action: {
    title: '难度风格', desc: '挑战节奏',
    options: [
      { value: 'relaxed', label: '轻松漫步', icon: '🌸', description: '享受探索' },
      { value: 'steady', label: '稳步挑战', icon: '📈', description: '逐渐增加' },
      { value: 'hardcore', label: '硬核试炼', icon: '🔥', description: '考验极限' },
      { value: 'rollercoaster', label: '过山车', icon: '🎢', description: '忽高忽低' },
    ],
  },
  narrative: {
    title: '推理难度', desc: '多烧脑？',
    options: [
      { value: 'relaxed', label: '轻松推理', icon: '🌸', description: '线索明显' },
      { value: 'steady', label: '适度推理', icon: '🧠', description: '需要思考' },
      { value: 'hardcore', label: '烧脑推理', icon: '🔥', description: '深度分析' },
      { value: 'rollercoaster', label: '反转推理', icon: '🎭', description: '不断反转' },
    ],
  },
  card: {
    title: 'AI强度', desc: 'AI对手多聪明？',
    options: [
      { value: 'relaxed', label: '新手AI', icon: '🤖', description: '随机出牌' },
      { value: 'steady', label: '普通AI', icon: '🧮', description: '基本策略' },
      { value: 'hardcore', label: '高手AI', icon: '🧠', description: '最优策略' },
      { value: 'rollercoaster', label: '变化AI', icon: '🎭', description: '策略多变' },
    ],
  },
  board: {
    title: '战斗难度', desc: '敌方AI强度',
    options: [
      { value: 'relaxed', label: '入门战役', icon: '🌱', description: '行动保守' },
      { value: 'steady', label: '正规战役', icon: '⚔️', description: '有一定战术' },
      { value: 'hardcore', label: '精英战役', icon: '🔥', description: '数量和位置优势' },
      { value: 'rollercoaster', label: '混战模式', icon: '🌪️', description: '瞬息万变' },
    ],
  },
  puzzle_logic: {
    title: '谜题难度', desc: '多难？',
    options: [
      { value: 'relaxed', label: '入门级', icon: '🟢', description: '享受乐趣' },
      { value: 'steady', label: '中等难度', icon: '🟡', description: '需要思考' },
      { value: 'hardcore', label: '专家级', icon: '🔴', description: '考验极限' },
      { value: 'rollercoaster', label: '渐进式', icon: '📈', description: '逐步递进' },
    ],
  },
  rhythm: {
    title: '谱面难度', desc: '难度级别',
    options: [
      { value: 'relaxed', label: 'Easy', icon: '🟢', description: '音符稀疏' },
      { value: 'steady', label: 'Normal', icon: '🟡', description: '标准密度' },
      { value: 'hardcore', label: 'Expert', icon: '🔴', description: '密集音符' },
      { value: 'rollercoaster', label: 'Dynamic', icon: '🌊', description: '快慢交替' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Genre-specific pace
// ---------------------------------------------------------------------------
export const GENRE_PACE: Record<GameGenre, LabSection> = {
  action: {
    title: '游戏节奏', desc: '节奏多快？',
    options: [
      { value: 'fast', label: '快', icon: '⚡', description: '紧张刺激' },
      { value: 'medium', label: '中', icon: '🎵', description: '节奏适中' },
      { value: 'slow', label: '慢', icon: '🌊', description: '缓慢沉浸' },
    ],
  },
  narrative: {
    title: '阅读节奏', desc: '故事展开速度',
    options: [
      { value: 'fast', label: '紧凑', icon: '⚡', description: '快速推进' },
      { value: 'medium', label: '适中', icon: '📖', description: '有张有弛' },
      { value: 'slow', label: '沉浸', icon: '🌊', description: '细腻描写' },
    ],
  },
  card: {
    title: '回合节奏', desc: '思考时间',
    options: [
      { value: 'fast', label: '闪电战', icon: '⚡', description: '30秒回合' },
      { value: 'medium', label: '标准', icon: '⏱️', description: '充足时间' },
      { value: 'slow', label: '深思', icon: '🧐', description: '无时间限制' },
    ],
  },
  board: {
    title: '回合时长', desc: '决策时间',
    options: [
      { value: 'fast', label: '闪击战', icon: '⚡', description: '快速决策' },
      { value: 'medium', label: '标准回合', icon: '⏱️', description: '合理时间' },
      { value: 'slow', label: '运筹帷幄', icon: '🧐', description: '不限时间' },
    ],
  },
  puzzle_logic: {
    title: '时间限制', desc: '有时间限制吗？',
    options: [
      { value: 'fast', label: '限时挑战', icon: '⏱️', description: '严格限时' },
      { value: 'medium', label: '宽松限时', icon: '⏳', description: '比较宽松' },
      { value: 'slow', label: '无限制', icon: '♾️', description: '没有压力' },
    ],
  },
  rhythm: {
    title: 'BPM范围', desc: '曲子多快？',
    options: [
      { value: 'fast', label: '高速', icon: '🚀', description: '160+ BPM' },
      { value: 'medium', label: '中速', icon: '🎵', description: '120-160 BPM' },
      { value: 'slow', label: '慢速', icon: '🌙', description: '80-120 BPM' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Genre-specific skill/luck ratio
// ---------------------------------------------------------------------------
export const GENRE_SKILL_LUCK: Record<GameGenre, LabSection> = {
  action: {
    title: '技巧-运气比', desc: '结果由什么决定？',
    options: [
      { value: 'pure_skill', label: '纯技巧', icon: '🎯', description: '一切取决于操作' },
      { value: 'skill_heavy', label: '偏技巧', icon: '🏹', description: '主要靠技巧' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '各占一半' },
      { value: 'luck_heavy', label: '偏运气', icon: '🎰', description: '看运气' },
    ],
  },
  narrative: {
    title: '推理-直觉比', desc: '靠逻辑还是直觉？',
    options: [
      { value: 'pure_skill', label: '纯逻辑', icon: '🧮', description: '每个线索有逻辑联系' },
      { value: 'skill_heavy', label: '偏逻辑', icon: '🔍', description: '主要靠推理' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '逻辑和灵感各半' },
      { value: 'luck_heavy', label: '偏直觉', icon: '💡', description: '依靠直觉和选择' },
    ],
  },
  card: {
    title: '策略-抽卡比', desc: '靠策略还是运气？',
    options: [
      { value: 'pure_skill', label: '纯策略', icon: '🧠', description: '牌库固定，纯靠决策' },
      { value: 'skill_heavy', label: '偏策略', icon: '🎯', description: '好策略弥补运气' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '各占一半' },
      { value: 'luck_heavy', label: '偏运气', icon: '🎰', description: '抽到好牌就能赢' },
    ],
  },
  board: {
    title: '策略-运气比', desc: '胜负由什么决定？',
    options: [
      { value: 'pure_skill', label: '纯策略', icon: '♟️', description: '无随机' },
      { value: 'skill_heavy', label: '偏策略', icon: '🎯', description: '少量随机' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '各占一半' },
      { value: 'luck_heavy', label: '偏运气', icon: '🎲', description: '随机影响大' },
    ],
  },
  puzzle_logic: {
    title: '逻辑-灵感比', desc: '需要什么思维？',
    options: [
      { value: 'pure_skill', label: '纯逻辑', icon: '🧮', description: '严格逻辑推理' },
      { value: 'skill_heavy', label: '偏逻辑', icon: '🔍', description: '主要靠推理' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '逻辑和创造各半' },
      { value: 'luck_heavy', label: '偏灵感', icon: '✨', description: '跳跃性思维' },
    ],
  },
  rhythm: {
    title: '反应-记忆比', desc: '靠反应还是记忆？',
    options: [
      { value: 'pure_skill', label: '纯反应', icon: '⚡', description: '完全靠即时反应' },
      { value: 'skill_heavy', label: '偏反应', icon: '🎯', description: '主要靠反应' },
      { value: 'balanced', label: '平衡', icon: '⚖️', description: '同样重要' },
      { value: 'luck_heavy', label: '偏模式', icon: '🔄', description: '固定模式' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Display name lookups
// ---------------------------------------------------------------------------
export const VERB_NAMES: Record<string, string> = {
  jump: '跳跃', shoot: '射击', collect: '收集', dodge: '躲避', build: '建造',
  explore: '探索', push: '推动', activate: '激活', craft: '制作', defend: '防御', dash: '冲刺',
};

export const GENRE_NAMES: Record<string, string> = {
  action: '动作冒险', narrative: '文字推理', card: '卡牌对战',
  board: '棋盘战棋', puzzle_logic: '逻辑解谜', rhythm: '节奏动作',
};

export const STYLE_NAMES: Record<string, string> = {
  pixel: '像素风', neon: '霓虹光', minimal: '极简几何',
  watercolor: '水彩画', retro_crt: '复古CRT',
};

export const ARCHETYPE_NAMES: Record<string, string> = {
  explorer: '探险家', guardian: '守护者', fugitive: '逃亡者', collector: '收藏家',
};

export const DIFFICULTY_NAMES: Record<string, string> = {
  relaxed: '轻松漫步', steady: '稳步挑战', hardcore: '硬核试炼', rollercoaster: '过山车',
};

export const GRAVITY_NAMES: Record<string, string> = {
  normal: '正常', low: '低重力', shifting: '变化的', reverse: '反向',
};

export const BOUNDARY_NAMES: Record<string, string> = {
  walled: '有墙', loop: '循环', infinite: '无尽',
};

export const PHYSICS_NAMES: Record<string, string> = {
  elastic: '弹性碰撞', slippery: '滑溜地面', sticky: '粘性表面',
};

// ---------------------------------------------------------------------------
// Chaos slider config (reused in StepDNACard lab mode)
// ---------------------------------------------------------------------------
export const CHAOS_COLOR_STOPS = [
  { at: 0, color: '#00ff88' },
  { at: 25, color: '#00d4ff' },
  { at: 50, color: '#b388ff' },
  { at: 75, color: '#ff9800' },
  { at: 90, color: '#e94560' },
];

export const CHAOS_MARKS = [
  { value: 0, label: '秩序' },
  { value: 50, label: '涌现' },
  { value: 100, label: '超现实' },
];

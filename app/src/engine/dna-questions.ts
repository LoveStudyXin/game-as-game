// ============================================================================
// DNA Question Banks — 6 genres, each with 3-4 scenario-based questions
//
// Design principle: Questions feel like "building a world together",
// NOT like a personality quiz. Each option is an evocative scenario
// that secretly maps to 1-4 UserChoices fields.
// ============================================================================

import type { GameGenre } from '@/engine/types';
import type { GenreDNABank } from './dna-types';

// ---------------------------------------------------------------------------
// ACTION 动作游戏
// ---------------------------------------------------------------------------
const ACTION_DNA: GenreDNABank = {
  genre: 'action',
  questions: [
    {
      id: 'scene',
      prompt: '你梦见了一个世界，醒来后只记得一个画面——',
      options: [
        { id: 'garden', icon: '🌸', label: '月光下飘落花瓣的空中花园',
          description: '一切都闪烁着淡淡荧光，颜色是活的',
          mapping: { worldDifference: 'colors_alive', visualStyle: 'watercolor' } },
        { id: 'factory', icon: '⚙️', label: '锈迹斑斑的巨型齿轮在转动',
          description: '空气中回响着金属的轰鸣',
          mapping: { worldDifference: 'sound_solid', visualStyle: 'retro_crt' } },
        { id: 'mind', icon: '🧠', label: '无数漂浮的光球在闪烁',
          description: '每一个光球都是一段记忆的碎片',
          mapping: { worldDifference: 'memory_touch', visualStyle: 'neon' } },
        { id: 'time', icon: '⏳', label: '同一条路延伸出三个不同的方向',
          description: '每个方向的天空是不同的季节',
          mapping: { worldDifference: 'time_uneven', visualStyle: 'minimal' } },
      ],
    },
    {
      id: 'style',
      prompt: '前方出现了危险，你的第一反应是——',
      options: [
        { id: 'observe', icon: '🔍', label: '先看清楚再行动',
          description: '知己知彼，寻找弱点',
          mapping: { characterArchetype: 'explorer', verbs: ['explore', 'collect'], gravity: 'normal' } },
        { id: 'protect', icon: '🛡️', label: '挡在重要的东西前面',
          description: '守护是本能，防御即进攻',
          mapping: { characterArchetype: 'guardian', verbs: ['defend', 'build'], gravity: 'normal' } },
        { id: 'charge', icon: '⚡', label: '全力冲过去！',
          description: '最好的防守就是进攻',
          mapping: { characterArchetype: 'fugitive', verbs: ['jump', 'shoot'], gravity: 'shifting' } },
        { id: 'gamble', icon: '🎲', label: '赌一把，说不定有宝贝',
          description: '风险和回报总是成正比',
          mapping: { characterArchetype: 'collector', verbs: ['collect', 'dodge'], gravity: 'low' } },
      ],
    },
    {
      id: 'rhythm',
      prompt: '你更喜欢哪种冒险节奏？',
      options: [
        { id: 'zen', icon: '🧘', label: '像散步一样悠闲',
          description: '享受过程，不急着到终点',
          mapping: { difficultyStyle: 'relaxed', gamePace: 'slow', skillLuckRatio: 'luck_heavy' } },
        { id: 'chess', icon: '♟️', label: '每一步都精心计算',
          description: '策略和耐心才是通关的关键',
          mapping: { difficultyStyle: 'steady', gamePace: 'medium', skillLuckRatio: 'pure_skill' } },
        { id: 'fire', icon: '🔥', label: '心跳加速的快感',
          description: '挑战极限才有意思',
          mapping: { difficultyStyle: 'hardcore', gamePace: 'fast', skillLuckRatio: 'skill_heavy' } },
        { id: 'wild', icon: '🎢', label: '不知道下一秒会发生什么',
          description: '惊喜就是最大的乐趣',
          mapping: { difficultyStyle: 'rollercoaster', gamePace: 'fast', skillLuckRatio: 'balanced' } },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// NARRATIVE 叙事推理
// ---------------------------------------------------------------------------
const NARRATIVE_DNA: GenreDNABank = {
  genre: 'narrative',
  questions: [
    {
      id: 'scene',
      prompt: '你走进了一个神秘的地方，四周的氛围是——',
      options: [
        { id: 'gallery', icon: '🎨', label: '一间画廊，画里的人物在动',
          description: '色彩似乎有了自己的生命',
          mapping: { worldDifference: 'colors_alive', visualStyle: 'watercolor' } },
        { id: 'station', icon: '📻', label: '废弃的广播站，静电中传出低语',
          description: '声音穿过墙壁变成了可以触摸的东西',
          mapping: { worldDifference: 'sound_solid', visualStyle: 'retro_crt' } },
        { id: 'album', icon: '📸', label: '一本翻开的相册，照片在变化',
          description: '每张照片都是一段被遗忘的记忆',
          mapping: { worldDifference: 'memory_touch', visualStyle: 'neon' } },
        { id: 'clock', icon: '🕰️', label: '钟表店，每座钟显示不同的时间',
          description: '时间在这里不是直线',
          mapping: { worldDifference: 'time_uneven', visualStyle: 'minimal' } },
      ],
    },
    {
      id: 'style',
      prompt: '案发现场有一个可疑的细节，你会——',
      options: [
        { id: 'investigate', icon: '🔍', label: '仔细搜索每一个角落',
          description: '不放过任何蛛丝马迹',
          mapping: { characterArchetype: 'explorer', verbs: ['explore', 'collect'], gravity: 'normal' } },
        { id: 'witness', icon: '🤝', label: '先和在场的人建立信任',
          description: '真相往往藏在人心里',
          mapping: { characterArchetype: 'guardian', verbs: ['defend', 'activate'], gravity: 'normal' } },
        { id: 'risk', icon: '🏃', label: '趁没人注意，闯入禁区',
          description: '有些真相需要冒险才能得到',
          mapping: { characterArchetype: 'fugitive', verbs: ['dodge', 'explore'], gravity: 'shifting' } },
        { id: 'collect', icon: '🗂️', label: '系统性收集所有物证',
          description: '证据链完整才能定罪',
          mapping: { characterArchetype: 'collector', verbs: ['collect', 'craft'], gravity: 'normal' } },
      ],
    },
    {
      id: 'rhythm',
      prompt: '你希望这个故事以什么节奏展开？',
      options: [
        { id: 'slow', icon: '📖', label: '像翻书一样慢慢品味',
          description: '每个细节都值得细细品读',
          mapping: { difficultyStyle: 'relaxed', gamePace: 'slow', skillLuckRatio: 'luck_heavy' } },
        { id: 'logic', icon: '🧩', label: '环环相扣的逻辑推理',
          description: '每条线索都指向同一个答案',
          mapping: { difficultyStyle: 'steady', gamePace: 'medium', skillLuckRatio: 'pure_skill' } },
        { id: 'thriller', icon: '💀', label: '让人喘不过气的悬疑',
          description: '时间紧迫，真相即将消失',
          mapping: { difficultyStyle: 'hardcore', gamePace: 'fast', skillLuckRatio: 'skill_heavy' } },
        { id: 'twist', icon: '🌀', label: '充满反转的剧情',
          description: '你以为的真相可能全是假的',
          mapping: { difficultyStyle: 'rollercoaster', gamePace: 'medium', skillLuckRatio: 'balanced' } },
      ],
    },
    {
      id: 'trust',
      prompt: '你获得的线索可靠吗？',
      options: [
        { id: 'reliable', icon: '✅', label: '眼见为实',
          description: '你看到的就是真相',
          mapping: { specialPhysics: 'elastic', boundary: 'walled' } },
        { id: 'unreliable', icon: '🪞', label: '真假难辨',
          description: '每条线索都可能有另一面',
          mapping: { specialPhysics: 'slippery', boundary: 'loop' } },
        { id: 'contradictory', icon: '🔀', label: '互相矛盾',
          description: '线索们在打架，你需要判断谁在说谎',
          mapping: { specialPhysics: 'sticky', boundary: 'infinite' } },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// CARD 卡牌对战
// ---------------------------------------------------------------------------
const CARD_DNA: GenreDNABank = {
  genre: 'card',
  questions: [
    {
      id: 'scene',
      prompt: '你的牌桌摆在——',
      options: [
        { id: 'garden', icon: '🌸', label: '月光花园的石桌上',
          description: '花瓣随风飘落在牌面上',
          mapping: { worldDifference: 'colors_alive', visualStyle: 'watercolor' } },
        { id: 'mech', icon: '🔧', label: '蒸汽朋克酒馆的角落',
          description: '齿轮转动的声音就是背景音乐',
          mapping: { worldDifference: 'sound_solid', visualStyle: 'retro_crt' } },
        { id: 'dream', icon: '💭', label: '梦境的交界处',
          description: '牌面上浮现的是记忆的碎片',
          mapping: { worldDifference: 'memory_touch', visualStyle: 'neon' } },
        { id: 'rift', icon: '🌀', label: '时间裂缝的悬浮平台',
          description: '每回合流逝的时间都不同',
          mapping: { worldDifference: 'time_uneven', visualStyle: 'minimal' } },
      ],
    },
    {
      id: 'style',
      prompt: '对手打出了一张强力卡，你会——',
      options: [
        { id: 'analyze', icon: '🔍', label: '仔细分析再回应',
          description: '研究对手的套路，找到破绽',
          mapping: { characterArchetype: 'explorer', verbs: ['explore', 'collect'], gravity: 'normal' } },
        { id: 'defend', icon: '🛡️', label: '先稳住防线',
          description: '活着才有翻盘的机会',
          mapping: { characterArchetype: 'guardian', verbs: ['defend', 'craft'], gravity: 'normal' } },
        { id: 'counter', icon: '⚡', label: '打出更强的牌反击！',
          description: '以攻代守，气势不能输',
          mapping: { characterArchetype: 'fugitive', verbs: ['shoot', 'activate'], gravity: 'shifting' } },
        { id: 'draw', icon: '🎲', label: '疯狂抽牌赌运气',
          description: '命运之神总会眷顾大胆的人',
          mapping: { characterArchetype: 'collector', verbs: ['collect', 'activate'], gravity: 'low' } },
      ],
    },
    {
      id: 'rhythm',
      prompt: '你希望这场对决是什么感觉？',
      options: [
        { id: 'tea', icon: '🍵', label: '泡茶般悠闲',
          description: '不着急，享受出牌的过程',
          mapping: { difficultyStyle: 'relaxed', gamePace: 'slow', skillLuckRatio: 'luck_heavy' } },
        { id: 'chess', icon: '♟️', label: '像下棋一样精算',
          description: '每张牌都是精心计算的结果',
          mapping: { difficultyStyle: 'steady', gamePace: 'medium', skillLuckRatio: 'pure_skill' } },
        { id: 'duel', icon: '⚔️', label: '生死一线的决斗',
          description: '一个失误就是万劫不复',
          mapping: { difficultyStyle: 'hardcore', gamePace: 'fast', skillLuckRatio: 'skill_heavy' } },
        { id: 'carnival', icon: '🎪', label: '疯狂的嘉年华',
          description: '规则？什么规则？',
          mapping: { difficultyStyle: 'rollercoaster', gamePace: 'fast', skillLuckRatio: 'balanced' } },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// BOARD 棋盘战棋
// ---------------------------------------------------------------------------
const BOARD_DNA: GenreDNABank = {
  genre: 'board',
  questions: [
    {
      id: 'scene',
      prompt: '你的军队驻扎在——',
      options: [
        { id: 'enchanted', icon: '🌿', label: '被魔法浸染的森林',
          description: '树木会移动，花朵是陷阱',
          mapping: { worldDifference: 'colors_alive', visualStyle: 'watercolor' } },
        { id: 'fortress', icon: '🏰', label: '回响着号角的山间要塞',
          description: '岩石和钢铁构成的战场',
          mapping: { worldDifference: 'sound_solid', visualStyle: 'pixel' } },
        { id: 'ruins', icon: '🏛️', label: '记忆构建的远古遗迹',
          description: '地形会随你的回忆而变化',
          mapping: { worldDifference: 'memory_touch', visualStyle: 'neon' } },
        { id: 'shifting', icon: '⏳', label: '不断坍缩的时空裂隙',
          description: '地图每几回合就会重组',
          mapping: { worldDifference: 'time_uneven', visualStyle: 'minimal' } },
      ],
    },
    {
      id: 'style',
      prompt: '作为指挥官，你的风格是——',
      options: [
        { id: 'scout', icon: '🔭', label: '情报先行，知己知彼',
          description: '派出斥候，掌握全局再出手',
          mapping: { characterArchetype: 'explorer', verbs: ['explore', 'collect'], gravity: 'normal' } },
        { id: 'fortress', icon: '🏰', label: '固若金汤，以守为攻',
          description: '让敌人来撞我的铜墙铁壁',
          mapping: { characterArchetype: 'guardian', verbs: ['defend', 'build'], gravity: 'normal' } },
        { id: 'blitz', icon: '⚡', label: '闪电战，速战速决',
          description: '集中兵力，直捣黄龙',
          mapping: { characterArchetype: 'fugitive', verbs: ['dash', 'shoot'], gravity: 'shifting' } },
        { id: 'resource', icon: '📦', label: '积蓄力量，后发制人',
          description: '收集资源，等待时机一击制胜',
          mapping: { characterArchetype: 'collector', verbs: ['collect', 'craft'], gravity: 'low' } },
      ],
    },
    {
      id: 'rhythm',
      prompt: '你希望战斗是什么节奏？',
      options: [
        { id: 'peaceful', icon: '🕊️', label: '运筹帷幄，从容不迫',
          description: '不限时间，想多久就想多久',
          mapping: { difficultyStyle: 'relaxed', gamePace: 'slow', skillLuckRatio: 'luck_heavy' } },
        { id: 'tactical', icon: '🗺️', label: '回合制精确推演',
          description: '每一步都关乎全局',
          mapping: { difficultyStyle: 'steady', gamePace: 'medium', skillLuckRatio: 'pure_skill' } },
        { id: 'intense', icon: '🔥', label: '敌众我寡的绝地反击',
          description: '以少胜多才是真正的将军',
          mapping: { difficultyStyle: 'hardcore', gamePace: 'fast', skillLuckRatio: 'skill_heavy' } },
        { id: 'chaos', icon: '🌪️', label: '战场瞬息万变',
          description: '随机事件不断，适应力就是战斗力',
          mapping: { difficultyStyle: 'rollercoaster', gamePace: 'medium', skillLuckRatio: 'balanced' } },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PUZZLE_LOGIC 逻辑解谜
// ---------------------------------------------------------------------------
const PUZZLE_DNA: GenreDNABank = {
  genre: 'puzzle_logic',
  questions: [
    {
      id: 'scene',
      prompt: '你面前出现了一道谜题，它的主题是——',
      options: [
        { id: 'art', icon: '🎨', label: '色彩与图形的迷宫',
          description: '答案藏在颜色的排列组合中',
          mapping: { worldDifference: 'colors_alive', visualStyle: 'watercolor' } },
        { id: 'music', icon: '🎵', label: '音符和节拍的密码',
          description: '用耳朵比用眼睛更容易找到线索',
          mapping: { worldDifference: 'sound_solid', visualStyle: 'pixel' } },
        { id: 'memory', icon: '🧠', label: '记忆碎片的拼图',
          description: '把散落的回忆拼成完整的画面',
          mapping: { worldDifference: 'memory_touch', visualStyle: 'neon' } },
        { id: 'time', icon: '⏰', label: '时间线上的逻辑链',
          description: '过去和未来的线索交织在一起',
          mapping: { worldDifference: 'time_uneven', visualStyle: 'minimal' } },
      ],
    },
    {
      id: 'style',
      prompt: '遇到解不开的难题，你会——',
      options: [
        { id: 'explore', icon: '🧭', label: '从不同角度重新审视',
          description: '换个思路，答案自然浮现',
          mapping: { characterArchetype: 'explorer', verbs: ['explore', 'activate'], gravity: 'normal' } },
        { id: 'methodical', icon: '📝', label: '列出所有可能性，逐一排除',
          description: '系统化的方法不会遗漏任何线索',
          mapping: { characterArchetype: 'guardian', verbs: ['collect', 'craft'], gravity: 'normal' } },
        { id: 'intuition', icon: '💡', label: '跟着直觉走',
          description: '有时候灵光一闪就是答案',
          mapping: { characterArchetype: 'fugitive', verbs: ['dash', 'activate'], gravity: 'shifting' } },
        { id: 'pattern', icon: '🔗', label: '寻找隐藏的规律',
          description: '万物皆有模式，找到它就赢了',
          mapping: { characterArchetype: 'collector', verbs: ['collect', 'explore'], gravity: 'normal' } },
      ],
    },
    {
      id: 'rhythm',
      prompt: '你喜欢什么样的解谜体验？',
      options: [
        { id: 'relaxed', icon: '☕', label: '边喝咖啡边想',
          description: '没有时间限制，纯粹享受思考',
          mapping: { difficultyStyle: 'relaxed', gamePace: 'slow', skillLuckRatio: 'luck_heavy' } },
        { id: 'satisfying', icon: '🎯', label: '恰到好处的难度',
          description: '不太简单也不太难，解开的瞬间很爽',
          mapping: { difficultyStyle: 'steady', gamePace: 'medium', skillLuckRatio: 'balanced' } },
        { id: 'brain', icon: '🤯', label: '烧脑到冒烟',
          description: '越难越有征服欲',
          mapping: { difficultyStyle: 'hardcore', gamePace: 'fast', skillLuckRatio: 'pure_skill' } },
        { id: 'surprise', icon: '🎁', label: '充满惊喜的谜题',
          description: '每道题都是全新的挑战方式',
          mapping: { difficultyStyle: 'rollercoaster', gamePace: 'medium', skillLuckRatio: 'balanced' } },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// RHYTHM 节奏游戏
// ---------------------------------------------------------------------------
const RHYTHM_DNA: GenreDNABank = {
  genre: 'rhythm',
  questions: [
    {
      id: 'scene',
      prompt: '舞台灯光亮起，你身处——',
      options: [
        { id: 'neon', icon: '🌈', label: '霓虹闪烁的电子音乐节',
          description: '色彩随节拍脉动，世界在你的律动中呼吸',
          mapping: { worldDifference: 'colors_alive', visualStyle: 'neon' } },
        { id: 'concert', icon: '🎸', label: '地下摇滚Live House',
          description: '贝斯的震动穿透胸腔',
          mapping: { worldDifference: 'sound_solid', visualStyle: 'retro_crt' } },
        { id: 'memory', icon: '🎹', label: '旧钢琴旁的月光下',
          description: '每个音符都唤起一段往事',
          mapping: { worldDifference: 'memory_touch', visualStyle: 'watercolor' } },
        { id: 'glitch', icon: '💻', label: '故障艺术的数字空间',
          description: '节拍在时间裂缝中跳跃',
          mapping: { worldDifference: 'time_uneven', visualStyle: 'minimal' } },
      ],
    },
    {
      id: 'style',
      prompt: '你的演奏风格是——',
      options: [
        { id: 'flow', icon: '🌊', label: '跟着感觉走',
          description: '身体自然摆动，不需要想太多',
          mapping: { characterArchetype: 'explorer', verbs: ['dodge', 'collect'], gravity: 'low' } },
        { id: 'precise', icon: '🎯', label: '精准到每一个音符',
          description: '完美主义者的演奏',
          mapping: { characterArchetype: 'guardian', verbs: ['activate', 'defend'], gravity: 'normal' } },
        { id: 'wild', icon: '🤘', label: '狂野不羁',
          description: '速度就是一切！',
          mapping: { characterArchetype: 'fugitive', verbs: ['dash', 'jump'], gravity: 'shifting' } },
        { id: 'creative', icon: '✨', label: '即兴发挥',
          description: '在固定节拍中创造独特的节奏',
          mapping: { characterArchetype: 'collector', verbs: ['collect', 'activate'], gravity: 'normal' } },
      ],
    },
    {
      id: 'rhythm',
      prompt: '你想要什么样的节奏体验？',
      options: [
        { id: 'chill', icon: '🎧', label: '放松身心的慢节拍',
          description: '闭上眼睛，让音乐流过',
          mapping: { difficultyStyle: 'relaxed', gamePace: 'slow', skillLuckRatio: 'luck_heavy' } },
        { id: 'groove', icon: '🎶', label: '让人忍不住打拍子',
          description: '恰到好处的节奏感',
          mapping: { difficultyStyle: 'steady', gamePace: 'medium', skillLuckRatio: 'balanced' } },
        { id: 'extreme', icon: '⚡', label: '手速极限挑战',
          description: '密集音符，极速反应',
          mapping: { difficultyStyle: 'hardcore', gamePace: 'fast', skillLuckRatio: 'pure_skill' } },
        { id: 'unpredictable', icon: '🎭', label: '节奏不断变化',
          description: '快慢交替，永远猜不到下一拍',
          mapping: { difficultyStyle: 'rollercoaster', gamePace: 'fast', skillLuckRatio: 'skill_heavy' } },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Export all banks
// ---------------------------------------------------------------------------
export const DNA_BANKS: Record<GameGenre, GenreDNABank> = {
  action: ACTION_DNA,
  narrative: NARRATIVE_DNA,
  card: CARD_DNA,
  board: BOARD_DNA,
  puzzle_logic: PUZZLE_DNA,
  rhythm: RHYTHM_DNA,
};

// ---------------------------------------------------------------------------
// Genre-specific placeholder text for the free-text input
// ---------------------------------------------------------------------------
export const SCENE_PLACEHOLDERS: Record<GameGenre, string> = {
  action: '描述你梦中的冒险场景……比如：在云端奔跑',
  narrative: '描述一个让你好奇的谜团……比如：消失的日记本',
  card: '描述你的王牌……比如：时间停止',
  board: '描述你的英雄……比如：独眼剑客',
  puzzle_logic: '描述一个有趣的谜题……比如：会变色的迷宫',
  rhythm: '描述你的舞台……比如：极光下的冰湖',
};

export const GENRE_LABELS: Record<GameGenre, { name: string; icon: string; desc: string }> = {
  action:       { name: '动作冒险', icon: '⚔️', desc: '跳跃、射击、收集——用身体感受世界' },
  narrative:    { name: '叙事推理', icon: '🔍', desc: '线索、推理、选择——用头脑解开谜团' },
  card:         { name: '卡牌对战', icon: '🃏', desc: '策略、资源、博弈——每张牌都是决策' },
  board:        { name: '棋盘战棋', icon: '♟️', desc: '布阵、移动、攻击——运筹帷幄的战场' },
  puzzle_logic: { name: '逻辑解谜', icon: '🧩', desc: '数字、图形、规律——纯粹思考的乐趣' },
  rhythm:       { name: '节奏律动', icon: '🎵', desc: '节拍、反应、连击——身体跟着音乐走' },
};

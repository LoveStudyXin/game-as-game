// ============================================================================
// Game-as-Game-Engine: Core Type System
// ECS-Lite architecture - games described as JSON configurations
// ============================================================================

// ---------------------------------------------------------------------------
// Primitive Union Types
// ---------------------------------------------------------------------------

/** Game genre -- determines the fundamental game structure AND renderer */
export type GameGenre =
  | 'action'        // Real-time action: platformer, arena, survival (uses Phaser)
  | 'narrative'     // Text adventure / detective / branching story (pure React)
  | 'card'          // Card game: hand management, turn-based strategy (React + CSS)
  | 'board'         // Board / tactics: grid-based, turn-based combat (React Grid)
  | 'puzzle_logic'  // Logic puzzles: sudoku, nonogram, connections (React UI)
  | 'rhythm';       // Rhythm game: notes, timing, beats (lightweight Canvas)

/** Visual rendering style */
export type VisualStyle =
  | 'pixel'       // Classic pixel art with sharp edges
  | 'neon'        // Glowing outlines on dark background, synthwave
  | 'minimal'     // Clean geometric shapes, muted palette
  | 'watercolor'  // Soft gradients, organic shapes
  | 'retro_crt';  // CRT scanlines, chromatic aberration, bloom

/** The core actions a player can perform */
export type CoreVerb = 'jump' | 'shoot' | 'collect' | 'dodge' | 'build'
  | 'explore' | 'push' | 'activate' | 'craft' | 'defend' | 'dash';

/** Categories of interactive objects in the game world */
export type ObjectType = 'platform' | 'enemy' | 'puzzle' | 'resource';

/** How gravity behaves in the game world */
export type GravityMode = 'normal' | 'low' | 'shifting' | 'reverse';

/** What happens when entities reach the edge of the world */
export type WorldBoundary = 'walled' | 'loop' | 'infinite';

/** Special surface or collision physics */
export type SpecialPhysics = 'elastic' | 'slippery' | 'sticky';

/** Character identity archetypes for narrative framing */
export type CharacterArchetype = 'explorer' | 'guardian' | 'fugitive' | 'collector';

/** Overall difficulty feel */
export type DifficultyStyle = 'relaxed' | 'steady' | 'hardcore' | 'rollercoaster';

/** Tempo of the gameplay */
export type GamePace = 'fast' | 'medium' | 'slow';

/** How much skill vs. luck determines outcomes */
export type SkillLuckRatio = 'pure_skill' | 'skill_heavy' | 'balanced' | 'luck_heavy';

/**
 * Chaos level: 0 = fully deterministic, 100 = maximum randomness.
 * Represented as a branded number type for documentation; runtime is a plain number.
 */
export type ChaosLevel = number;

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------

/** The seed that drives the narrative framing of a generated game */
export interface NarrativeSeed {
  /** A one-sentence description of what makes this world different */
  worldDifference: string;
  /** The player character's archetypal role */
  characterArchetype: CharacterArchetype;
}

// ---------------------------------------------------------------------------
// ECS Building Blocks
// ---------------------------------------------------------------------------

/**
 * A component attached to an entity.
 * The `type` discriminator determines which config shape applies.
 * The config object is intentionally loosely typed here so that new
 * component types can be added without touching this file.
 */
export interface ComponentDef {
  type: string;
  config: Record<string, unknown>;
}

/**
 * An entity definition -- the fundamental game object.
 * All visual entities are geometric shapes with solid colors (no sprites).
 */
export interface EntityDef {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  components: ComponentDef[];
}

/**
 * A system that runs each frame (or on a schedule) to process entities.
 */
export interface SystemDef {
  type: string;
  config: Record<string, unknown>;
}

/**
 * A declarative game rule: when `trigger` fires and optional `condition` is
 * met, execute `action` which produces `effect`.
 */
export interface RuleDef {
  trigger: string;
  condition?: string;
  action: string;
  effect: string;
}

/**
 * Describes a feedback loop that amplifies or dampens player performance.
 */
export interface FeedbackLoop {
  type: 'positive' | 'negative';
  description: string;
  variables: string[];
}

/**
 * A narrative event that can be triggered during gameplay.
 */
export interface NarrativeEvent {
  id: string;
  trigger: string;
  text: string;
  choices?: NarrativeChoice[];
}

export interface NarrativeChoice {
  text: string;
  effect: string;
}

// ---------------------------------------------------------------------------
// Configuration Sections
// ---------------------------------------------------------------------------

/** Chaos / mutation configuration */
export interface ChaosConfig {
  /** 0-100 scale of randomness */
  level: ChaosLevel;
  /** Pool of possible mutation identifiers */
  mutations: string[];
  /** How often (ms) a new mutation can trigger */
  mutationFrequencyMs: number;
  /** Maximum mutations active at the same time */
  maxActiveMutations: number;
}

/** Difficulty tuning configuration */
export interface DifficultyConfig {
  style: DifficultyStyle;
  pace: GamePace;
  skillLuckRatio: SkillLuckRatio;
  /**
   * Array of difficulty values (0-1) sampled over the duration of the game.
   * Index 0 = start, last index = end. The engine interpolates between points.
   */
  curve: number[];
}

/** World / physics configuration */
export interface WorldConfig {
  gravity: GravityMode;
  boundary: WorldBoundary;
  specialPhysics: SpecialPhysics;
  width: number;
  height: number;
  backgroundColor: string;
}

/** Narrative configuration section */
export interface NarrativeConfig {
  worldDifference: string;
  characterArchetype: CharacterArchetype;
  events: NarrativeEvent[];
}

// ---------------------------------------------------------------------------
// Top-Level Game Configuration
// ---------------------------------------------------------------------------

/**
 * The complete, serialisable description of a generated game.
 * This is the single JSON document that the runtime engine interprets.
 */
export interface GameConfig {
  /** Unique identifier for this game instance */
  id: string;
  /** The seed code string (human-readable mnemonic) */
  seedCode: string;
  /** Display name */
  name: string;
  /** Short description shown to the player */
  description: string;

  /** Game genre */
  genre: GameGenre;

  /** Visual rendering style */
  visualStyle: VisualStyle;

  /** Which core verbs the player can use */
  verbs: CoreVerb[];

  /** World physics and layout */
  world: WorldConfig;

  /** All entity definitions */
  entities: EntityDef[];

  /** Active ECS systems */
  systems: SystemDef[];

  /** Declarative game rules */
  rules: RuleDef[];

  /** Economic feedback loops */
  feedbackLoops: FeedbackLoop[];

  /** Narrative layer */
  narrative: NarrativeConfig;

  /** Difficulty / pacing */
  difficulty: DifficultyConfig;

  /** Chaos / mutation layer */
  chaos: ChaosConfig;

  /** Internal numeric seed for reproducible randomness */
  internalSeed: number;

  /** Genre-specific game data (only the relevant field is populated) */
  genreData?: GameConfigGenreData;
}

// ---------------------------------------------------------------------------
// User-Facing Wizard Choices
// ---------------------------------------------------------------------------

/**
 * What the user selects across the 6-step game-creation wizard.
 * This is the INPUT that gets transformed into a GameConfig.
 */
export interface UserChoices {
  // Step 0 -- Game Style
  genre: GameGenre;
  visualStyle: VisualStyle;

  // Step 1 -- Core Verbs
  verbs: CoreVerb[];

  // Step 2 -- Object Types
  objectTypes: ObjectType[];
  /** Free-form custom element the user wants in the game */
  customElement: string;

  // Step 3 -- World Physics
  gravity: GravityMode;
  boundary: WorldBoundary;
  specialPhysics: SpecialPhysics;
  /** Free-form custom physics rule */
  customPhysics: string;

  // Step 4 -- Narrative
  worldDifference: string;
  characterArchetype: CharacterArchetype;

  // Step 5 -- Difficulty & Pacing
  difficultyStyle: DifficultyStyle;
  gamePace: GamePace;
  skillLuckRatio: SkillLuckRatio;

  // Step 6 -- Chaos
  chaosLevel: ChaosLevel;
}

// ---------------------------------------------------------------------------
// Component Config Helpers (strongly-typed convenience aliases)
// ---------------------------------------------------------------------------

export interface JumpComponentConfig {
  jumpForce: number;
  maxJumps: number;
}

export interface ShooterComponentConfig {
  fireRate: number;
  bulletSpeed: number;
  bulletColor: string;
}

export interface CollectorComponentConfig {
  collectRadius: number;
}

export interface DodgerComponentConfig {
  dashSpeed: number;
  dashCooldown: number;
  invincibilityMs: number;
}

export interface BuilderComponentConfig {
  buildCooldown: number;
  blockColor: string;
  maxBlocks: number;
}

export interface MovingComponentConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
}

export interface BreakableComponentConfig {
  hitPoints: number;
}

export interface BouncyComponentConfig {
  bounceForce: number;
}

export interface StickyComponentConfig {
  friction: number;
}

export interface PatrolComponentConfig {
  patrolDistance: number;
  speed: number;
  direction: 'horizontal' | 'vertical';
}

export interface ChaserComponentConfig {
  chaseSpeed: number;
  detectionRadius: number;
}

export interface EnemyShooterComponentConfig {
  fireRate: number;
  bulletSpeed: number;
  bulletColor: string;
  range: number;
}

export interface BouncerComponentConfig {
  bounceSpeed: number;
  bounceAngleVariance: number;
}

export interface CollectibleComponentConfig {
  scoreValue?: number;
  healAmount?: number;
  powerUpType?: string;
  powerUpDurationMs?: number;
  keyId?: string;
}

export interface ProjectileComponentConfig {
  damage: number;
  speed: number;
  direction: { x: number; y: number };
  lifetime: number;
  owner: 'player' | 'enemy';
}

export interface BuildBlockComponentConfig {
  solid: boolean;
  placedBy: string;
}

// ---------------------------------------------------------------------------
// Genre-Specific Data Structures
// ---------------------------------------------------------------------------

// ---- Narrative (text adventure / detective) ----

export interface NarrativeNode {
  id: string;
  /** The scene description text shown to the player */
  text: string;
  /** Background mood / color key */
  background?: string;
  /** Available choices at this node */
  choices: NarrativeNodeChoice[];
  /** Optional clue the player discovers at this node */
  clue?: string;
  /** Special flags: 'ending', 'checkpoint', etc. */
  flags?: string[];
}

export interface NarrativeNodeChoice {
  text: string;
  nextNodeId: string;
  /** Condition that must be met (e.g. "has_clue:key") */
  condition?: string;
  /** Side effect when chosen (e.g. "add_clue:key", "change_trust:+1") */
  effect?: string;
}

export interface NarrativeGameData {
  nodes: NarrativeNode[];
  startNodeId: string;
  /** Template type for theming: detective, escape_room, time_paradox, identity */
  template: string;
}

// ---- Card game ----

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  /** Effect type: damage, heal, draw, gain_mana, buff, debuff */
  effect: string;
  /** Numeric value for the effect (damage amount, heal amount, etc.) */
  value: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  color: string;
}

export interface CardGameData {
  playerDeck: CardDef[];
  enemyDeck: CardDef[];
  playerHp: number;
  enemyHp: number;
  startingMana: number;
  maxMana: number;
  handSize: number;
  enemyName: string;
}

// ---- Board / tactics ----

export type TerrainType = 'plain' | 'mountain' | 'water' | 'forest' | 'lava';

export interface BoardPieceDef {
  id: string;
  name: string;
  color: string;
  moveRange: number;
  attackRange: number;
  hp: number;
  maxHp: number;
  atk: number;
  /** Special ability description */
  special?: string;
}

export interface BoardPlacement {
  piece: BoardPieceDef;
  x: number;
  y: number;
  owner: 'player' | 'enemy';
}

export interface BoardGameData {
  width: number;
  height: number;
  terrain: TerrainType[][];
  pieces: BoardPlacement[];
  turnLimit?: number;
}

// ---- Logic puzzle ----

export type PuzzleType = 'sudoku' | 'nonogram' | 'logic_grid' | 'connection' | 'sequence';

export interface LogicPuzzleDef {
  type: PuzzleType;
  /** Grid size or dimensions */
  size: number;
  /** The puzzle data (grid values, groups, etc.) */
  grid: (number | string | null)[][];
  /** Clues or hints */
  clues: string[];
  /** The correct solution */
  solution: (number | string)[][];
  /** Time limit in seconds (0 = no limit) */
  timeLimit: number;
}

export interface PuzzleGameData {
  puzzles: LogicPuzzleDef[];
  currentPuzzleIndex: number;
}

// ---- Rhythm ----

export interface RhythmNote {
  /** Time in ms from song start */
  time: number;
  /** Lane index (0-3 for DFJK) */
  lane: number;
  /** Note type: tap, hold, slide */
  type: 'tap' | 'hold' | 'slide';
  /** Duration in ms (for hold notes) */
  duration?: number;
}

export interface RhythmGameData {
  notes: RhythmNote[];
  bpm: number;
  /** Scroll speed in pixels per second */
  scrollSpeed: number;
  /** Song duration in ms */
  songDuration: number;
  /** Lane count (default 4) */
  laneCount: number;
}

// ---- Extended GameConfig with genre-specific data ----

export interface GameConfigGenreData {
  narrative?: NarrativeGameData;
  card?: CardGameData;
  board?: BoardGameData;
  puzzle?: PuzzleGameData;
  rhythm?: RhythmGameData;
}

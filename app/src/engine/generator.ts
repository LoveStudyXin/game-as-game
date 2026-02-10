// ============================================================================
// Core Game Generator
//
// THE HEART OF THE APPLICATION.
//
// Takes a UserChoices object (the output of the 6-step wizard) and produces
// a complete, serialisable GameConfig that the runtime engine can interpret.
//
// Generation pipeline (15 steps):
//   1.  Create internal seed
//   2.  Initialize seeded RNG
//   3.  Create player entity
//   4.  Generate world config
//   5.  Generate platforms
//   6.  Generate enemies
//   7.  Generate collectibles
//   8.  Generate systems list
//   9.  Generate rules
//   10. Generate feedback loops
//   11. Generate narrative
//   12. Configure chaos
//   13. Generate difficulty curve
//   14. Generate seed code
//   15. Validate with meaningful-play check
// ============================================================================

import type {
  GameConfig,
  GameConfigGenreData,
  UserChoices,
  CoreVerb,
  GameGenre,
  VisualStyle,
  EntityDef,
  ComponentDef,
  SystemDef,
  RuleDef,
  FeedbackLoop,
  NarrativeConfig,
  ChaosConfig,
  DifficultyConfig,
  DifficultyStyle,
  GamePace,
  WorldConfig,
  NarrativeNode,
  NarrativeNodeChoice,
  NarrativeGameData,
  CardDef,
  CardGameData,
  BoardGameData,
  BoardPieceDef,
  TerrainType,
  PuzzleGameData,
  LogicPuzzleDef,
  RhythmGameData,
  RhythmNote,
} from '@/engine/types';

import { generateCharacter } from '@/engine/narrative/character-gen';
import { generateWorldNarrative } from '@/engine/narrative/world-gen';
import { generateEvents } from '@/engine/narrative/event-gen';
import { encodeSeedCode } from '@/engine/seed';
import { validateMeaningfulPlay } from '@/engine/validation/meaningful-play';
import { validateDifficulty } from '@/engine/validation/difficulty-check';

// ============================================================================
// Seeded Random Number Generator (Mulberry32)
// ============================================================================

/**
 * Create a deterministic PRNG seeded with a 32-bit integer.
 * Algorithm: Mulberry32 -- fast, high-quality, and widely used.
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Internal Seed Creation
// ============================================================================

/**
 * Hash a string (djb2 variant) to a 32-bit unsigned integer.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Build a deterministic-ish internal seed from the user's choices,
 * salted with Date.now() and Math.random() for uniqueness.
 */
function createInternalSeed(choices: UserChoices): number {
  const choiceStr = [
    choices.genre,
    choices.visualStyle,
    choices.verbs.join(','),
    choices.gravity,
    choices.boundary,
    choices.worldDifference,
    choices.characterArchetype,
    choices.difficultyStyle,
    choices.chaosLevel.toString(),
  ].join('|');

  const base = hashString(choiceStr);
  const salt = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  return (base ^ salt) >>> 0;
}

// ============================================================================
// Step 3: Player Entity
// ============================================================================

function createPlayerEntity(
  verbs: CoreVerb[],
  archetype: ReturnType<typeof generateCharacter>,
  rand: () => number,
): EntityDef {
  const components: ComponentDef[] = [
    { type: 'movement', config: { speed: 200, maxSpeed: 400 } },
    { type: 'health', config: { current: 100, max: 100 } },
  ];

  for (const verb of verbs) {
    switch (verb) {
      case 'jump':
        components.push({
          type: 'jump',
          config: { jumpForce: 350, maxJumps: 2 },
        });
        break;
      case 'shoot':
        components.push({
          type: 'shooter',
          config: { fireRate: 5, bulletSpeed: 500, bulletColor: archetype.color },
        });
        break;
      case 'collect':
        components.push({
          type: 'collector',
          config: { collectRadius: 40 },
        });
        break;
      case 'dodge':
        components.push({
          type: 'dodger',
          config: { dashSpeed: 600, dashCooldown: 800, invincibilityMs: 300 },
        });
        break;
      case 'build':
        components.push({
          type: 'builder',
          config: { buildCooldown: 500, blockColor: archetype.color, maxBlocks: 10 },
        });
        break;
    }
  }

  return {
    id: 'player',
    type: 'player',
    x: 100,
    y: 300,
    width: 24,
    height: 32,
    color: archetype.color,
    components,
  };
}

// ============================================================================
// Step 4: World Config
// ============================================================================

function generateWorldConfig(choices: UserChoices): WorldConfig {
  const palette = getVisualPalette(choices.visualStyle, choices.worldDifference);

  // Different genres may want different world sizes
  const dimensions: Record<GameGenre, [number, number]> = {
    action: [1600, 900],
    narrative: [800, 600],
    card: [800, 450],
    board: [800, 600],
    puzzle_logic: [800, 600],
    rhythm: [1600, 600],
  };
  const [width, height] = dimensions[choices.genre] || [1600, 900];

  return {
    gravity: choices.gravity,
    boundary: choices.boundary,
    specialPhysics: choices.specialPhysics,
    width,
    height,
    backgroundColor: palette.background,
  };
}

// ============================================================================
// Step 5: Platform Generation
// ============================================================================

type PlatformType = 'static' | 'moving' | 'breakable' | 'bouncy' | 'sticky';

function generatePlatforms(
  rand: () => number,
  worldConfig: WorldConfig,
  verbs: CoreVerb[],
): EntityDef[] {
  const count = 10 + Math.floor(rand() * 11); // 10-20 platforms
  const platforms: EntityDef[] = [];

  const types: PlatformType[] = ['static', 'static', 'static'];
  if (verbs.includes('jump')) types.push('bouncy', 'moving');
  if (verbs.includes('build')) types.push('breakable');
  if (verbs.includes('dodge')) types.push('moving', 'moving');
  types.push('sticky');

  // Ensure a safe starting platform
  platforms.push({
    id: 'platform_start',
    type: 'platform',
    x: 50,
    y: 400,
    width: 200,
    height: 20,
    color: '#4a4a6a',
    components: [{ type: 'static', config: {} }],
  });

  // Generate remaining platforms with reachability in mind
  let lastX = 150;
  let lastY = 400;

  for (let i = 1; i < count; i++) {
    const ptype = types[Math.floor(rand() * types.length)];
    const width = 60 + Math.floor(rand() * 140); // 60-200
    const height = 16 + Math.floor(rand() * 12); // 16-28

    // Ensure horizontal and vertical gaps are jumpable
    const dx = 80 + Math.floor(rand() * 180); // 80-260 horizontal gap
    const dy = -120 + Math.floor(rand() * 240); // -120 to +120 vertical shift

    let x = lastX + dx;
    let y = lastY + dy;

    // Clamp to world bounds
    x = Math.max(0, Math.min(worldConfig.width - width, x));
    y = Math.max(60, Math.min(worldConfig.height - 60, y));

    const components: ComponentDef[] = [];
    let color = '#4a4a6a';

    switch (ptype) {
      case 'static':
        components.push({ type: 'static', config: {} });
        break;
      case 'moving':
        components.push({
          type: 'moving',
          config: { startX: x, startY: y, endX: x + 100, endY: y, speed: 60 + rand() * 80 },
        });
        color = '#6a4a8a';
        break;
      case 'breakable':
        components.push({ type: 'breakable', config: { hitPoints: 1 + Math.floor(rand() * 3) } });
        color = '#8a5a3a';
        break;
      case 'bouncy':
        components.push({ type: 'bouncy', config: { bounceForce: 400 + rand() * 200 } });
        color = '#3a8a5a';
        break;
      case 'sticky':
        components.push({ type: 'sticky', config: { friction: 0.8 + rand() * 0.15 } });
        color = '#5a3a8a';
        break;
    }

    const platform: EntityDef = {
      id: `platform_${i}`,
      type: 'platform',
      x,
      y,
      width,
      height,
      color,
      components,
    };

    platforms.push(platform);
    lastX = x + width / 2;
    lastY = y;
  }

  return platforms;
}

// ============================================================================
// Step 6: Enemy Generation
// ============================================================================

type EnemyType = 'patrol' | 'chaser' | 'shooter' | 'bouncer';

function generateEnemies(
  rand: () => number,
  difficulty: DifficultyStyle,
  verbs: CoreVerb[],
  worldConfig: WorldConfig,
): EntityDef[] {
  const ENEMY_COUNTS: Record<DifficultyStyle, [number, number]> = {
    relaxed: [2, 5],
    steady: [4, 8],
    hardcore: [8, 15],
    rollercoaster: [5, 10],
  };

  const [min, max] = ENEMY_COUNTS[difficulty];
  const count = min + Math.floor(rand() * (max - min + 1));

  const types: EnemyType[] = ['patrol'];
  if (verbs.includes('shoot')) types.push('shooter');
  if (verbs.includes('dodge')) types.push('chaser', 'chaser');
  types.push('bouncer');

  const enemies: EntityDef[] = [];

  for (let i = 0; i < count; i++) {
    const etype = types[Math.floor(rand() * types.length)];
    const x = 200 + Math.floor(rand() * (worldConfig.width - 300));
    const y = 100 + Math.floor(rand() * (worldConfig.height - 200));

    const components: ComponentDef[] = [];
    let color = '#e94560';
    const size = 20 + Math.floor(rand() * 12);

    switch (etype) {
      case 'patrol':
        components.push({
          type: 'patrol',
          config: {
            patrolDistance: 80 + Math.floor(rand() * 120),
            speed: 40 + rand() * 60,
            direction: rand() > 0.5 ? 'horizontal' : 'vertical',
          },
        });
        break;
      case 'chaser':
        components.push({
          type: 'chaser',
          config: { chaseSpeed: 80 + rand() * 80, detectionRadius: 150 + rand() * 100 },
        });
        color = '#ff4444';
        break;
      case 'shooter':
        components.push({
          type: 'enemy_shooter',
          config: {
            fireRate: 1 + rand() * 2,
            bulletSpeed: 200 + rand() * 200,
            bulletColor: '#ff6666',
            range: 200 + rand() * 150,
          },
        });
        color = '#cc3333';
        break;
      case 'bouncer':
        components.push({
          type: 'bouncer',
          config: { bounceSpeed: 100 + rand() * 100, bounceAngleVariance: 15 + rand() * 30 },
        });
        color = '#ff7744';
        break;
    }

    components.push({ type: 'health', config: { current: 1, max: 1 } });

    enemies.push({
      id: `enemy_${i}`,
      type: 'enemy',
      x,
      y,
      width: size,
      height: size,
      color,
      components,
    });
  }

  return enemies;
}

// ============================================================================
// Step 7: Collectible Generation
// ============================================================================

function generateCollectibles(
  rand: () => number,
  verbs: CoreVerb[],
  worldConfig: WorldConfig,
): EntityDef[] {
  const hasCollect = verbs.includes('collect');
  const count = hasCollect ? 15 + Math.floor(rand() * 11) : 5 + Math.floor(rand() * 6);
  const collectibles: EntityDef[] = [];

  for (let i = 0; i < count; i++) {
    const x = 80 + Math.floor(rand() * (worldConfig.width - 160));
    const y = 60 + Math.floor(rand() * (worldConfig.height - 120));

    const isSpecial = rand() > 0.8;
    const components: ComponentDef[] = [];

    if (isSpecial) {
      const powerUps = ['speed_boost', 'shield', 'double_score', 'magnet'];
      components.push({
        type: 'collectible',
        config: {
          scoreValue: 50,
          powerUpType: powerUps[Math.floor(rand() * powerUps.length)],
          powerUpDurationMs: 3000 + Math.floor(rand() * 5000),
        },
      });
    } else {
      components.push({
        type: 'collectible',
        config: { scoreValue: 10 + Math.floor(rand() * 3) * 5 },
      });
    }

    collectibles.push({
      id: `collectible_${i}`,
      type: 'collectible',
      x,
      y,
      width: isSpecial ? 16 : 12,
      height: isSpecial ? 16 : 12,
      color: isSpecial ? '#ff44ff' : '#ffd700',
      components,
    });
  }

  return collectibles;
}

// ============================================================================
// Genre-Specific Entity Generators
// ============================================================================

/** Exploration: rooms with doors, hidden areas, fog-of-war zones */
function generateExplorationEntities(
  rand: () => number,
  worldConfig: WorldConfig,
  verbs: CoreVerb[],
): EntityDef[] {
  const entities: EntityDef[] = [];
  const roomCount = 6 + Math.floor(rand() * 5); // 6-10 rooms
  const roomWidth = 300;
  const roomHeight = 250;

  for (let i = 0; i < roomCount; i++) {
    const x = Math.floor(rand() * (worldConfig.width - roomWidth));
    const y = Math.floor(rand() * (worldConfig.height - roomHeight));

    // Room floor
    entities.push({
      id: `room_floor_${i}`,
      type: 'platform',
      x, y: y + roomHeight - 20,
      width: roomWidth, height: 20,
      color: '#3a5a4a',
      components: [{ type: 'static', config: {} }],
    });

    // Room walls (left + right)
    entities.push({
      id: `room_wall_l_${i}`,
      type: 'platform',
      x, y,
      width: 16, height: roomHeight,
      color: '#4a4a5a',
      components: [{ type: 'static', config: {} }],
    });
    entities.push({
      id: `room_wall_r_${i}`,
      type: 'platform',
      x: x + roomWidth - 16, y,
      width: 16, height: roomHeight,
      color: '#4a4a5a',
      components: [{ type: 'static', config: {} }],
    });

    // Hidden area marker (secret item)
    if (rand() > 0.5) {
      entities.push({
        id: `secret_${i}`,
        type: 'collectible',
        x: x + 40 + Math.floor(rand() * (roomWidth - 80)),
        y: y + 40 + Math.floor(rand() * (roomHeight - 100)),
        width: 14, height: 14,
        color: '#88ffaa',
        components: [{ type: 'collectible', config: { scoreValue: 100, powerUpType: 'reveal_map' } }],
      });
    }

    // Door / portal between rooms
    if (i < roomCount - 1) {
      entities.push({
        id: `door_${i}`,
        type: 'collectible',
        x: x + roomWidth - 30,
        y: y + roomHeight - 60,
        width: 20, height: 40,
        color: '#ffaa44',
        components: [{ type: 'collectible', config: { scoreValue: 10, keyId: `door_${i}` } }],
      });
    }
  }

  // Fog zones (visual entities that block vision)
  const fogCount = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < fogCount; i++) {
    entities.push({
      id: `fog_${i}`,
      type: 'platform',
      x: Math.floor(rand() * worldConfig.width),
      y: Math.floor(rand() * worldConfig.height),
      width: 200 + Math.floor(rand() * 200),
      height: 200 + Math.floor(rand() * 200),
      color: '#1a1a2e88',
      components: [{ type: 'static', config: { passthrough: true } }],
    });
  }

  return entities;
}

/** Puzzle: grid-based blocks, targets, switches */
function generatePuzzleEntities(
  rand: () => number,
  worldConfig: WorldConfig,
  verbs: CoreVerb[],
): EntityDef[] {
  const entities: EntityDef[] = [];
  const gridSize = 64;
  const cols = Math.floor(worldConfig.width / gridSize);
  const rows = Math.floor(worldConfig.height / gridSize);

  // Generate a puzzle grid with walls
  const wallCount = 15 + Math.floor(rand() * 15);
  for (let i = 0; i < wallCount; i++) {
    const gx = Math.floor(rand() * cols);
    const gy = Math.floor(rand() * rows);
    entities.push({
      id: `wall_${i}`,
      type: 'platform',
      x: gx * gridSize, y: gy * gridSize,
      width: gridSize, height: gridSize,
      color: '#5a5a7a',
      components: [{ type: 'static', config: {} }],
    });
  }

  // Pushable blocks
  const blockCount = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < blockCount; i++) {
    const gx = 2 + Math.floor(rand() * (cols - 4));
    const gy = 2 + Math.floor(rand() * (rows - 4));
    entities.push({
      id: `pushblock_${i}`,
      type: 'enemy', // reuse enemy physics for movement
      x: gx * gridSize, y: gy * gridSize,
      width: gridSize - 4, height: gridSize - 4,
      color: '#6688cc',
      components: [
        { type: 'patrol', config: { patrolDistance: 0, speed: 0, direction: 'horizontal' } },
        { type: 'health', config: { current: 999, max: 999 } },
      ],
    });
  }

  // Target positions
  for (let i = 0; i < blockCount; i++) {
    const gx = 2 + Math.floor(rand() * (cols - 4));
    const gy = 2 + Math.floor(rand() * (rows - 4));
    entities.push({
      id: `target_${i}`,
      type: 'collectible',
      x: gx * gridSize + 8, y: gy * gridSize + 8,
      width: gridSize - 16, height: gridSize - 16,
      color: '#44cc88',
      components: [{ type: 'collectible', config: { scoreValue: 200 } }],
    });
  }

  // Switches
  if (verbs.includes('activate')) {
    const switchCount = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < switchCount; i++) {
      entities.push({
        id: `switch_${i}`,
        type: 'collectible',
        x: Math.floor(rand() * (cols - 2)) * gridSize + gridSize / 4,
        y: Math.floor(rand() * (rows - 2)) * gridSize + gridSize / 4,
        width: gridSize / 2, height: gridSize / 2,
        color: '#ff6644',
        components: [{ type: 'collectible', config: { scoreValue: 50, powerUpType: 'switch_toggle' } }],
      });
    }
  }

  return entities;
}

/** Arena: open space with spawn points and waves */
function generateArenaEntities(
  rand: () => number,
  worldConfig: WorldConfig,
  difficulty: DifficultyStyle,
): EntityDef[] {
  const entities: EntityDef[] = [];

  // Arena floor
  entities.push({
    id: 'arena_floor',
    type: 'platform',
    x: 0, y: worldConfig.height - 40,
    width: worldConfig.width, height: 40,
    color: '#3a3a5a',
    components: [{ type: 'static', config: {} }],
  });

  // Obstacle pillars
  const pillarCount = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < pillarCount; i++) {
    const px = 100 + Math.floor(rand() * (worldConfig.width - 200));
    entities.push({
      id: `pillar_${i}`,
      type: 'platform',
      x: px, y: worldConfig.height - 40 - 80 - Math.floor(rand() * 120),
      width: 30 + Math.floor(rand() * 30), height: 80 + Math.floor(rand() * 120),
      color: '#4a4a6a',
      components: [{ type: 'static', config: {} }],
    });
  }

  // Cover platforms
  const coverCount = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < coverCount; i++) {
    entities.push({
      id: `cover_${i}`,
      type: 'platform',
      x: 80 + Math.floor(rand() * (worldConfig.width - 200)),
      y: 200 + Math.floor(rand() * (worldConfig.height - 400)),
      width: 100 + Math.floor(rand() * 100), height: 16,
      color: '#5a5a8a',
      components: [{ type: 'static', config: {} }],
    });
  }

  // Enemy waves (more enemies, more variety)
  const WAVE_COUNTS: Record<DifficultyStyle, number> = {
    relaxed: 6, steady: 10, hardcore: 18, rollercoaster: 12,
  };
  const enemyCount = WAVE_COUNTS[difficulty];

  for (let i = 0; i < enemyCount; i++) {
    const etype = ['patrol', 'chaser', 'shooter', 'bouncer'][Math.floor(rand() * 4)] as
      'patrol' | 'chaser' | 'shooter' | 'bouncer';
    const x = 100 + Math.floor(rand() * (worldConfig.width - 200));
    const y = 100 + Math.floor(rand() * (worldConfig.height - 300));
    const size = 18 + Math.floor(rand() * 16);

    const components: ComponentDef[] = [];
    let color = '#e94560';

    switch (etype) {
      case 'patrol':
        components.push({ type: 'patrol', config: { patrolDistance: 60 + Math.floor(rand() * 100), speed: 50 + rand() * 80, direction: rand() > 0.5 ? 'horizontal' : 'vertical' } });
        break;
      case 'chaser':
        components.push({ type: 'chaser', config: { chaseSpeed: 100 + rand() * 100, detectionRadius: 200 + rand() * 150 } });
        color = '#ff4444';
        break;
      case 'shooter':
        components.push({ type: 'enemy_shooter', config: { fireRate: 1.5 + rand() * 2, bulletSpeed: 250 + rand() * 200, bulletColor: '#ff6666', range: 250 + rand() * 200 } });
        color = '#cc3333';
        break;
      case 'bouncer':
        components.push({ type: 'bouncer', config: { bounceSpeed: 120 + rand() * 120, bounceAngleVariance: 20 + rand() * 30 } });
        color = '#ff7744';
        break;
    }
    components.push({ type: 'health', config: { current: 1 + Math.floor(rand() * 2), max: 3 } });

    entities.push({ id: `arena_enemy_${i}`, type: 'enemy', x, y, width: size, height: size, color, components });
  }

  // Power-up drops scattered around the arena
  const dropCount = 5 + Math.floor(rand() * 6);
  for (let i = 0; i < dropCount; i++) {
    const powerUps = ['speed_boost', 'shield', 'double_score', 'rapid_fire'];
    entities.push({
      id: `arena_drop_${i}`,
      type: 'collectible',
      x: 80 + Math.floor(rand() * (worldConfig.width - 160)),
      y: 80 + Math.floor(rand() * (worldConfig.height - 200)),
      width: 14, height: 14,
      color: '#ff44ff',
      components: [{ type: 'collectible', config: { scoreValue: 25, powerUpType: powerUps[Math.floor(rand() * powerUps.length)], powerUpDurationMs: 5000 } }],
    });
  }

  return entities;
}

/** Survival: resources, crafting stations, day-night cycle entities */
function generateSurvivalEntities(
  rand: () => number,
  worldConfig: WorldConfig,
): EntityDef[] {
  const entities: EntityDef[] = [];

  // Ground
  entities.push({
    id: 'ground',
    type: 'platform',
    x: 0, y: worldConfig.height - 30,
    width: worldConfig.width, height: 30,
    color: '#3a5a3a',
    components: [{ type: 'static', config: {} }],
  });

  // Trees (resource nodes)
  const treeCount = 8 + Math.floor(rand() * 8);
  for (let i = 0; i < treeCount; i++) {
    const tx = 50 + Math.floor(rand() * (worldConfig.width - 100));
    entities.push({
      id: `tree_${i}`,
      type: 'platform',
      x: tx, y: worldConfig.height - 30 - 60 - Math.floor(rand() * 40),
      width: 20, height: 60 + Math.floor(rand() * 40),
      color: '#5a3a2a',
      components: [{ type: 'static', config: {} }],
    });
    // Tree top / canopy
    entities.push({
      id: `canopy_${i}`,
      type: 'collectible',
      x: tx - 20, y: worldConfig.height - 30 - 100 - Math.floor(rand() * 40),
      width: 60, height: 40,
      color: '#2a8a4a',
      components: [{ type: 'collectible', config: { scoreValue: 5 } }],
    });
  }

  // Resource nodes (rocks, berries, etc.)
  const resourceTypes = [
    { color: '#8a8a9a', name: 'stone', score: 10 },
    { color: '#ff6644', name: 'berry', score: 5 },
    { color: '#4488ff', name: 'water', score: 8 },
    { color: '#ffaa22', name: 'metal', score: 20 },
  ];
  const resCount = 12 + Math.floor(rand() * 8);
  for (let i = 0; i < resCount; i++) {
    const res = resourceTypes[Math.floor(rand() * resourceTypes.length)];
    entities.push({
      id: `resource_${i}`,
      type: 'collectible',
      x: 60 + Math.floor(rand() * (worldConfig.width - 120)),
      y: worldConfig.height - 50 - Math.floor(rand() * 100),
      width: 10 + Math.floor(rand() * 8), height: 10 + Math.floor(rand() * 8),
      color: res.color,
      components: [{ type: 'collectible', config: { scoreValue: res.score } }],
    });
  }

  // Night threat enemies (spawn from edges)
  const threatCount = 4 + Math.floor(rand() * 6);
  for (let i = 0; i < threatCount; i++) {
    const fromLeft = rand() > 0.5;
    entities.push({
      id: `threat_${i}`,
      type: 'enemy',
      x: fromLeft ? -20 : worldConfig.width + 20,
      y: worldConfig.height - 60 - Math.floor(rand() * 100),
      width: 24, height: 24,
      color: '#8844aa',
      components: [
        { type: 'chaser', config: { chaseSpeed: 40 + rand() * 60, detectionRadius: 300 } },
        { type: 'health', config: { current: 2, max: 2 } },
      ],
    });
  }

  return entities;
}

/** Rhythm: lanes with note entities, timing markers */
function generateRhythmEntities(
  rand: () => number,
  worldConfig: WorldConfig,
): EntityDef[] {
  const entities: EntityDef[] = [];
  const laneCount = 4;
  const laneHeight = worldConfig.height / laneCount;

  // Lane dividers
  for (let i = 0; i <= laneCount; i++) {
    entities.push({
      id: `lane_${i}`,
      type: 'platform',
      x: 0, y: i * laneHeight,
      width: worldConfig.width, height: 3,
      color: '#3a3a6a',
      components: [{ type: 'static', config: { passthrough: true } }],
    });
  }

  // Hit zone (left side target)
  entities.push({
    id: 'hit_zone',
    type: 'platform',
    x: 80, y: 0,
    width: 6, height: worldConfig.height,
    color: '#ffaa00',
    components: [{ type: 'static', config: { passthrough: true } }],
  });

  // Generate note entities scrolling from right to left
  const noteCount = 20 + Math.floor(rand() * 20);
  const noteColors = ['#ff4488', '#44ff88', '#4488ff', '#ffaa44'];

  for (let i = 0; i < noteCount; i++) {
    const lane = Math.floor(rand() * laneCount);
    const xOffset = 400 + i * (60 + Math.floor(rand() * 80));

    entities.push({
      id: `note_${i}`,
      type: 'collectible',
      x: xOffset,
      y: lane * laneHeight + laneHeight / 2 - 12,
      width: 24, height: 24,
      color: noteColors[lane % noteColors.length],
      components: [{
        type: 'collectible',
        config: {
          scoreValue: 10 + (rand() > 0.8 ? 40 : 0),
          powerUpType: rand() > 0.85 ? 'speed_boost' : undefined,
        },
      }],
    });
  }

  return entities;
}

// ============================================================================
// Visual Style Configuration
// ============================================================================

interface VisualPalette {
  background: string;
  platform: string;
  platformAlt: string;
  enemy: string;
  collectible: string;
  player: string;
  accent: string;
}

function getVisualPalette(style: VisualStyle, worldDiff: string): VisualPalette {
  switch (style) {
    case 'neon':
      return {
        background: '#0a0a12',
        platform: '#001a33',
        platformAlt: '#002244',
        enemy: '#ff0066',
        collectible: '#00ffcc',
        player: '#00ccff',
        accent: '#ff00ff',
      };
    case 'minimal':
      return {
        background: '#f0ece4',
        platform: '#c8c0b0',
        platformAlt: '#a8a090',
        enemy: '#e05040',
        collectible: '#40a060',
        player: '#303030',
        accent: '#4080d0',
      };
    case 'watercolor':
      return {
        background: '#f5efe6',
        platform: '#a8c8a0',
        platformAlt: '#88b8a0',
        enemy: '#d88080',
        collectible: '#e8c860',
        player: '#6088b0',
        accent: '#c090c0',
      };
    case 'retro_crt':
      return {
        background: '#0c0c0c',
        platform: '#00aa00',
        platformAlt: '#008800',
        enemy: '#ff3300',
        collectible: '#ffff00',
        player: '#00ff00',
        accent: '#00aaff',
      };
    case 'pixel':
    default: {
      const BG_COLORS: Record<string, string> = {
        colors_alive: '#1a0a2e',
        sound_solid: '#0a1628',
        memory_touch: '#1e0a28',
        time_uneven: '#0a1e1e',
      };
      return {
        background: BG_COLORS[worldDiff] ?? '#0f0f1a',
        platform: '#4a4a6a',
        platformAlt: '#6a4a8a',
        enemy: '#e94560',
        collectible: '#ffd700',
        player: '#00d4ff',
        accent: '#ff44ff',
      };
    }
  }
}

// ============================================================================
// Step 8: Systems
// ============================================================================

function generateSystems(verbs: CoreVerb[], choices: UserChoices): SystemDef[] {
  const systems: SystemDef[] = [
    { type: 'physics', config: { gravity: choices.gravity, boundary: choices.boundary } },
    { type: 'movement', config: { specialPhysics: choices.specialPhysics } },
    { type: 'collision', config: {} },
    { type: 'rendering', config: {} },
    { type: 'scoring', config: {} },
  ];

  for (const verb of verbs) {
    switch (verb) {
      case 'jump':
        systems.push({ type: 'jump', config: { gravity: choices.gravity } });
        break;
      case 'shoot':
        systems.push({ type: 'shooting', config: {} });
        systems.push({ type: 'projectile', config: {} });
        break;
      case 'collect':
        systems.push({ type: 'collection', config: {} });
        break;
      case 'dodge':
        systems.push({ type: 'dodge', config: {} });
        break;
      case 'build':
        systems.push({ type: 'building', config: {} });
        break;
    }
  }

  // Narrative system is always present
  systems.push({ type: 'narrative', config: {} });

  // Chaos system if chaos > 0
  if (choices.chaosLevel > 0) {
    systems.push({ type: 'chaos', config: { level: choices.chaosLevel } });
  }

  return systems;
}

// ============================================================================
// Step 9: Rules
// ============================================================================

function generateRules(verbs: CoreVerb[], choices: UserChoices): RuleDef[] {
  const rules: RuleDef[] = [];

  // Base rules
  rules.push({
    trigger: 'player_collide_enemy',
    action: 'damage_player',
    effect: 'flash_red, shake_screen, score_penalty(-10)',
  });

  rules.push({
    trigger: 'player_collide_collectible',
    action: 'collect_item',
    effect: 'particle_burst, score_add, destroy_collectible',
  });

  // Verb-specific rules
  for (const verb of verbs) {
    switch (verb) {
      case 'jump':
        rules.push({
          trigger: 'player_jump',
          action: 'apply_jump_force',
          effect: 'particle_dust, animation_stretch',
        });
        rules.push({
          trigger: 'player_land',
          action: 'reset_jumps',
          effect: 'particle_land, score_add(1)',
        });
        break;

      case 'shoot':
        rules.push({
          trigger: 'player_shoot',
          action: 'spawn_projectile',
          effect: 'flash_muzzle, sound_shoot',
        });
        rules.push({
          trigger: 'projectile_hit_enemy',
          action: 'damage_enemy',
          effect: 'particle_explosion, score_add(25), destroy_projectile',
        });
        break;

      case 'collect':
        rules.push({
          trigger: 'all_collectibles_gathered',
          condition: 'collectible_count == 0',
          action: 'advance_level',
          effect: 'flash_gold, text_show("ALL FOUND!"), level_complete',
        });
        break;

      case 'dodge':
        rules.push({
          trigger: 'player_dodge',
          action: 'activate_dash',
          effect: 'afterimage_trail, invincibility_start',
        });
        rules.push({
          trigger: 'dodge_near_miss',
          condition: 'enemy_distance < 30',
          action: 'score_bonus',
          effect: 'flash_white, score_add(50), text_show("CLOSE!")',
        });
        break;

      case 'build':
        rules.push({
          trigger: 'player_build',
          action: 'place_block',
          effect: 'particle_construct, sound_place',
        });
        rules.push({
          trigger: 'build_bridge_complete',
          condition: 'blocks_connected >= 3',
          action: 'score_bonus',
          effect: 'glow_blocks, score_add(30)',
        });
        break;
    }
  }

  // Multi-verb combo rules
  if (verbs.includes('jump') && verbs.includes('shoot')) {
    rules.push({
      trigger: 'player_shoot',
      condition: 'player_airborne == true',
      action: 'aerial_shot_bonus',
      effect: 'flash_cyan, score_add(15), text_show("AIR SHOT!")',
    });
  }

  if (verbs.includes('dodge') && verbs.includes('collect')) {
    rules.push({
      trigger: 'player_dodge',
      condition: 'nearby_collectibles > 0',
      action: 'dash_collect',
      effect: 'magnet_pull, score_add(5)',
    });
  }

  if (verbs.includes('build') && verbs.includes('jump')) {
    rules.push({
      trigger: 'player_jump',
      condition: 'standing_on_player_block == true',
      action: 'super_jump',
      effect: 'particle_burst_large, score_add(10), text_show("BOOST!")',
    });
  }

  // Physics-specific rules
  if (choices.gravity === 'shifting') {
    rules.push({
      trigger: 'gravity_shift',
      action: 'invert_gravity',
      effect: 'screen_flip, color_shift',
    });
  }

  if (choices.gravity === 'reverse') {
    rules.push({
      trigger: 'player_on_ceiling',
      action: 'ceiling_walk',
      effect: 'particle_sparkle',
    });
  }

  return rules;
}

// ============================================================================
// Step 10: Feedback Loops
// ============================================================================

function generateFeedbackLoops(verbs: CoreVerb[]): FeedbackLoop[] {
  const loops: FeedbackLoop[] = [];

  // Universal positive loop: score -> multiplier -> more score
  loops.push({
    type: 'positive',
    description: 'Consecutive successful actions increase a score multiplier, rewarding skilled play streaks.',
    variables: ['score', 'multiplier', 'streak_count'],
  });

  // Universal negative loop: damage -> slower -> more vulnerable
  loops.push({
    type: 'negative',
    description: 'Taking damage temporarily slows the player, making them more vulnerable but also forcing a more cautious approach.',
    variables: ['health', 'speed', 'vulnerability'],
  });

  // Verb-specific loops
  if (verbs.includes('collect')) {
    loops.push({
      type: 'positive',
      description: 'Collecting items increases collection radius, making future collection easier.',
      variables: ['items_collected', 'collect_radius'],
    });
  }

  if (verbs.includes('shoot')) {
    loops.push({
      type: 'positive',
      description: 'Defeating enemies drops ammo, enabling more shooting. Missing wastes ammo and increases pressure.',
      variables: ['ammo', 'enemies_defeated', 'accuracy'],
    });
  }

  if (verbs.includes('build')) {
    loops.push({
      type: 'positive',
      description: 'Building structures grants resources from the environment, enabling more building.',
      variables: ['blocks_placed', 'resources', 'build_capacity'],
    });
  }

  if (verbs.includes('dodge')) {
    loops.push({
      type: 'positive',
      description: 'Successful dodges charge an energy meter that can be spent on a powerful burst.',
      variables: ['dodge_count', 'energy', 'burst_power'],
    });
  }

  return loops;
}

// ============================================================================
// Step 11: Narrative
// ============================================================================

function generateNarrative(choices: UserChoices, verbs: CoreVerb[], chaosLevel: number): NarrativeConfig {
  // Get base narrative from world-gen
  const baseNarrative = generateWorldNarrative(choices.worldDifference, choices.characterArchetype);

  // Generate the full diamond-structure event chain from event-gen
  const diamondEvents = generateEvents(
    choices.worldDifference,
    choices.characterArchetype,
    verbs,
    chaosLevel,
  );

  // Merge: use diamond events as the primary chain, supplemented by world-gen seeds
  const allEvents = [...diamondEvents, ...baseNarrative.events.filter(
    (seedEv) => !diamondEvents.some((dEv) => dEv.trigger === seedEv.trigger && dEv.id.startsWith('diamond')),
  )];

  return {
    worldDifference: baseNarrative.worldDifference,
    characterArchetype: choices.characterArchetype,
    events: allEvents,
  };
}

// ============================================================================
// Step 12: Chaos Config
// ============================================================================

function generateChaosConfig(chaosLevel: number): ChaosConfig {
  const ALL_MUTATIONS = [
    'gravity_flip',
    'color_invert',
    'size_wobble',
    'speed_surge',
    'platform_shuffle',
    'enemy_multiply',
    'collectible_scatter',
    'time_dilate',
    'controls_swap',
    'background_shift',
  ];

  // Number of available mutations scales with chaos level
  const mutationCount = Math.max(1, Math.floor((chaosLevel / 100) * ALL_MUTATIONS.length));
  const mutations = ALL_MUTATIONS.slice(0, mutationCount);

  // Frequency: lower chaos = rare mutations; higher chaos = frequent
  const baseFrq = 30000; // 30s at chaos 0
  const minFrq = 3000;   // 3s at chaos 100
  const mutationFrequencyMs = Math.round(baseFrq - (baseFrq - minFrq) * (chaosLevel / 100));

  // Max active mutations
  const maxActiveMutations = chaosLevel < 30 ? 1 : chaosLevel < 60 ? 2 : chaosLevel < 80 ? 3 : 4;

  return {
    level: chaosLevel,
    mutations,
    mutationFrequencyMs,
    maxActiveMutations,
  };
}

// ============================================================================
// Step 13: Difficulty Curve
// ============================================================================

/**
 * Generate a difficulty curve as an array of values in [0, 1].
 *
 * @param style      - Overall feel: relaxed, steady, hardcore, rollercoaster.
 * @param pace       - Tempo: fast (fewer, steeper steps), slow (more, gentler).
 * @param levelCount - Number of data points to generate.
 */
export function generateDifficultyCurve(
  style: DifficultyStyle,
  pace: GamePace,
  levelCount: number,
): number[] {
  const count = Math.max(3, levelCount);
  const curve: number[] = [];

  // Pace multiplier: fast games ramp quicker, slow games take their time
  const paceMul: Record<GamePace, number> = { fast: 1.3, medium: 1.0, slow: 0.7 };
  const pm = paceMul[pace];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // normalised position 0..1
    let d: number;

    switch (style) {
      case 'relaxed':
        // Gentle upward slope, capped low
        d = 0.2 + 0.3 * t * pm;
        break;

      case 'steady':
        // Consistent linear increase
        d = 0.3 + 0.5 * t * pm;
        break;

      case 'hardcore':
        // Starts high, goes higher
        d = 0.6 + 0.35 * t * pm;
        break;

      case 'rollercoaster':
        // Sinusoidal oscillation with an upward trend
        d = 0.35 + 0.25 * t * pm + 0.2 * Math.sin(t * Math.PI * 4);
        break;

      default:
        d = 0.3 + 0.4 * t;
    }

    // Clamp to [0, 1]
    curve.push(Math.max(0, Math.min(1, d)));
  }

  return curve;
}

// ============================================================================
// Genre-Specific Data Generators (for non-Phaser renderers)
// ============================================================================

/**
 * Generate narrative game data (text adventure / detective)
 *
 * Architecture based on Edogawa Ranpo's detective fiction framework:
 * - Mystery structure: 谜团(incomprehensible event) → 调查(investigation) → 推理(deduction) → 真相(rational resolution)
 * - Each case is a self-contained "blueprint" with a specific crime trick (诡计)
 * - Scenes flow logically: each scene's choices are contextually tied to the current location/situation
 * - Clues form a coherent chain building toward the solution
 * - Criminal motives drawn from Ranpo's four categories: emotional, profit, abnormal psychology, conviction
 */
/**
 * Generate narrative game data (text adventure / detective)
 *
 * User choices consumed:
 * - worldDifference → primary template selection
 *     colors_alive: detective (visual clues, colorful crime scenes)
 *     sound_solid: escape_room (auditory puzzles, resonant spaces)
 *     memory_touch: identity (memory/self exploration)
 *     time_uneven: time_paradox (temporal puzzles)
 * - characterArchetype → protagonist role & available choices
 *     explorer: more investigation options, wider search paths
 *     guardian: protective choices, helps NPCs, unlocks trust-based clues
 *     fugitive: evasion options, risk-taking shortcuts
 *     collector: evidence-gathering focus, finds extra clues
 * - difficultyStyle → clue density & branching complexity
 *     relaxed: more hints, linear path  hardcore: fewer hints, more branches
 * - gamePace → scene count & text length
 *     fast: fewer scenes, brisk pacing  slow: more scenes, detailed descriptions
 * - chaosLevel → random events & unexpected twists during the story
 */
function generateNarrativeGameData(
  rand: () => number,
  choices: UserChoices,
): NarrativeGameData {
  // --- Template selection based on worldDifference (not random!) ---
  const WORLD_TO_TEMPLATE: Record<string, string> = {
    colors_alive:  'detective',     // Visual mysteries — colorful crime scenes
    sound_solid:   'escape_room',   // Auditory puzzles — resonant locked spaces
    memory_touch:  'identity',      // Memory exploration — who am I?
    time_uneven:   'time_paradox',  // Temporal puzzles — time loops
  };
  const template = WORLD_TO_TEMPLATE[choices.worldDifference] || 'detective';

  // ========================================================================
  // Case Blueprint System — Each case is a structured mystery with logical flow
  // ========================================================================

  // Pick a random helper
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => rand() - 0.5);

  // --- Detective Case Blueprints (based on Ranpo's 诡计分类) ---
  interface CaseBlueprint {
    // The core trick type (from Ranpo's 9 categories)
    trickCategory: string;
    // The victim
    victim: string;
    // The setting
    setting: string;
    // The criminal motive (Ranpo's 4 types: emotional, profit, abnormal_psychology, conviction)
    motiveType: string;
    motiveDetail: string;
    // The actual trick used
    trick: string;
    // Key clues that form a logical chain (ordered: discovery → connection → proof)
    clueChain: { name: string; description: string; where: string }[];
    // Suspects
    suspects: { name: string; role: string; alibi: string; suspicious: string }[];
    // The real culprit index in suspects array
    culpritIndex: number;
    // Act structure: each act is a sequence of scenes with context
    acts: {
      name: string;
      scenes: {
        location: string;
        description: string;
        background: string;
        contextChoices: { text: string; hint?: string }[];
        clueIndex?: number; // index into clueChain, if this scene reveals a clue
      }[];
    }[];
    // The revelation/ending text
    revelation: string;
  }

  function generateDetectiveCase(): CaseBlueprint {
    // --- Victim & Setting ---
    const victims = [
      { name: '陈教授', role: '大学教授', detail: '在书房里被发现身亡，门窗从内部反锁' },
      { name: '王总', role: '公司老板', detail: '在办公室的密码保险柜前倒下，现场没有他人痕迹' },
      { name: '李记者', role: '调查记者', detail: '在即将发布重大报道的前夜失踪' },
      { name: '赵医生', role: '外科医生', detail: '在自己的诊所里被发现中毒身亡' },
      { name: '孙画家', role: '著名画家', detail: '在画室里被发现死于利器伤，但凶器消失了' },
    ];
    const victimData = pick(victims);

    const settings = [
      { place: '老式洋楼', detail: '一栋建于民国时期的三层洋楼，走廊幽暗，木地板吱呀作响' },
      { place: '现代公寓', detail: '城市中心的高层公寓，电子门锁和监控系统一应俱全' },
      { place: '郊外别墅', detail: '远离市区的独栋别墅，暴风雨切断了所有通讯' },
      { place: '古镇旅馆', detail: '一座有百年历史的旅馆，青石板路延伸到深处' },
    ];
    const settingData = pick(settings);

    // --- Trick (based on Ranpo's classification) ---
    const tricks = [
      {
        category: '密室诡计',
        trick: '冰制门闩：凶手用冰块卡住门闩，离开后冰融化，门自动锁死',
        keyClue: '门缝下方有微量水渍',
        weaponClue: '房间温度异常偏高，有人动过暖气',
      },
      {
        category: '消失的凶器',
        trick: '冰制匕首：凶手用冰雕刻成尖锐利器行凶，之后融化消失',
        keyClue: '伤口边缘有冻伤痕迹',
        weaponClue: '厨房冰箱里发现异常形状的冰格',
      },
      {
        category: '时间诡计',
        trick: '声音伪造：凶手录制了受害者的声音定时播放，制造受害者还活着的假象',
        keyClue: '邻居听到的"对话"实际上每隔固定间隔重复',
        weaponClue: '房间内发现一个被藏起来的录音设备',
      },
      {
        category: '身份诡计',
        trick: '一人分饰两角：凶手利用化妆和服装在两个身份之间切换',
        keyClue: '两个"不同的人"从未同时出现过',
        weaponClue: '垃圾桶中发现了化妆棉和发胶残留',
      },
      {
        category: '心理诡计',
        trick: '神速杀人：发现者就是凶手，在众人破门的瞬间完成犯罪',
        keyClue: '第一个冲进房间的人衣袖上有难以察觉的血迹',
        weaponClue: '凶器是一把极小的剃刀，可以藏在手心',
      },
      {
        category: '机械装置',
        trick: '定时机关：利用水滴侵蚀木质支撑物来触发坠落的重物',
        keyClue: '天花板上有被水浸湿的木质结构',
        weaponClue: '在阁楼发现了盛水的容器和被腐蚀的绳索',
      },
    ];
    const trickData = pick(tricks);

    // --- Motive (from Ranpo's 4 categories) ---
    const motives = [
      { type: '情感犯罪', detail: '受害者多年前背叛了凶手的信任，凶手一直在筹划复仇' },
      { type: '利欲犯罪', detail: '受害者掌握着一份价值巨大的遗产，而凶手是唯一的继承障碍' },
      { type: '利欲犯罪', detail: '受害者发现了凶手的贪污证据，凶手为了保守秘密而杀人灭口' },
      { type: '情感犯罪', detail: '凶手因长期被受害者压制而产生了强烈的自卑感和报复心理' },
      { type: '异常心理', detail: '凶手视犯罪为一场智力游戏，享受设计完美犯罪的过程' },
      { type: '信念犯罪', detail: '凶手坚信受害者的行为伤害了无辜者，以"正义"之名行凶' },
    ];
    const motiveData = pick(motives);

    // --- Suspects ---
    const suspectPool = shuffle([
      { name: '张秘书', role: '受害者的私人秘书', alibi: '声称案发时在加班', suspicious: '案发前曾与受害者激烈争吵' },
      { name: '刘管家', role: '在这里工作了二十年的老管家', alibi: '声称一直在厨房准备晚餐', suspicious: '对家中的所有密道和机关了如指掌' },
      { name: '周律师', role: '受害者的私人律师', alibi: '声称当晚在律师事务所', suspicious: '最近频繁修改受害者的遗嘱' },
      { name: '吴教授', role: '受害者的大学同事', alibi: '声称当晚在参加学术会议', suspicious: '与受害者有未了结的学术恩怨' },
      { name: '林医生', role: '受害者的家庭医生', alibi: '声称在诊所值班', suspicious: '最清楚受害者的身体弱点' },
      { name: '何侄女', role: '受害者的远房侄女', alibi: '声称刚从外地赶来', suspicious: '是遗产的主要受益人之一' },
    ]);
    const suspects = suspectPool.slice(0, 3);
    const culpritIndex = Math.floor(rand() * 3);

    // --- Clue Chain (logical progression) ---
    const clueChain = [
      // Act 1 clues: discovery
      { name: '案发现场的异常', description: trickData.keyClue, where: '案发现场' },
      { name: '受害者的日程表', description: `${victimData.name}在案发前一天约见了${suspects[culpritIndex].name}`, where: '受害者的书桌' },
      // Act 2 clues: connection
      { name: '关键物证', description: trickData.weaponClue, where: '隐蔽角落' },
      { name: '目击证词的矛盾', description: `${suspects[culpritIndex].name}声称的不在场证明与监控时间不符`, where: '走访调查' },
      { name: '隐藏的动机', description: motiveData.detail, where: '深入调查' },
      // Act 3 clue: proof
      { name: '决定性证据', description: `在${suspects[culpritIndex].name}的物品中发现了与犯罪手法直接相关的痕迹`, where: '搜查' },
    ];

    // --- Act Structure ---
    const acts = [
      {
        name: '第一幕：发现',
        scenes: [
          {
            location: settingData.place,
            description: `${settingData.detail}。你接到报警电话赶到现场。${victimData.name}，${victimData.role}，${victimData.detail}。在场的有几个面色各异的人 —— ${suspects.map(s => s.name).join('、')}。`,
            background: 'dark',
            contextChoices: [
              { text: '先勘察案发现场', hint: '查看第一手证据' },
              { text: `询问发现者${suspects[0].name}`, hint: '了解发现经过' },
            ],
          },
          {
            location: '案发现场',
            description: `你仔细勘察案发现场。${victimData.detail}。你注意到房间的布局和物品摆放有些不自然 —— 某些细节似乎是刻意安排的。${trickData.keyClue}。这个细节引起了你的警觉。`,
            background: 'mystery',
            contextChoices: [
              { text: '拍照记录现场异常', hint: '保存第一条关键线索' },
              { text: '检查门窗的锁闭情况', hint: '了解犯罪的可能路径' },
            ],
            clueIndex: 0,
          },
          {
            location: '受害者的书桌',
            description: `你翻看${victimData.name}桌上的物品。一本翻开的日程本吸引了你的注意 —— 案发前一天，${victimData.name}与${suspects[culpritIndex].name}有过一次秘密会面。日程本旁边还有几封未拆开的信件。`,
            background: 'neutral',
            contextChoices: [
              { text: '仔细阅读日程本的近期记录', hint: '发现受害者的社交动向' },
              { text: '拆开那些未读的信件', hint: '可能包含重要信息' },
            ],
            clueIndex: 1,
          },
        ],
      },
      {
        name: '第二幕：调查',
        scenes: [
          {
            location: '走访',
            description: `你决定逐一询问在场的嫌疑人。\n\n${suspects[0].name}（${suspects[0].role}）—— ${suspects[0].alibi}。${suspects[0].suspicious}。\n\n${suspects[1].name}（${suspects[1].role}）—— ${suspects[1].alibi}。${suspects[1].suspicious}。\n\n${suspects[2].name}（${suspects[2].role}）—— ${suspects[2].alibi}。${suspects[2].suspicious}。\n\n每个人似乎都有嫌疑，但也都有不在场证明。`,
            background: 'tense',
            contextChoices: [
              { text: `深入调查${suspects[culpritIndex].name}的不在场证明`, hint: '核实最可疑的人' },
              { text: '调取监控录像核实时间线', hint: '用客观证据验证口供' },
              { text: `询问${suspects[(culpritIndex + 1) % 3].name}关于其他人的情况`, hint: '从侧面了解人际关系' },
            ],
          },
          {
            location: '隐蔽角落',
            description: `根据调查的方向，你在${settingData.place}的一个不起眼的角落发现了重要线索。${trickData.weaponClue}。这让你对犯罪手法有了新的认识 —— 凶手使用了一种巧妙的${trickData.category}。`,
            background: 'mystery',
            contextChoices: [
              { text: '用证物袋收集这些物证', hint: '保存关键证据' },
              { text: '在周围寻找更多相关痕迹', hint: '可能还有遗漏的细节' },
            ],
            clueIndex: 2,
          },
          {
            location: '外出走访',
            description: `你前往核实${suspects[culpritIndex].name}的不在场证明。经过多方查证，你发现了一个关键矛盾 —— ${suspects[culpritIndex].name}声称的时间线与监控记录不符。在监控缺失的那段时间里，${suspects[culpritIndex].name}完全有时间实施犯罪并返回。`,
            background: 'tense',
            contextChoices: [
              { text: '调查这段时间差的具体细节', hint: '缩小作案时间窗口' },
              { text: '了解其他人对此事的看法', hint: '寻找佐证' },
            ],
            clueIndex: 3,
          },
          {
            location: '深入调查',
            description: `随着调查深入，你逐渐拼凑出${suspects[culpritIndex].name}的犯罪动机。${motiveData.detail}。原来表面的平静之下，隐藏着如此深重的矛盾。这让一切都说得通了。`,
            background: 'warm',
            contextChoices: [
              { text: '收集能证明动机的书面证据', hint: '让推理有据可依' },
              { text: '找到能把动机和手法联系起来的证人', hint: '补齐推理链条' },
            ],
            clueIndex: 4,
          },
        ],
      },
      {
        name: '第三幕：推理与真相',
        scenes: [
          {
            location: '搜查',
            description: `你申请了搜查令，对${suspects[culpritIndex].name}的住所进行搜查。在衣柜的夹层/书架后面的暗格中，你发现了决定性的证据 —— ${clueChain[5].description}。所有的线索终于形成了一条完整的推理链。`,
            background: 'mystery',
            contextChoices: [
              { text: '整理所有证据，准备揭露真相', hint: '是时候了' },
            ],
            clueIndex: 5,
          },
          {
            location: '对质现场',
            description: `你把所有相关人员召集到一起。"各位，这个案子看似不可能，但真相只有一个。"\n\n你逐步展开推理：\n\n首先，案发现场的${clueChain[0].name}表明这不是一起普通的案件 —— ${clueChain[0].description}。\n\n其次，${clueChain[2].name}揭示了犯罪手法 —— 凶手使用了${trickData.category}：${trickData.trick}。\n\n最重要的是，${clueChain[3].name} —— ${clueChain[3].description}。\n\n"凶手就是你，${suspects[culpritIndex].name}。"`,
            background: 'bright',
            contextChoices: [
              { text: '等待凶手的反应', hint: '真相大白的时刻' },
            ],
          },
        ],
      },
    ];

    return {
      trickCategory: trickData.category,
      victim: victimData.name,
      setting: settingData.place,
      motiveType: motiveData.type,
      motiveDetail: motiveData.detail,
      trick: trickData.trick,
      clueChain,
      suspects,
      culpritIndex,
      acts,
      revelation: `${suspects[culpritIndex].name}沉默了许久，最终低下了头。"你说得对……是我做的。"\n\n${motiveData.detail}。而犯罪手法 —— ${trickData.trick} —— 正是这场精心策划的犯罪的核心。\n\n所有线索终于拼凑在一起。案件告破。`,
    };
  }

  // --- Escape Room Blueprint ---
  function generateEscapeRoomCase(): CaseBlueprint {
    const rooms = [
      {
        theme: '炼金术士的实验室',
        intro: '你醒来时发现自己被困在一间古老的实验室里。桌上散落着奇怪的瓶瓶罐罐，墙上刻满了炼金符号。门上有三道锁，每道锁需要不同的钥匙。',
        puzzles: [
          { room: '药剂架', desc: '实验室的药剂架上排列着各色液体，每个瓶子上标着不同的炼金符号。其中三个瓶子的颜色与墙上的符号对应。', key: '根据颜色顺序得到第一组数字' },
          { room: '天平装置', desc: '角落里有一台老式天平。左边放着一颗金属球，右边的托盘是空的。旁边散落着不同重量的砝码。', key: '平衡天平后底座弹出一把铜钥匙' },
          { room: '元素圆盘', desc: '地面中央嵌着一个可以旋转的圆盘，上面刻着四元素的符号——火、水、土、风。每个符号可以独立旋转。', key: '正确排列元素顺序触发机关' },
          { room: '镜子密室', desc: '一面巨大的镜子占据了整面墙。仔细观察，镜中反射的房间与真实房间有几处微妙的不同。', key: '找出镜中差异指向隐藏的暗格' },
          { room: '最终之门', desc: '三道锁的答案已经集齐。你将收集到的钥匙和密码依次使用。', key: '三道锁逐一开启' },
        ],
      },
      {
        theme: '钟表匠的阁楼',
        intro: '你被困在一间布满钟表的阁楼里。大大小小的时钟滴答作响，但每一个显示的时间都不同。门上有一个需要输入正确时间的密码锁。墙上的留言写着："当所有时钟指向同一时刻，出路便会显现。"',
        puzzles: [
          { room: '怀表工作台', desc: '工作台上有一只拆开的怀表和散落的齿轮零件。旁边的笔记本记录着修表的步骤，但最后一页被撕掉了。', key: '组装怀表后指针指向一个特定时间' },
          { room: '布谷鸟钟', desc: '墙上挂着一座大型布谷鸟钟，但布谷鸟不见了。钟的底部有一个小抽屉，上面的锁孔形状很特别。', key: '找到布谷鸟里藏着的纸条' },
          { room: '日晷与镜面', desc: '窗台上有一座微型日晷，旁边放着一面可调节角度的镜子。阳光透过窗户照进来。', key: '调整镜面角度让日晷显示正确时间' },
          { room: '音乐盒', desc: '角落的音乐盒只有转到特定的时间才会打开。盒子上刻着一首谜语诗。', key: '谜语的答案就是正确的时间' },
          { room: '密码锁', desc: '你终于知道了正确的时间。当所有线索指向同一个时刻，你走向门上的密码锁。', key: '输入正确时间，门锁开启' },
        ],
      },
    ];
    const roomData = pick(rooms);

    const clueChain = roomData.puzzles.map((p, i) => ({
      name: `谜题${i + 1}的答案`,
      description: p.key,
      where: p.room,
    }));

    const acts = [
      {
        name: '第一幕：困境',
        scenes: [
          {
            location: roomData.theme,
            description: roomData.intro,
            background: 'dark',
            contextChoices: [
              { text: '仔细观察房间的整体布局', hint: '了解全貌再行动' },
              { text: `走近${roomData.puzzles[0].room}查看`, hint: '从最近的线索开始' },
            ],
          },
          {
            location: roomData.puzzles[0].room,
            description: roomData.puzzles[0].desc,
            background: 'mystery',
            contextChoices: [
              { text: '动手尝试解开这个谜题', hint: '实践出真知' },
              { text: '先记下线索，看看其他区域', hint: '全局思考' },
            ],
            clueIndex: 0,
          },
        ],
      },
      {
        name: '第二幕：探索',
        scenes: [
          {
            location: roomData.puzzles[1].room,
            description: roomData.puzzles[1].desc,
            background: 'neutral',
            contextChoices: [
              { text: '仔细检查这个装置', hint: '可能需要之前的线索' },
              { text: '尝试不同的组合', hint: '排列组合找答案' },
            ],
            clueIndex: 1,
          },
          {
            location: roomData.puzzles[2].room,
            description: roomData.puzzles[2].desc,
            background: 'warm',
            contextChoices: [
              { text: '调整装置的位置和角度', hint: '精确操作' },
              { text: '回忆之前场景中是否有相关提示', hint: '联系各个线索' },
            ],
            clueIndex: 2,
          },
          {
            location: roomData.puzzles[3].room,
            description: roomData.puzzles[3].desc,
            background: 'mystery',
            contextChoices: [
              { text: '仔细解读上面的文字', hint: '答案就在谜面中' },
              { text: '结合之前的发现推理', hint: '综合所有线索' },
            ],
            clueIndex: 3,
          },
        ],
      },
      {
        name: '第三幕：脱出',
        scenes: [
          {
            location: roomData.puzzles[4].room,
            description: roomData.puzzles[4].desc,
            background: 'bright',
            contextChoices: [
              { text: '使用收集到的所有线索', hint: '最终一步' },
            ],
            clueIndex: 4,
          },
        ],
      },
    ];

    return {
      trickCategory: '密室机关', victim: '', setting: roomData.theme,
      motiveType: '', motiveDetail: '',
      trick: roomData.theme, clueChain,
      suspects: [], culpritIndex: -1, acts,
      revelation: `最后的机关被你破解了。门缓缓打开，光线涌入这间${roomData.theme}。你长舒一口气——自由了。\n\n你回头看了一眼这个精巧的房间，不禁对设计者的匠心感到敬佩。`,
    };
  }

  // --- Time Paradox Blueprint ---
  function generateTimeParadoxCase(): CaseBlueprint {
    const paradoxes = [
      {
        core: '因果循环',
        intro: '你手中的怀表突然剧烈震动。当你回过神来，发现自己站在一条陌生的街道上。路牌上的日期是——三天前。你清楚地记得三天前发生了一起事故，而你现在有机会改变它。但每次你试图改变什么，新的问题就会出现。',
        nodes: [
          { loc: '事故前的街道', desc: '三天前的街道上，一切看起来那么平常。行人匆匆走过，没有人注意到你不属于这个时间。你知道两小时后，在前方的十字路口会发生一起严重事故。', bg: 'neutral' },
          { loc: '第一次干预', desc: '你试图阻止事故的发生。你挡在了关键人物面前，改变了他的行走路线。但当你以为一切都改变了的时候，怀表再次震动——你发现事故以另一种方式发生了，只是受害者变成了不同的人。', bg: 'tense' },
          { loc: '时间裂缝', desc: '怀表上出现了一道裂缝，你透过裂缝看到了多条时间线重叠的景象。在每一条时间线中，事故都会发生，只是形式不同。你开始理解——这不是一个可以简单"阻止"的事件。', bg: 'eerie' },
          { loc: '线索浮现', desc: '你注意到在所有时间线中，有一个共同元素——一个戴帽子的身影总是出现在事故现场附近。这个人似乎也在操纵时间。', bg: 'mystery' },
          { loc: '对峙', desc: '你追踪那个神秘的身影，最终在一个时间停滞的空间里与他面对面。"你终于发现了，"他说，"这个循环不是偶然的——是我创造的。因为在原始时间线中，你才是那起事故的受害者。我一直在试图救你。"', bg: 'bright' },
        ],
        revelation: '原来，操纵时间的神秘人是未来的你自己。为了拯救过去的自己，你/他创造了这个因果循环。唯一打破循环的方式不是阻止事故，而是接受它并找到一种不需要时间旅行也能存活的方法。\n\n你合上怀表，指针终于恢复了正常的走动。',
      },
      {
        core: '记忆悖论',
        intro: '你在一间空白的房间里醒来。墙上写着一行字："你已经来过这里137次了。"你完全不记得之前的到访。但在房间角落，你发现了一本笔记——上面是你的笔迹，密密麻麻地记录着每次循环的经历。',
        nodes: [
          { loc: '第137次循环', desc: '根据笔记的记录，每次循环你都会失去所有记忆。但这一次不同——你找到了笔记。上面写着之前136次尝试的摘要，包括失败的原因和新发现的线索。', bg: 'mystery' },
          { loc: '笔记中的规律', desc: '翻阅笔记，你发现了一个规律：每次循环中，房间里的某个物品会发生微妙的变化。第1次是一把椅子，第50次是天花板的裂缝，第100次是灯光的颜色。这些变化似乎在指向某个方向。', bg: 'neutral' },
          { loc: '隐藏的门', desc: '根据变化的规律，你推算出第137次循环的变化应该出现在——地板上。果然，你发现了一块可以活动的地砖，下面隐藏着一个小空间。', bg: 'warm' },
          { loc: '时间锚点', desc: '小空间里有一个奇怪的装置，上面标着"时间锚"。旁边有一段你此前的笔迹写道："在第137次循环中，锚点终于充满了能量。使用它可以固定这条时间线。"', bg: 'bright' },
          { loc: '觉醒', desc: '你启动了时间锚。整个房间剧烈震动，墙上的"137"数字开始闪烁，然后慢慢消失。你感到记忆正在回流——不是之前循环的记忆，而是属于你最初人生的真实记忆。', bg: 'bright' },
        ],
        revelation: '时间锚固定了这条时间线。房间的墙壁逐渐变得透明，你发现自己一直身处一个时间实验舱中。137次循环是实验的一部分，而你终于通过了测试。\n\n门打开了。外面的世界与你记忆中的不同——更美好了一些。也许这就是137次循环的意义。',
      },
    ];
    const paradoxData = pick(paradoxes);

    const clueChain = paradoxData.nodes.map((n, i) => ({
      name: `时间线索${i + 1}`,
      description: `在${n.loc}发现的关键信息`,
      where: n.loc,
    }));

    const acts = [
      {
        name: '第一幕：时间异变',
        scenes: [
          {
            location: '时间起点',
            description: paradoxData.intro,
            background: 'eerie' as const,
            contextChoices: [
              { text: '检查手中的怀表', hint: '时间的钥匙' },
              { text: '观察周围的环境', hint: '寻找时间扭曲的线索' },
            ],
          },
          {
            location: paradoxData.nodes[0].loc,
            description: paradoxData.nodes[0].desc,
            background: paradoxData.nodes[0].bg,
            contextChoices: [
              { text: '尝试改变已知的事件', hint: '主动干预' },
              { text: '先观察，不要轻举妄动', hint: '谨慎行事' },
            ],
            clueIndex: 0,
          },
        ],
      },
      {
        name: '第二幕：时间探索',
        scenes: paradoxData.nodes.slice(1, 4).map((n, i) => ({
          location: n.loc,
          description: n.desc,
          background: n.bg,
          contextChoices: [
            { text: '深入探索这条线索', hint: '追根究底' },
            { text: '记录发现，继续前进', hint: '保持节奏' },
          ],
          clueIndex: i + 1,
        })),
      },
      {
        name: '第三幕：打破循环',
        scenes: [
          {
            location: paradoxData.nodes[4].loc,
            description: paradoxData.nodes[4].desc,
            background: paradoxData.nodes[4].bg,
            contextChoices: [
              { text: '做出最终的选择', hint: '一切的终点' },
            ],
            clueIndex: 4,
          },
        ],
      },
    ];

    return {
      trickCategory: '时间诡计', victim: '', setting: paradoxData.core,
      motiveType: '', motiveDetail: '',
      trick: paradoxData.core, clueChain,
      suspects: [], culpritIndex: -1, acts,
      revelation: paradoxData.revelation,
    };
  }

  // --- Identity Blueprint ---
  function generateIdentityCase(): CaseBlueprint {
    const identities = [
      {
        core: '双重人格',
        intro: '你在一间医院的走廊里醒来，穿着病号服。护士叫你"林先生"，但这个名字对你来说毫无意义。你的口袋里只有两样东西：一把钥匙和一张纸条，上面写着一个地址。更奇怪的是——你的左手写满了字，全是你的笔迹，但内容你完全不记得写过。',
        nodes: [
          { loc: '医院', desc: '你询问护士自己的情况。她说你因为"急性记忆障碍"被送来，是一个叫"周小姐"的人签的入院手续。但医院的访客记录上，从来没有人来探望过你。你手上的字写着："不要相信医院里的人。去纸条上的地址。"', bg: 'neutral' },
          { loc: '纸条上的地址', desc: '你逃出医院，按照地址找到了一间公寓。钥匙能打开门。公寓里的一切井然有序，墙上挂着你的照片——但照片里的你穿着西装，笑容自信，与你现在的感觉完全不同。书架上有一本日记，前半部分的字迹工整自信，后半部分变得潦草恐惧。', bg: 'mystery' },
          { loc: '公寓', desc: '日记的最后几页透露了震惊的信息："我发现了另一个我。他在夜里出现，做了我不知道的事。我开始失去对自己身体的控制。"日记最后一行是用不同的笔迹写的——"你太弱了。该让我来了。"', bg: 'tense' },
          { loc: '心理诊所', desc: '日记里提到了一个心理医生的名字。你找到了他的诊所。医生见到你时非常惊讶："你不是上周刚来过吗？那时候你的状态……完全不一样。"他打开你的病历，犹豫了一下，然后告诉你一个你不愿意面对的事实。', bg: 'warm' },
          { loc: '内心', desc: '在医生的引导下，你开始面对内心深处的真相。那个"另一个你"不是别人——是你为了保护自己而创造的人格。在一次巨大的创伤后，你的意识分裂了。现在，两个人格都想成为"唯一的你"。', bg: 'bright' },
        ],
        revelation: '你最终选择不是消灭另一个人格，而是与他对话。在心理医生的帮助下，你们达成了和解。\n\n"我们都是你，"你对镜子里的自己说，"从今以后，一起面对吧。"\n\n镜子里的倒影微微点了点头。记忆开始缓缓回流。',
      },
      {
        core: '身份替换',
        intro: '你在一个陌生城市的街头醒来。你有完整的记忆——你知道自己的名字、职业和家庭。但当你回到"家"时，一个陌生人开了门，声称这是他的家。你去公司上班，前台说没有你这个员工。更可怕的是，你查到了一个与你同名同姓的人——他长着另一张脸，但拥有你所有的证件和社会关系。',
        nodes: [
          { loc: '警察局', desc: '你去报警，但警察对照你的身份信息后，电脑里显示的照片是另一个人的脸。在他们看来，你才是那个"冒充者"。你被"请"出了警局，临走时一个年轻警察塞给你一张名片，低声说："我见过类似的案子。"', bg: 'tense' },
          { loc: '年轻警察的线索', desc: '你联系了那个年轻警察。他告诉你，三个月前有一起类似的案件——一个人声称自己的身份被别人"偷走"了，但最后被定性为精神疾病。那个人留下了一份调查笔记，藏在某个公共寄存柜里。', bg: 'mystery' },
          { loc: '寄存柜', desc: '你找到了那份笔记。上面详细记录了"身份替换"的操作方式：一个地下组织专门为有需要的人伪造新身份，代价是——必须有一个真实的人来"让出"身份。他们通过药物造成目标的短暂失忆，然后在这段时间里完成证件和社会关系的转移。', bg: 'dark' },
          { loc: '地下诊所', desc: '笔记中提到了一个地下诊所的地址。你潜入后发现了大量的身份文件和医疗记录。在文件堆中，你找到了自己的名字——旁边标注着"替换完成"和一个日期。更重要的是，你发现了指使这一切的幕后人身份。', bg: 'eerie' },
          { loc: '对质', desc: '你带着证据找到了那个冒用你身份的人。面对面时，你发现他看起来……疲惫而恐惧。"你以为是我选择了这个身份？"他说，"我也是受害者。他们告诉我，如果我不配合，我原来的身份就会永远消失。"', bg: 'bright' },
        ],
        revelation: '真相远比你想象的复杂。那个地下组织不仅仅是在"替换"身份——他们在编织一张更大的网。你和那个"替代者"决定联手，用各自手中的证据揭露这个组织。\n\n当你最终拿回自己的身份时，你对镜子里的自己说："无论别人怎么定义我，我知道自己是谁。"',
      },
    ];
    const identityData = pick(identities);

    const clueChain = identityData.nodes.map((n, i) => ({
      name: `身份线索${i + 1}`,
      description: `在${n.loc}发现的关于真实身份的信息`,
      where: n.loc,
    }));

    const acts = [
      {
        name: '第一幕：迷失',
        scenes: [
          {
            location: '觉醒',
            description: identityData.intro,
            background: 'dark' as const,
            contextChoices: [
              { text: '检查自己身上的物品', hint: '从自身开始寻找线索' },
              { text: '试着回忆最后的记忆', hint: '追溯时间线' },
            ],
          },
          {
            location: identityData.nodes[0].loc,
            description: identityData.nodes[0].desc,
            background: identityData.nodes[0].bg,
            contextChoices: [
              { text: '按照找到的线索继续调查', hint: '不要放弃' },
              { text: '寻找更多能证明身份的方式', hint: '多方验证' },
            ],
            clueIndex: 0,
          },
        ],
      },
      {
        name: '第二幕：追寻',
        scenes: identityData.nodes.slice(1, 4).map((n, i) => ({
          location: n.loc,
          description: n.desc,
          background: n.bg,
          contextChoices: [
            { text: '深入调查这条线索', hint: '追寻真相' },
            { text: '小心行动，可能有危险', hint: '保护自己' },
          ],
          clueIndex: i + 1,
        })),
      },
      {
        name: '第三幕：真相',
        scenes: [
          {
            location: identityData.nodes[4].loc,
            description: identityData.nodes[4].desc,
            background: identityData.nodes[4].bg,
            contextChoices: [
              { text: '面对真相，做出选择', hint: '最终的答案' },
            ],
            clueIndex: 4,
          },
        ],
      },
    ];

    return {
      trickCategory: '身份诡计', victim: '', setting: identityData.core,
      motiveType: '', motiveDetail: '',
      trick: identityData.core, clueChain,
      suspects: [], culpritIndex: -1, acts,
      revelation: identityData.revelation,
    };
  }

  // ========================================================================
  // Build the narrative from the selected blueprint
  // ========================================================================

  let blueprint: CaseBlueprint;
  switch (template) {
    case 'detective':
      blueprint = generateDetectiveCase();
      break;
    case 'escape_room':
      blueprint = generateEscapeRoomCase();
      break;
    case 'time_paradox':
      blueprint = generateTimeParadoxCase();
      break;
    case 'identity':
      blueprint = generateIdentityCase();
      break;
    default:
      blueprint = generateDetectiveCase();
  }

  // --- Archetype-based bonus choices ---
  // Each archetype adds a unique perspective choice to investigation scenes
  const ARCHETYPE_BONUS: Record<string, { text: string; hint: string; effect: string }> = {
    explorer:  { text: '搜索隐藏的通道和暗格', hint: '你的探索直觉告诉你这里有秘密', effect: 'find_hidden:+15' },
    guardian:  { text: '安慰在场的相关人员', hint: '建立信任可能让他们说出真相', effect: 'change_trust:+20' },
    fugitive:  { text: '冒险潜入禁区查看', hint: '高风险但可能获得关键证据', effect: 'risk_reward:+25' },
    collector: { text: '仔细收集并整理所有物证', hint: '你的收集能力让你发现被忽视的细节', effect: 'extra_clue:+10' },
  };
  const bonusChoice = ARCHETYPE_BONUS[choices.characterArchetype];

  // --- Difficulty affects hint visibility ---
  const showHints = choices.difficultyStyle === 'relaxed' || choices.difficultyStyle === 'steady';

  // --- Pace affects scene trimming ---
  // Fast pace: skip some middle scenes; Slow pace: keep all scenes
  const PACE_SCENE_KEEP: Record<string, number> = {
    fast:   0.7,  // Keep 70% of scenes (skip some investigation)
    medium: 0.85, // Keep 85%
    slow:   1.0,  // Keep all
  };
  const sceneKeepRate = PACE_SCENE_KEEP[choices.gamePace] || 0.85;

  // Convert blueprint into NarrativeNode[]
  const nodes: NarrativeNode[] = [];
  let sceneCounter = 0;

  // Flatten all scenes from all acts with proper linking
  const allScenes: { scene: CaseBlueprint['acts'][0]['scenes'][0]; id: string }[] = [];

  for (const act of blueprint.acts) {
    for (const scene of act.scenes) {
      // Fast pace: randomly skip some non-essential middle scenes (never first/last of act)
      const isFirstOrLastInAct = scene === act.scenes[0] || scene === act.scenes[act.scenes.length - 1];
      if (!isFirstOrLastInAct && rand() > sceneKeepRate) continue;

      const id = sceneCounter === 0 ? 'start' : `scene_${sceneCounter}`;
      allScenes.push({ scene, id });
      sceneCounter++;
    }
  }

  // Create nodes from scenes
  for (let i = 0; i < allScenes.length; i++) {
    const { scene, id } = allScenes[i];
    const isLast = i === allScenes.length - 1;
    const nextId = isLast ? 'ending' : allScenes[i + 1].id;

    // Build choices from context — each choice is tied to the scene's content
    const nodeChoices: NarrativeNodeChoice[] = scene.contextChoices.map((c, j) => {
      // First choice always advances to next scene; additional choices can branch or loop
      const targetId = j === 0 ? nextId : (i + 2 < allScenes.length ? allScenes[i + 2].id : nextId);
      return {
        text: c.text + (showHints && c.hint ? ` (${c.hint})` : ''),
        nextNodeId: j === 0 ? nextId : targetId,
        effect: j === 0 && rand() > 0.7 ? 'change_trust:+10' : undefined,
      };
    });

    // Add archetype bonus choice in investigation scenes (Acts 1-2, not endings)
    if (bonusChoice && !isLast && i > 0 && i < allScenes.length - 2 && rand() > 0.4) {
      const bonusTarget = i + 1 < allScenes.length ? allScenes[Math.min(i + 1, allScenes.length - 1)].id : nextId;
      nodeChoices.push({
        text: bonusChoice.text + (showHints ? ` (${bonusChoice.hint})` : ''),
        nextNodeId: bonusTarget,
        effect: bonusChoice.effect,
      });
    }

    // Determine clue for this scene
    const clue = scene.clueIndex !== undefined && scene.clueIndex < blueprint.clueChain.length
      ? `${blueprint.clueChain[scene.clueIndex].name}：${blueprint.clueChain[scene.clueIndex].description}`
      : undefined;

    // Chaos: random events in some scenes
    let text = scene.description;
    if (choices.chaosLevel >= 3 && rand() > 0.7 && !isLast) {
      const chaosEvents = [
        '\n\n【突发事件】突然停电了，黑暗中你听到一阵急促的脚步声。',
        '\n\n【突发事件】你的手机收到了一条匿名短信："别再查了。"',
        '\n\n【突发事件】一阵诡异的风吹过，桌上的纸张被吹散。你注意到其中一张纸的背面有手写的字。',
        '\n\n【突发事件】窗外传来一声巨响，像是什么东西摔碎了。',
      ];
      text += pick(chaosEvents);
    }

    nodes.push({
      id,
      text,
      background: scene.background,
      choices: nodeChoices,
      clue,
    });
  }

  // Ending node
  nodes.push({
    id: 'ending',
    text: blueprint.revelation,
    background: 'ending',
    choices: [],
    flags: ['ending'],
  });

  return {
    nodes,
    startNodeId: 'start',
    template,
  };
}

/**
 * Generate card game data
 *
 * User choices consumed:
 * - characterArchetype → deck composition & play style
 *     explorer: draw/mana-heavy (card advantage), guardian: heal/buff-heavy (defense),
 *     fugitive: debuff/damage-heavy (aggro/control), collector: balanced with bonus resources
 * - difficultyStyle → enemy strength & HP
 *     relaxed: weak enemy, steady: balanced, hardcore: tough enemy, rollercoaster: random swings
 * - gamePace → starting mana & hand size
 *     fast: 4 mana + 5 cards, medium: 3 mana + 4 cards, slow: 2 mana + 3 cards
 * - worldDifference → card names & visual theme (flavor)
 * - visualStyle → card colors
 * - customElement → generates a unique special card added to player deck
 * - chaosLevel → legendary card frequency & cost variance
 * - skillLuckRatio → rarity distribution (more skill = more commons, more luck = more legendaries)
 */
function generateCardGameData(
  rand: () => number,
  choices: UserChoices,
): CardGameData {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  // --- Theme based on worldDifference ---
  const THEMES: Record<string, {
    damage: string[]; heal: string[]; draw: string[];
    gain_mana: string[]; buff: string[]; debuff: string[];
    enemies: string[];
    colors: Record<string, string>;
  }> = {
    colors_alive: {
      damage: ['虹光射线', '棱镜爆破', '色彩风暴', '彩虹冲击', '光谱斩', '幻彩飞弹', '极光之矛', '荧光打击'],
      heal: ['调色修复', '彩虹祝福', '光谱治愈', '颜料之泉'],
      draw: ['灵感画卷', '调色板', '色彩冥想'],
      gain_mana: ['虹光水晶', '棱镜充能', '彩色冥想'],
      buff: ['红色狂暴', '金色护盾', '蓝色专注'],
      debuff: ['灰色褪色', '色盲诅咒', '暗淡封印'],
      enemies: ['灰暗吞噬者', '色彩掠夺者', '单色暴君', '褪色之主', '黑白裁判'],
      colors: { damage: '#ff6b6b', heal: '#51cf66', draw: '#339af0', gain_mana: '#cc5de8', buff: '#fcc419', debuff: '#868e96' },
    },
    sound_solid: {
      damage: ['音波冲击', '共鸣爆破', '声纳攻击', '超声波斩', '重低音击', '噪音风暴', '频率之刃', '回响打击'],
      heal: ['治愈旋律', '和弦修复', '宁静乐章', '摇篮之歌'],
      draw: ['灵感旋律', '即兴演奏', '乐谱翻阅'],
      gain_mana: ['音叉充能', '共鸣聚能', '静默冥想'],
      buff: ['战鼓增幅', '号角鼓舞', '和声护盾'],
      debuff: ['噪音干扰', '失调诅咒', '静默封印'],
      enemies: ['噪音魔王', '失调指挥', '不和谐巨人', '沉默暴君', '刺耳女妖'],
      colors: { damage: '#f06595', heal: '#20c997', draw: '#4dabf7', gain_mana: '#845ef7', buff: '#fab005', debuff: '#adb5bd' },
    },
    memory_touch: {
      damage: ['记忆碎片', '回忆冲击', '往事之痛', '遗忘射线', '时光裂隙', '记忆洪流', '灵魂触碰', '心灵打击'],
      heal: ['温暖回忆', '童年治愈', '思念之光', '记忆补全'],
      draw: ['回忆涌现', '灵魂搜索', '冥想回溯'],
      gain_mana: ['记忆之泉', '灵魂充能', '专注凝聚'],
      buff: ['执念强化', '铭记护盾', '信念增幅'],
      debuff: ['遗忘诅咒', '记忆混乱', '失忆封印'],
      enemies: ['遗忘之兽', '记忆吞噬者', '虚无幽灵', '混沌思维', '记忆篡改者'],
      colors: { damage: '#e599f7', heal: '#63e6be', draw: '#74c0fc', gain_mana: '#b197fc', buff: '#ffe066', debuff: '#ced4da' },
    },
    time_uneven: {
      damage: ['时间加速', '时停打击', '因果逆转', '时间裂缝', '永恒之矛', '瞬间爆发', '时间碎片', '未来冲击'],
      heal: ['时光倒流', '修复过去', '时间缝合', '永恒之泉'],
      draw: ['预知未来', '时间透视', '命运之眼'],
      gain_mana: ['时间凝缩', '瞬间永恒', '时间晶体'],
      buff: ['加速光环', '时间护盾', '预知防御'],
      debuff: ['时间减速', '老化诅咒', '时停封印'],
      enemies: ['时间守卫', '因果之主', '永恒看门人', '时间悖论', '末日钟摆'],
      colors: { damage: '#ff8787', heal: '#38d9a9', draw: '#4dabf7', gain_mana: '#9775fa', buff: '#ffd43b', debuff: '#dee2e6' },
    },
  };

  const theme = THEMES[choices.worldDifference] || THEMES.colors_alive;

  // --- Archetype determines deck composition weights ---
  // Each array: [damage, heal, draw, gain_mana, buff, debuff] relative weights
  const ARCHETYPE_WEIGHTS: Record<string, number[]> = {
    explorer:   [2, 1, 4, 3, 1, 1],  // Draw & mana heavy — card advantage strategy
    guardian:   [2, 4, 1, 1, 3, 1],  // Heal & buff heavy — outlast strategy
    fugitive:   [4, 1, 1, 1, 1, 4],  // Damage & debuff heavy — aggro/control
    collector:  [2, 2, 2, 3, 2, 1],  // Balanced with extra mana — resource strategy
  };

  const weights = ARCHETYPE_WEIGHTS[choices.characterArchetype] || ARCHETYPE_WEIGHTS.explorer;
  const effectTypes = ['damage', 'heal', 'draw', 'gain_mana', 'buff', 'debuff'];

  // Build weighted effect pool
  const effectPool: string[] = [];
  for (let e = 0; e < effectTypes.length; e++) {
    for (let w = 0; w < weights[e]; w++) {
      effectPool.push(effectTypes[e]);
    }
  }

  // --- Difficulty affects enemy stats ---
  const DIFFICULTY_TUNING: Record<string, { enemyHp: number; enemyDeckSize: number; enemyExtra: string[]; playerHp: number }> = {
    relaxed:       { enemyHp: 20, enemyDeckSize: 15, enemyExtra: ['damage', 'heal'],          playerHp: 35 },
    steady:        { enemyHp: 28, enemyDeckSize: 20, enemyExtra: ['damage', 'heal', 'buff'],  playerHp: 30 },
    hardcore:      { enemyHp: 35, enemyDeckSize: 25, enemyExtra: ['damage', 'buff', 'debuff'], playerHp: 25 },
    rollercoaster: { enemyHp: 30, enemyDeckSize: 22, enemyExtra: ['damage', 'damage', 'buff', 'debuff', 'heal'], playerHp: 28 },
  };
  const diffTuning = DIFFICULTY_TUNING[choices.difficultyStyle] || DIFFICULTY_TUNING.steady;

  // --- Pace affects starting resources ---
  const PACE_TUNING: Record<string, { startMana: number; handSize: number; maxMana: number }> = {
    fast:   { startMana: 4, handSize: 5, maxMana: 12 },
    medium: { startMana: 3, handSize: 4, maxMana: 10 },
    slow:   { startMana: 2, handSize: 3, maxMana: 8 },
  };
  const paceTuning = PACE_TUNING[choices.gamePace] || PACE_TUNING.medium;

  // --- Skill/Luck ratio affects rarity distribution ---
  const RARITY_THRESHOLDS: Record<string, { legendary: number; rare: number; uncommon: number }> = {
    pure_skill:   { legendary: 0.98, rare: 0.88, uncommon: 0.60 }, // Mostly commons — predictable
    skill_heavy:  { legendary: 0.95, rare: 0.82, uncommon: 0.55 },
    balanced:     { legendary: 0.90, rare: 0.70, uncommon: 0.40 },
    luck_heavy:   { legendary: 0.80, rare: 0.55, uncommon: 0.30 }, // More legendaries — swingy
  };
  const rarityThresh = RARITY_THRESHOLDS[choices.skillLuckRatio] || RARITY_THRESHOLDS.balanced;

  // --- Chaos level affects cost variance & legendary frequency ---
  const chaosMultiplier = 1 + (choices.chaosLevel / 5) * 0.5; // 0→1, 5→1.5

  // --- Card maker ---
  const makeCard = (effect: string, i: number, forEnemy = false): CardDef => {
    const names = theme[effect as keyof typeof theme];
    const nameList = Array.isArray(names) ? names as string[] : theme.damage;
    const name = nameList[Math.floor(rand() * nameList.length)];

    const rarityRoll = rand();
    const rarity: CardDef['rarity'] =
      rarityRoll > rarityThresh.legendary ? 'legendary' :
      rarityRoll > rarityThresh.rare ? 'rare' :
      rarityRoll > rarityThresh.uncommon ? 'uncommon' : 'common';
    const rarityMultiplier = { common: 1, uncommon: 1.3, rare: 1.6, legendary: 2.2 }[rarity];

    // Chaos adds variance
    const costVariance = Math.floor(rand() * chaosMultiplier);

    let cost: number;
    let value: number;

    switch (effect) {
      case 'damage':
        cost = Math.max(1, 1 + Math.floor(rand() * 4) + costVariance);
        value = Math.floor((2 + rand() * 4) * rarityMultiplier);
        break;
      case 'heal':
        cost = Math.max(1, 1 + Math.floor(rand() * 3) + costVariance);
        value = Math.floor((3 + rand() * 3) * rarityMultiplier);
        break;
      case 'draw':
        cost = Math.max(1, 1 + Math.floor(rand() * 2));
        value = 1 + Math.floor(rand() * 2 * rarityMultiplier);
        break;
      case 'gain_mana':
        cost = 0;
        value = 1 + Math.floor(rand() * 2 * rarityMultiplier);
        break;
      case 'buff':
        cost = Math.max(1, 2 + Math.floor(rand() * 2) + costVariance);
        value = Math.floor((2 + rand() * 3) * rarityMultiplier);
        break;
      case 'debuff':
        cost = Math.max(1, 2 + Math.floor(rand() * 3));
        value = Math.floor((2 + rand() * 2) * rarityMultiplier);
        break;
      default:
        cost = 2;
        value = 3;
    }

    const colors = theme.colors;
    const descMap: Record<string, string> = {
      damage: `造成 ${value} 点伤害`,
      heal: `恢复 ${value} 点生命`,
      draw: `抽 ${value} 张牌`,
      gain_mana: `获得 ${value} 点法力`,
      buff: `下次攻击 +${value}`,
      debuff: `削弱敌人 ${value} 点`,
    };

    return {
      id: `card_${forEnemy ? 'e' : 'p'}_${effect}_${i}`,
      name: `${name}${rarity === 'legendary' ? ' EX' : rarity === 'rare' ? '+' : ''}`,
      cost,
      effect,
      value,
      description: descMap[effect] || `效果值 ${value}`,
      rarity,
      color: colors[effect as keyof typeof colors] || '#aaaaaa',
    };
  };

  // --- Build player deck (archetype-weighted) ---
  const deckSize = 25 + Math.floor(rand() * 6);
  const playerDeck: CardDef[] = [];
  for (let i = 0; i < deckSize; i++) {
    const effect = effectPool[Math.floor(rand() * effectPool.length)];
    playerDeck.push(makeCard(effect, i));
  }

  // --- Custom element: generate a unique signature card ---
  if (choices.customElement && choices.customElement.trim()) {
    const customName = choices.customElement.trim().slice(0, 12);
    const customCard: CardDef = {
      id: 'card_custom_special',
      name: `✦ ${customName}`,
      cost: 2,
      effect: 'damage',
      value: Math.floor(8 * chaosMultiplier),
      description: `${customName}的力量！造成 ${Math.floor(8 * chaosMultiplier)} 点伤害并抽1张牌`,
      rarity: 'legendary',
      color: '#ffd700',
    };
    playerDeck.unshift(customCard); // Put it at the front so player sees it early
  }

  // --- Enemy deck (uses difficulty tuning) ---
  const enemyEffects = diffTuning.enemyExtra;
  const enemyDeck: CardDef[] = [];
  for (let i = 0; i < diffTuning.enemyDeckSize; i++) {
    const effect = enemyEffects[Math.floor(rand() * enemyEffects.length)];
    enemyDeck.push(makeCard(effect, i + 100, true));
  }

  // Hardcore enemies get bonus high-value damage cards
  if (choices.difficultyStyle === 'hardcore') {
    for (let i = 0; i < 3; i++) {
      const bonusCard = makeCard('damage', 200 + i, true);
      bonusCard.value = Math.floor(bonusCard.value * 1.5);
      bonusCard.description = `造成 ${bonusCard.value} 点伤害`;
      enemyDeck.push(bonusCard);
    }
  }

  return {
    playerDeck,
    enemyDeck,
    playerHp: diffTuning.playerHp,
    enemyHp: diffTuning.enemyHp + Math.floor(rand() * 8),
    startingMana: paceTuning.startMana,
    maxMana: paceTuning.maxMana,
    handSize: paceTuning.handSize,
    enemyName: pick(theme.enemies),
  };
}

/**
 * Generate board / tactics game data
 *
 * User choices consumed:
 * - worldDifference → terrain distribution & visual theme
 *     colors_alive: more forests & plains (lush), sound_solid: more mountains (resonant caves),
 *     memory_touch: more water (reflective), time_uneven: more lava & mixed (unstable)
 * - characterArchetype → player piece composition & stats
 *     explorer: mobile units (scouts, cavalry), guardian: tanky units (knights, shields),
 *     fugitive: ranged/stealth units (archers, assassins), collector: support units (healers, mages)
 * - difficultyStyle → enemy count, stats, AI aggressiveness
 *     relaxed: fewer/weaker enemies, hardcore: more/stronger enemies with specials
 * - gamePace → turn limit & board size
 *     fast: 6×6 + 15 turns, medium: 8×8 + 25 turns, slow: 10×10 + no limit
 * - chaosLevel → terrain randomness & special terrain frequency
 * - customElement → names a custom unit type added to player army
 */
function generateBoardGameData(
  rand: () => number,
  choices: UserChoices,
): BoardGameData {
  // --- Board size from pace ---
  const PACE_BOARD: Record<string, { w: number; h: number; turnLimit?: number }> = {
    fast:   { w: 6, h: 6, turnLimit: 15 },
    medium: { w: 8, h: 8, turnLimit: 25 },
    slow:   { w: 10, h: 10 },
  };
  const boardConfig = PACE_BOARD[choices.gamePace] || PACE_BOARD.medium;
  const boardW = boardConfig.w;
  const boardH = boardConfig.h;

  // --- Terrain distribution from worldDifference ---
  // Each array: [plain%, forest%, mountain%, water%, lava%] thresholds (cumulative)
  const TERRAIN_DIST: Record<string, number[]> = {
    colors_alive:  [0.55, 0.80, 0.90, 0.97, 1.00],  // Lush: lots of forest
    sound_solid:   [0.45, 0.60, 0.85, 0.95, 1.00],  // Mountainous: lots of mountains
    memory_touch:  [0.50, 0.65, 0.78, 0.95, 1.00],  // Reflective: lots of water
    time_uneven:   [0.40, 0.55, 0.70, 0.85, 1.00],  // Chaotic: more lava & mixed
  };
  const dist = TERRAIN_DIST[choices.worldDifference] || TERRAIN_DIST.colors_alive;

  // Chaos increases randomness in terrain
  const chaosTerrainBoost = choices.chaosLevel * 0.03; // 0→0, 5→0.15

  const terrain: TerrainType[][] = [];
  const terrainTypes: TerrainType[] = ['plain', 'forest', 'mountain', 'water', 'lava'];

  for (let y = 0; y < boardH; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < boardW; x++) {
      const r = rand();
      // Shift thresholds by chaos (more chaos = more special terrain)
      let picked: TerrainType = 'plain';
      for (let t = 0; t < dist.length; t++) {
        if (r < dist[t] - chaosTerrainBoost * (4 - t)) {
          picked = terrainTypes[t];
          break;
        }
      }
      row.push(picked);
    }
    terrain.push(row);
  }

  // Ensure starting positions (2 rows each side) are always plain for fair play
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < boardW; x++) {
      terrain[y][x] = 'plain';
      terrain[boardH - 1 - y][x] = 'plain';
    }
  }

  // --- Piece templates based on characterArchetype ---
  const ALL_PIECES: Record<string, Omit<BoardPieceDef, 'id'>[]> = {
    explorer: [
      { name: '斥候', color: '#4488ff', moveRange: 4, attackRange: 1, hp: 6, maxHp: 6, atk: 2, special: '侦察：可以看到迷雾区域' },
      { name: '骑兵', color: '#ffaa44', moveRange: 5, attackRange: 1, hp: 8, maxHp: 8, atk: 3, special: '冲锋：移动后攻击+2' },
      { name: '探险家', color: '#44ff88', moveRange: 3, attackRange: 2, hp: 7, maxHp: 7, atk: 3, special: '地形适应：无视地形消耗' },
      { name: '游骑兵', color: '#88aaff', moveRange: 4, attackRange: 2, hp: 7, maxHp: 7, atk: 2, special: '机动射击：攻击后可移动1格' },
      { name: '信使', color: '#aaddff', moveRange: 6, attackRange: 1, hp: 4, maxHp: 4, atk: 1, special: '急行：移动力最高' },
    ],
    guardian: [
      { name: '重甲骑士', color: '#4488ff', moveRange: 2, attackRange: 1, hp: 15, maxHp: 15, atk: 3, special: '坚盾：受伤减半' },
      { name: '守卫', color: '#888888', moveRange: 2, attackRange: 1, hp: 12, maxHp: 12, atk: 2, special: '嘲讽：迫使邻近敌人攻击自己' },
      { name: '圣骑士', color: '#ffdd44', moveRange: 2, attackRange: 1, hp: 10, maxHp: 10, atk: 4, special: '神圣打击：对低HP敌人伤害翻倍' },
      { name: '盾兵', color: '#aaaaaa', moveRange: 1, attackRange: 1, hp: 18, maxHp: 18, atk: 1, special: '不动如山：无法被击退' },
      { name: '治疗师', color: '#44ff88', moveRange: 2, attackRange: 2, hp: 6, maxHp: 6, atk: 1, special: '治愈：回复邻近友军3HP' },
    ],
    fugitive: [
      { name: '刺客', color: '#aa44ff', moveRange: 3, attackRange: 1, hp: 5, maxHp: 5, atk: 6, special: '暗杀：对满HP目标伤害翻倍' },
      { name: '弓箭手', color: '#44ff88', moveRange: 3, attackRange: 4, hp: 5, maxHp: 5, atk: 3, special: '远射：攻击范围最远' },
      { name: '忍者', color: '#333333', moveRange: 4, attackRange: 1, hp: 4, maxHp: 4, atk: 5, special: '隐身：首次攻击必定暴击' },
      { name: '狙击手', color: '#ff6644', moveRange: 2, attackRange: 5, hp: 4, maxHp: 4, atk: 4, special: '精准射击：无视距离衰减' },
      { name: '陷阱师', color: '#ffaa44', moveRange: 3, attackRange: 2, hp: 6, maxHp: 6, atk: 2, special: '布置陷阱：在移动路径放置陷阱' },
    ],
    collector: [
      { name: '法师', color: '#aa44ff', moveRange: 2, attackRange: 3, hp: 5, maxHp: 5, atk: 5, special: '范围攻击：伤害溅射邻近敌人' },
      { name: '吟游诗人', color: '#ffdd44', moveRange: 3, attackRange: 2, hp: 6, maxHp: 6, atk: 2, special: '鼓舞：增强邻近友军攻击+2' },
      { name: '召唤师', color: '#cc55ff', moveRange: 2, attackRange: 2, hp: 6, maxHp: 6, atk: 3, special: '召唤：产生临时援军' },
      { name: '炼金术士', color: '#44ddaa', moveRange: 3, attackRange: 2, hp: 7, maxHp: 7, atk: 2, special: '投瓶：造成持续伤害' },
      { name: '学者', color: '#88aaff', moveRange: 2, attackRange: 2, hp: 5, maxHp: 5, atk: 3, special: '分析弱点：下次攻击伤害+3' },
    ],
  };

  const archetypePieces = ALL_PIECES[choices.characterArchetype] || ALL_PIECES.explorer;

  // --- Piece count from difficulty ---
  const DIFF_PIECES: Record<string, { playerCount: number; enemyCount: number; enemyStatMult: number }> = {
    relaxed:       { playerCount: 4, enemyCount: 3, enemyStatMult: 0.8 },
    steady:        { playerCount: 4, enemyCount: 4, enemyStatMult: 1.0 },
    hardcore:      { playerCount: 3, enemyCount: 5, enemyStatMult: 1.3 },
    rollercoaster: { playerCount: 4, enemyCount: 4, enemyStatMult: 1.1 },
  };
  const diffPieces = DIFF_PIECES[choices.difficultyStyle] || DIFF_PIECES.steady;

  const pieces: { piece: BoardPieceDef; x: number; y: number; owner: 'player' | 'enemy' }[] = [];

  // Player pieces (from archetype pool)
  for (let i = 0; i < diffPieces.playerCount && i < archetypePieces.length; i++) {
    const template = archetypePieces[i];
    pieces.push({
      piece: { ...template, id: `p_${i}` },
      x: 1 + Math.floor(rand() * (boardW - 2)),
      y: boardH - 1 - Math.floor(rand() * 2),
      owner: 'player',
    });
  }

  // Custom element: add a special unit if provided
  if (choices.customElement && choices.customElement.trim()) {
    const customName = choices.customElement.trim().slice(0, 8);
    pieces.push({
      piece: {
        id: 'p_custom',
        name: `★${customName}`,
        color: '#ffd700',
        moveRange: 3,
        attackRange: 2,
        hp: 10,
        maxHp: 10,
        atk: 4,
        special: `${customName}的特殊能力`,
      },
      x: Math.floor(boardW / 2),
      y: boardH - 1,
      owner: 'player',
    });
  }

  // Enemy pieces (generic enemy army, scaled by difficulty)
  const enemyTemplates: Omit<BoardPieceDef, 'id'>[] = [
    { name: '敌战士', color: '#ff4444', moveRange: 2, attackRange: 1, hp: 10, maxHp: 10, atk: 3 },
    { name: '敌弓手', color: '#ff6644', moveRange: 3, attackRange: 3, hp: 6, maxHp: 6, atk: 2 },
    { name: '敌骑士', color: '#ff8844', moveRange: 4, attackRange: 1, hp: 8, maxHp: 8, atk: 4, special: '冲锋' },
    { name: '敌法师', color: '#ff44aa', moveRange: 2, attackRange: 2, hp: 5, maxHp: 5, atk: 5, special: '范围攻击' },
    { name: '敌坦克', color: '#cc2222', moveRange: 1, attackRange: 1, hp: 15, maxHp: 15, atk: 2, special: '重甲' },
  ];

  for (let i = 0; i < diffPieces.enemyCount; i++) {
    const template = enemyTemplates[i % enemyTemplates.length];
    const scaledHp = Math.round(template.hp * diffPieces.enemyStatMult);
    const scaledAtk = Math.round(template.atk * diffPieces.enemyStatMult);
    pieces.push({
      piece: {
        ...template,
        id: `e_${i}`,
        hp: scaledHp,
        maxHp: scaledHp,
        atk: scaledAtk,
      },
      x: 1 + Math.floor(rand() * (boardW - 2)),
      y: Math.floor(rand() * 2),
      owner: 'enemy',
    });
  }

  return {
    width: boardW,
    height: boardH,
    terrain,
    pieces,
    turnLimit: boardConfig.turnLimit,
  };
}

/**
 * Generate logic puzzle game data
 *
 * User choices consumed:
 * - difficultyStyle → puzzle complexity & time limits
 *     relaxed: 4x4 sudoku, easy sequences, generous time
 *     steady: mixed difficulty, standard time
 *     hardcore: 6x6 sudoku, complex sequences, tight time
 *     rollercoaster: random mix of easy and hard
 * - gamePace → puzzle count
 *     fast: 2-3 puzzles, medium: 3-5 puzzles, slow: 5-7 puzzles
 * - worldDifference → connection puzzle themes
 *     colors_alive: art/color themes, sound_solid: music/sound themes,
 *     memory_touch: memory/emotion themes, time_uneven: time/science themes
 * - customElement → adds themed clue text to puzzles
 * - chaosLevel → more unusual puzzle variants, more nulls in sudoku
 * - skillLuckRatio → hide probability in sudoku (skill = more visible, luck = more hidden)
 */
function generatePuzzleGameData(
  rand: () => number,
  choices: UserChoices,
): PuzzleGameData {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const puzzles: LogicPuzzleDef[] = [];

  // --- Puzzle count from pace ---
  const PACE_COUNT: Record<string, [number, number]> = {
    fast:   [2, 3],
    medium: [3, 5],
    slow:   [5, 7],
  };
  const [minCount, maxCount] = PACE_COUNT[choices.gamePace] || PACE_COUNT.medium;
  const puzzleCount = minCount + Math.floor(rand() * (maxCount - minCount + 1));

  // --- Difficulty tuning ---
  const DIFF_TUNING: Record<string, {
    sudokuSize: number; hideRate: number; timeMult: number;
    seqLength: number; connectionGroups: number;
  }> = {
    relaxed:       { sudokuSize: 4, hideRate: 0.35, timeMult: 1.5, seqLength: 5, connectionGroups: 3 },
    steady:        { sudokuSize: 4, hideRate: 0.50, timeMult: 1.0, seqLength: 6, connectionGroups: 4 },
    hardcore:      { sudokuSize: 6, hideRate: 0.65, timeMult: 0.7, seqLength: 7, connectionGroups: 4 },
    rollercoaster: { sudokuSize: 4, hideRate: 0.55, timeMult: 1.0, seqLength: 6, connectionGroups: 4 },
  };
  const diffTuning = DIFF_TUNING[choices.difficultyStyle] || DIFF_TUNING.steady;

  // Skill/luck adjusts hide rate (more skill = more visible cells to reason about)
  const SKILL_HIDE_ADJ: Record<string, number> = {
    pure_skill: -0.15, skill_heavy: -0.08, balanced: 0, luck_heavy: 0.10,
  };
  const hideAdj = SKILL_HIDE_ADJ[choices.skillLuckRatio] || 0;
  const effectiveHideRate = Math.max(0.2, Math.min(0.75, diffTuning.hideRate + hideAdj));

  // Chaos adds more variety
  const chaosFactor = choices.chaosLevel / 5; // 0→0, 5→1

  // --- Connection themes from worldDifference ---
  const CONNECTION_THEMES: Record<string, { groups: string[][]; labels: string[] }[]> = {
    colors_alive: [
      { groups: [['玫瑰', '向日葵', '百合', '兰花'], ['红色', '金色', '白色', '紫色'], ['水彩', '油画', '素描', '版画'], ['春天', '夏天', '秋天', '冬天']], labels: ['花卉', '颜色', '画法', '季节'] },
      { groups: [['梵高', '莫奈', '毕加索', '达芬奇'], ['星空', '睡莲', '格尔尼卡', '蒙娜丽莎'], ['调色板', '画笔', '画布', '颜料'], ['红', '黄', '蓝', '绿']], labels: ['画家', '名画', '工具', '三原色+'] },
      { groups: [['苹果', '西瓜', '蓝莓', '柠檬'], ['三角形', '圆形', '方形', '菱形'], ['钢琴', '吉他', '小提琴', '鼓'], ['太阳', '月亮', '星星', '彩虹']], labels: ['水果', '形状', '乐器', '天体'] },
    ],
    sound_solid: [
      { groups: [['钢琴', '小提琴', '大提琴', '长笛'], ['摇滚', '爵士', '古典', '电子'], ['do', 're', 'mi', 'fa'], ['鼓点', '旋律', '和声', '节奏']], labels: ['乐器', '曲风', '音阶', '音乐元素'] },
      { groups: [['贝多芬', '莫扎特', '巴赫', '肖邦'], ['交响曲', '奏鸣曲', '协奏曲', '小夜曲'], ['高音', '中音', '低音', '重低音'], ['钢琴', '管风琴', '手风琴', '电子琴']], labels: ['作曲家', '曲式', '音域', '键盘乐器'] },
    ],
    memory_touch: [
      { groups: [['快乐', '悲伤', '愤怒', '平静'], ['拥抱', '握手', '点头', '微笑'], ['童年', '青春', '成年', '老年'], ['日记', '相册', '信件', '礼物']], labels: ['情绪', '肢体语言', '人生阶段', '记忆载体'] },
      { groups: [['思念', '怀旧', '感恩', '希望'], ['味觉', '听觉', '视觉', '触觉'], ['家', '学校', '公园', '图书馆'], ['春风', '夏雨', '秋叶', '冬雪']], labels: ['情感', '感官', '记忆场所', '季节意象'] },
    ],
    time_uneven: [
      { groups: [['光年', '纳秒', '世纪', '刹那'], ['相对论', '量子力学', '热力学', '电磁学'], ['爱因斯坦', '牛顿', '霍金', '薛定谔'], ['黑洞', '虫洞', '白矮星', '中子星']], labels: ['时间单位', '物理理论', '科学家', '天体'] },
      { groups: [['过去', '现在', '未来', '永恒'], ['沙漏', '日晷', '钟摆', '石英'], ['秒', '分', '时', '日'], ['加速', '减速', '暂停', '倒流']], labels: ['时间维度', '计时工具', '时间单位', '时间操控'] },
    ],
  };

  // --- Sequence patterns scaled by difficulty ---
  const EASY_SEQS = [
    { seq: [2, 4, 6, null, 10, null], sol: [2, 4, 6, 8, 10, 12], clue: '规律：+2' },
    { seq: [3, 6, null, 12, 15, null], sol: [3, 6, 9, 12, 15, 18], clue: '规律：+3' },
    { seq: [5, 10, null, 20, null, 30], sol: [5, 10, 15, 20, 25, 30], clue: '规律：+5' },
    { seq: [1, 3, 5, null, 9, null], sol: [1, 3, 5, 7, 9, 11], clue: '规律：奇数列' },
  ];
  const MEDIUM_SEQS = [
    { seq: [1, 1, 2, 3, null, 8, null], sol: [1, 1, 2, 3, 5, 8, 13], clue: '斐波那契数列' },
    { seq: [1, 4, null, 16, null, 36], sol: [1, 4, 9, 16, 25, 36], clue: '完全平方数' },
    { seq: [2, 6, null, 20, 30, null], sol: [2, 6, 12, 20, 30, 42], clue: '规律：n×(n+1)' },
    { seq: [1, 2, 4, null, 16, null], sol: [1, 2, 4, 8, 16, 32], clue: '规律：×2' },
  ];
  const HARD_SEQS = [
    { seq: [1, 1, 2, 3, 5, null, null], sol: [1, 1, 2, 3, 5, 8, 13], clue: '斐波那契数列' },
    { seq: [1, 3, null, 10, null, 21], sol: [1, 3, 6, 10, 15, 21], clue: '三角数' },
    { seq: [2, 3, 5, 7, null, 13, null], sol: [2, 3, 5, 7, 11, 13, 17], clue: '质数列' },
    { seq: [1, 8, null, 64, null, 216], sol: [1, 8, 27, 64, 125, 216], clue: '完全立方数' },
    { seq: [0, 1, 1, 2, null, 5, null, 14], sol: [0, 1, 1, 2, 3, 5, 9, 14], clue: '泰波那契数列' },
  ];

  // Select puzzle types
  const puzzleTypes: LogicPuzzleDef['type'][] = ['sudoku', 'connection', 'sequence'];

  for (let p = 0; p < puzzleCount; p++) {
    // Rollercoaster: alternate between easy and hard
    const isHardRound = choices.difficultyStyle === 'rollercoaster' ? p % 2 === 1 : false;
    const ptype = puzzleTypes[p % puzzleTypes.length]; // Cycle through types for variety

    switch (ptype) {
      case 'sudoku': {
        const size = (isHardRound || diffTuning.sudokuSize === 6) ? 6 : 4;

        let solution: (number | string)[][];
        if (size === 4) {
          solution = [
            [1, 2, 3, 4],
            [3, 4, 1, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1],
          ];
          // Shuffle rows within blocks
          if (rand() > 0.5) [solution[0], solution[1]] = [solution[1], solution[0]];
          if (rand() > 0.5) [solution[2], solution[3]] = [solution[3], solution[2]];
        } else {
          // 6×6 sudoku (2×3 blocks)
          solution = [
            [1, 2, 3, 4, 5, 6],
            [4, 5, 6, 1, 2, 3],
            [2, 3, 1, 5, 6, 4],
            [5, 6, 4, 2, 3, 1],
            [3, 1, 2, 6, 4, 5],
            [6, 4, 5, 3, 1, 2],
          ];
          // Shuffle rows within 2-row blocks
          if (rand() > 0.5) [solution[0], solution[1]] = [solution[1], solution[0]];
          if (rand() > 0.5) [solution[2], solution[3]] = [solution[3], solution[2]];
          if (rand() > 0.5) [solution[4], solution[5]] = [solution[5], solution[4]];
        }

        // Hide cells based on difficulty + skill/luck
        const actualHideRate = isHardRound ? effectiveHideRate + 0.1 : effectiveHideRate;
        const grid: (number | string | null)[][] = solution.map(row =>
          row.map(val => rand() > actualHideRate ? val : null)
        );

        const timeLimit = Math.round((size === 4 ? 120 : 240) * diffTuning.timeMult);

        puzzles.push({
          type: 'sudoku',
          size,
          grid,
          clues: [size === 4
            ? `在每行、每列和每个2×2区块中填入1-${size}`
            : `在每行、每列和每个2×3区块中填入1-${size}`],
          solution,
          timeLimit,
        });
        break;
      }

      case 'connection': {
        const themeOptions = CONNECTION_THEMES[choices.worldDifference] || CONNECTION_THEMES.colors_alive;
        const themeData = pick(themeOptions);

        // Use fewer groups for easier difficulty
        const groupCount = Math.min(diffTuning.connectionGroups, themeData.groups.length);
        const groups = themeData.groups.slice(0, groupCount);
        const labels = themeData.labels.slice(0, groupCount);

        // Flatten and shuffle
        const allWords = groups.flat().sort(() => rand() - 0.5);
        const grid: (number | string | null)[][] = [allWords];

        const timeLimit = Math.round((groupCount * 45) * diffTuning.timeMult);

        puzzles.push({
          type: 'connection',
          size: groupCount,
          grid,
          clues: labels,
          solution: groups,
          timeLimit,
        });
        break;
      }

      case 'sequence': {
        const seqPool = isHardRound || choices.difficultyStyle === 'hardcore'
          ? HARD_SEQS
          : choices.difficultyStyle === 'relaxed'
            ? EASY_SEQS
            : MEDIUM_SEQS;

        // Chaos can pull from harder pools
        const effectivePool = chaosFactor > 0.5 && seqPool !== HARD_SEQS
          ? [...seqPool, ...HARD_SEQS.slice(0, 2)]
          : seqPool;

        const chosen = pick(effectivePool);
        const timeLimit = Math.round((chosen.seq.length * 12) * diffTuning.timeMult);

        puzzles.push({
          type: 'sequence',
          size: chosen.seq.length,
          grid: [chosen.seq],
          clues: [chosen.clue],
          solution: [chosen.sol],
          timeLimit,
        });
        break;
      }
    }
  }

  return {
    puzzles,
    currentPuzzleIndex: 0,
  };
}

/**
 * Generate rhythm game data
 *
 * User choices consumed:
 * - gamePace → base BPM
 *     fast: 140-180 BPM (intense), medium: 110-140 BPM, slow: 80-110 BPM (chill)
 * - difficultyStyle → note density, multi-notes, hold frequency
 *     relaxed: sparse notes, no multi-hits, few holds
 *     steady: moderate density, occasional doubles
 *     hardcore: dense notes, frequent doubles/triples, many holds
 *     rollercoaster: alternating sparse/dense sections
 * - chaosLevel → scroll speed variance & pattern irregularity
 *     low chaos: consistent patterns, high chaos: erratic patterns & speed changes
 * - skillLuckRatio → timing window (more skill = stricter timing requirement encoded as scroll speed)
 * - worldDifference → visual rhythm patterns (some patterns favor certain lanes)
 * - gravity → scroll direction hint (normal: top-down, reverse: bottom-up encoded in scroll speed)
 */
function generateRhythmGameData(
  rand: () => number,
  choices: UserChoices,
): RhythmGameData {
  // --- BPM from gamePace ---
  const BPM_RANGE: Record<string, [number, number]> = {
    fast:   [140, 180],
    medium: [110, 140],
    slow:   [80, 110],
  };
  const [minBpm, maxBpm] = BPM_RANGE[choices.gamePace] || BPM_RANGE.medium;
  const bpm = minBpm + Math.floor(rand() * (maxBpm - minBpm));
  const beatMs = 60000 / bpm;
  const laneCount = 4;

  // --- Song length: fast pace = shorter but intense, slow = longer ---
  const PACE_BEATS: Record<string, [number, number]> = {
    fast:   [50, 70],
    medium: [60, 90],
    slow:   [80, 120],
  };
  const [minBeats, maxBeats] = PACE_BEATS[choices.gamePace] || PACE_BEATS.medium;
  const songBeats = minBeats + Math.floor(rand() * (maxBeats - minBeats));
  const songDuration = songBeats * beatMs;

  // --- Scroll speed from skill/luck ---
  const SCROLL_SPEED: Record<string, number> = {
    pure_skill:  500, // Fast scroll = tight timing window
    skill_heavy: 420,
    balanced:    350,
    luck_heavy:  280, // Slow scroll = more forgiving
  };
  let scrollSpeed = SCROLL_SPEED[choices.skillLuckRatio] || 350;

  // Gravity hint: reverse gravity = slightly faster scroll (visual metaphor)
  if (choices.gravity === 'reverse') scrollSpeed += 50;
  if (choices.gravity === 'low') scrollSpeed -= 30;

  // Chaos adds speed variance
  const chaosSpeedVar = choices.chaosLevel * 20; // 0→0, 5→100
  scrollSpeed += Math.floor((rand() - 0.5) * chaosSpeedVar);
  scrollSpeed = Math.max(200, Math.min(600, scrollSpeed));

  // --- Difficulty tuning ---
  const DIFF_TUNING: Record<string, {
    noteSpacing: number; // Min beats between notes (lower = denser)
    multiNoteChance: number; // Chance of 2+ simultaneous notes
    holdChance: number; // Chance of hold notes
    maxSimultaneous: number;
  }> = {
    relaxed:       { noteSpacing: 1.5, multiNoteChance: 0.05, holdChance: 0.05, maxSimultaneous: 1 },
    steady:        { noteSpacing: 1.0, multiNoteChance: 0.15, holdChance: 0.12, maxSimultaneous: 2 },
    hardcore:      { noteSpacing: 0.5, multiNoteChance: 0.30, holdChance: 0.20, maxSimultaneous: 3 },
    rollercoaster: { noteSpacing: 0.8, multiNoteChance: 0.20, holdChance: 0.15, maxSimultaneous: 2 },
  };
  const diffTuning = DIFF_TUNING[choices.difficultyStyle] || DIFF_TUNING.steady;

  // --- World difference affects lane bias patterns ---
  // Each world creates a distinct rhythmic "feel"
  const LANE_PATTERNS: Record<string, number[][]> = {
    colors_alive: [[0, 3], [1, 2], [0, 1, 2, 3], [2, 3]], // Spread out — colorful
    sound_solid:  [[0, 1], [1, 2], [2, 3], [0, 3]],       // Adjacent pairs — resonant
    memory_touch: [[0], [1], [2], [3], [0, 2], [1, 3]],   // Singles then pairs — reflective
    time_uneven:  [[0, 1, 2], [1, 2, 3], [0], [3]],       // Uneven groupings — chaotic
  };
  const lanePatterns = LANE_PATTERNS[choices.worldDifference] || LANE_PATTERNS.colors_alive;
  let patternIdx = 0;

  // --- Generate notes ---
  const notes: RhythmNote[] = [];
  let currentTime = beatMs * 2; // Start after 2 beats intro
  let sectionBeat = 0;

  // For rollercoaster: alternate between sparse and dense sections
  const sectionLength = 8; // beats per section

  while (currentTime < songDuration - beatMs * 2) {
    // Rollercoaster: toggle density every section
    let spacing = diffTuning.noteSpacing;
    let multiChance = diffTuning.multiNoteChance;
    if (choices.difficultyStyle === 'rollercoaster') {
      const sectionNum = Math.floor(sectionBeat / sectionLength);
      if (sectionNum % 2 === 0) {
        spacing *= 1.8; // Sparse section
        multiChance *= 0.3;
      } else {
        spacing *= 0.6; // Dense section
        multiChance *= 1.5;
      }
    }

    // Chaos adds timing jitter
    const chaosJitter = choices.chaosLevel * 0.15; // 0→0, 5→0.75 beat jitter
    const timeGap = beatMs * (spacing + rand() * spacing * 0.5 + (rand() - 0.5) * chaosJitter);
    currentTime += timeGap;

    if (currentTime >= songDuration - beatMs) break;

    // Determine number of simultaneous notes
    const noteCount = rand() < multiChance
      ? Math.min(1 + Math.floor(rand() * diffTuning.maxSimultaneous), laneCount)
      : 1;

    // Pick lanes using world-themed patterns
    const preferredLanes = lanePatterns[patternIdx % lanePatterns.length];
    patternIdx++;
    const usedLanes = new Set<number>();

    for (let n = 0; n < noteCount; n++) {
      let lane: number;
      if (n < preferredLanes.length && !usedLanes.has(preferredLanes[n])) {
        lane = preferredLanes[n]; // Use pattern-preferred lane
      } else {
        lane = Math.floor(rand() * laneCount);
        while (usedLanes.has(lane) && usedLanes.size < laneCount) {
          lane = (lane + 1) % laneCount;
        }
      }
      if (usedLanes.has(lane)) continue;
      usedLanes.add(lane);

      const isHold = rand() < diffTuning.holdChance;
      const type: RhythmNote['type'] = isHold ? 'hold' : 'tap';

      notes.push({
        time: Math.round(currentTime),
        lane,
        type,
        duration: type === 'hold' ? Math.round(beatMs * (1 + rand() * 2)) : undefined,
      });
    }

    sectionBeat++;
  }

  // Sort by time
  notes.sort((a, b) => a.time - b.time);

  return {
    notes,
    bpm,
    scrollSpeed,
    songDuration: Math.round(songDuration),
    laneCount,
  };
}

// ============================================================================
// Seed Code (delegates to seed.ts)
// ============================================================================

/**
 * Generate a human-readable seed code from user choices and an internal seed.
 */
export function generateSeedCode(choices: UserChoices, internalSeed: number): string {
  return encodeSeedCode(choices, internalSeed);
}

// ============================================================================
// Main Generator
// ============================================================================

/**
 * Generate a complete GameConfig from the user's wizard choices.
 *
 * This is the primary entry point for the entire generation pipeline.
 */
export function generateGame(choices: UserChoices): GameConfig {
  // Step 1: Create internal seed
  const internalSeed = createInternalSeed(choices);

  // Step 2: Initialize seeded RNG
  const rand = createSeededRandom(internalSeed);

  // Step 3: Create player entity (with visual style palette)
  const character = generateCharacter(choices.characterArchetype);
  const palette = getVisualPalette(choices.visualStyle, choices.worldDifference);
  const player = createPlayerEntity(choices.verbs, { ...character, color: palette.player }, rand);

  // Step 4: Generate world config
  const world = generateWorldConfig(choices);

  // Steps 5-7: Generate entities AND genre-specific data based on genre
  let genreEntities: EntityDef[] = [];
  let genreData: GameConfigGenreData = {};

  switch (choices.genre) {
    // --- Non-Phaser genres: generate genreData instead of ECS entities ---
    case 'narrative':
      genreData.narrative = generateNarrativeGameData(rand, choices);
      break;
    case 'card':
      genreData.card = generateCardGameData(rand, choices);
      break;
    case 'board':
      genreData.board = generateBoardGameData(rand, choices);
      break;
    case 'puzzle_logic':
      genreData.puzzle = generatePuzzleGameData(rand, choices);
      break;
    case 'rhythm':
      genreData.rhythm = generateRhythmGameData(rand, choices);
      break;

    // --- Action genre: uses Phaser, generate ECS entities ---
    case 'action':
    default: {
      const platforms = generatePlatforms(rand, world, choices.verbs);
      const enemies = generateEnemies(rand, choices.difficultyStyle, choices.verbs, world);
      const collectibles = generateCollectibles(rand, choices.verbs, world);
      genreEntities = [...platforms, ...enemies, ...collectibles];
      break;
    }
  }

  // Step 8: Generate systems (only meaningful for action genre, but included for all)
  const systems = generateSystems(choices.verbs, choices);

  // Step 9: Generate rules
  const rules = generateRules(choices.verbs, choices);

  // Step 10: Generate feedback loops
  const feedbackLoops = generateFeedbackLoops(choices.verbs);

  // Step 11: Generate narrative framing
  const narrative = generateNarrative(choices, choices.verbs, choices.chaosLevel);

  // Step 12: Configure chaos
  const chaos = generateChaosConfig(choices.chaosLevel);

  // Step 13: Generate difficulty curve
  const curve = generateDifficultyCurve(choices.difficultyStyle, choices.gamePace, 10);
  const difficulty: DifficultyConfig = {
    style: choices.difficultyStyle,
    pace: choices.gamePace,
    skillLuckRatio: choices.skillLuckRatio,
    curve,
  };

  // Step 14: Generate seed code
  const seedCode = generateSeedCode(choices, internalSeed);

  // Assemble entities (only player + genre entities for action)
  const entities: EntityDef[] = choices.genre === 'action' ? [player, ...genreEntities] : [player];

  // Build the game name from key choices
  const verbLabel = choices.verbs.map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(' & ');
  const name = `${character.nameTemplate}'s ${verbLabel || 'Mystery'} World`;

  const genreNames: Record<GameGenre, string> = {
    action: '动作冒险', narrative: '文字推理', card: '卡牌对战',
    board: '棋盘战棋', puzzle_logic: '逻辑解谜', rhythm: '节奏动作',
  };

  const config: GameConfig = {
    id: `game_${internalSeed.toString(16)}`,
    seedCode,
    name,
    description: `${genreNames[choices.genre]} — A ${choices.difficultyStyle} ${(verbLabel || 'mystery').toLowerCase()} game set in a world where ${narrative.worldDifference.slice(0, 80)}...`,
    genre: choices.genre,
    visualStyle: choices.visualStyle,
    verbs: choices.verbs,
    world,
    entities,
    systems,
    rules,
    feedbackLoops,
    narrative,
    difficulty,
    chaos,
    internalSeed,
    genreData,
  };

  // Step 15: Validate with meaningful play check
  const playValidation = validateMeaningfulPlay(config);
  const diffValidation = validateDifficulty(config);

  // Log warnings in development (these do not block generation)
  if (process.env.NODE_ENV === 'development') {
    for (const w of playValidation.warnings) {
      console.warn('[MeaningfulPlay]', w);
    }
    for (const s of playValidation.suggestions) {
      console.info('[MeaningfulPlay]', s);
    }
    for (const w of diffValidation.warnings) {
      console.warn('[Difficulty]', w);
    }
    for (const s of diffValidation.suggestions) {
      console.info('[Difficulty]', s);
    }
  }

  return config;
}

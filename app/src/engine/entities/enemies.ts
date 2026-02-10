// ============================================================================
// Enemy Entity Factories
// Each factory produces an EntityDef for a distinct enemy archetype.
// All enemies use geometric shapes + solid colors (no sprites).
// ============================================================================

import type {
  EntityDef,
  ComponentDef,
  PatrolComponentConfig,
  ChaserComponentConfig,
  EnemyShooterComponentConfig,
  BouncerComponentConfig,
} from '../types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

let enemyCounter = 0;

function nextEnemyId(prefix: string): string {
  enemyCounter += 1;
  return `${prefix}_${enemyCounter}`;
}

/** Reset the ID counter (useful for tests or level reloads) */
export function resetEnemyIdCounter(): void {
  enemyCounter = 0;
}

function baseEnemyComponents(
  x: number,
  y: number,
  width: number,
  height: number,
  hp: number,
): ComponentDef[] {
  return [
    {
      type: 'transform',
      config: { x, y, velocityX: 0, velocityY: 0 },
    },
    {
      type: 'physics',
      config: { mass: 1, gravityScale: 1, friction: 0.6 },
    },
    {
      type: 'collider',
      config: { shape: 'rect', width, height },
    },
    {
      type: 'health',
      config: { current: hp, max: hp },
    },
    {
      type: 'damageOnContact',
      config: { damage: 1, cooldownMs: 500 },
    },
  ];
}

// ---------------------------------------------------------------------------
// Patrol Enemy
// Shape: circle (rendered as a square entity with a "circle" render hint)
// Moves back and forth along a path.
// ---------------------------------------------------------------------------

export interface PatrolEnemyOptions {
  x: number;
  y: number;
  patrolDistance?: number;
  speed?: number;
  direction?: 'horizontal' | 'vertical';
  size?: number;
  hp?: number;
}

/**
 * Circle-shaped enemy that patrols back and forth.
 * Color: crimson red (#E53935).
 */
export function createPatrolEnemy(options: PatrolEnemyOptions): EntityDef {
  const {
    x,
    y,
    patrolDistance = 200,
    speed = 2,
    direction = 'horizontal',
    size = 28,
    hp = 2,
  } = options;

  const patrolConfig: PatrolComponentConfig = {
    patrolDistance,
    speed,
    direction,
  };

  return {
    id: nextEnemyId('patrol'),
    type: 'enemy_patrol',
    x,
    y,
    width: size,
    height: size,
    color: '#E53935', // crimson red
    components: [
      ...baseEnemyComponents(x, y, size, size, hp),
      { type: 'renderHint', config: { shape: 'circle' } },
      { type: 'patrol', config: patrolConfig as unknown as Record<string, unknown> },
    ],
  };
}

// ---------------------------------------------------------------------------
// Chaser Enemy
// Shape: triangle (rendered via a render hint)
// Follows the player when within detection radius.
// ---------------------------------------------------------------------------

export interface ChaserEnemyOptions {
  x: number;
  y: number;
  chaseSpeed?: number;
  detectionRadius?: number;
  size?: number;
  hp?: number;
}

/**
 * Triangle-shaped enemy that pursues the player.
 * Color: deep orange (#FF6D00).
 */
export function createChaserEnemy(options: ChaserEnemyOptions): EntityDef {
  const {
    x,
    y,
    chaseSpeed = 3,
    detectionRadius = 250,
    size = 30,
    hp = 3,
  } = options;

  const chaserConfig: ChaserComponentConfig = {
    chaseSpeed,
    detectionRadius,
  };

  return {
    id: nextEnemyId('chaser'),
    type: 'enemy_chaser',
    x,
    y,
    width: size,
    height: size,
    color: '#FF6D00', // deep orange
    components: [
      ...baseEnemyComponents(x, y, size, size, hp),
      { type: 'renderHint', config: { shape: 'triangle' } },
      { type: 'chaser', config: chaserConfig as unknown as Record<string, unknown> },
    ],
  };
}

// ---------------------------------------------------------------------------
// Shooter Enemy
// Shape: diamond (rotated square via render hint)
// Fires projectiles at the player from a distance.
// ---------------------------------------------------------------------------

export interface ShooterEnemyOptions {
  x: number;
  y: number;
  fireRate?: number;
  bulletSpeed?: number;
  range?: number;
  size?: number;
  hp?: number;
}

/**
 * Diamond-shaped enemy that fires projectiles.
 * Color: vivid purple (#AA00FF).
 */
export function createShooterEnemy(options: ShooterEnemyOptions): EntityDef {
  const {
    x,
    y,
    fireRate = 1.5,
    bulletSpeed = 6,
    range = 350,
    size = 26,
    hp = 2,
  } = options;

  const shooterConfig: EnemyShooterComponentConfig = {
    fireRate,
    bulletSpeed,
    bulletColor: '#FF4081', // pink bullets
    range,
  };

  return {
    id: nextEnemyId('shooter'),
    type: 'enemy_shooter',
    x,
    y,
    width: size,
    height: size,
    color: '#AA00FF', // vivid purple
    components: [
      ...baseEnemyComponents(x, y, size, size, hp),
      { type: 'renderHint', config: { shape: 'diamond' } },
      { type: 'enemyShooter', config: shooterConfig as unknown as Record<string, unknown> },
    ],
  };
}

// ---------------------------------------------------------------------------
// Bouncer Enemy
// Shape: small circle, bounces around randomly.
// ---------------------------------------------------------------------------

export interface BouncerEnemyOptions {
  x: number;
  y: number;
  bounceSpeed?: number;
  bounceAngleVariance?: number;
  size?: number;
  hp?: number;
}

/**
 * Small circle enemy that bounces around unpredictably.
 * Color: bright yellow (#FFD600).
 */
export function createBouncerEnemy(options: BouncerEnemyOptions): EntityDef {
  const {
    x,
    y,
    bounceSpeed = 5,
    bounceAngleVariance = 45,
    size = 20,
    hp = 1,
  } = options;

  const bouncerConfig: BouncerComponentConfig = {
    bounceSpeed,
    bounceAngleVariance,
  };

  return {
    id: nextEnemyId('bouncer'),
    type: 'enemy_bouncer',
    x,
    y,
    width: size,
    height: size,
    color: '#FFD600', // bright yellow
    components: [
      ...baseEnemyComponents(x, y, size, size, hp),
      { type: 'renderHint', config: { shape: 'circle' } },
      { type: 'bouncer', config: bouncerConfig as unknown as Record<string, unknown> },
    ],
  };
}

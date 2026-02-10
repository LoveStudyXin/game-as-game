// ============================================================================
// Projectile Entity Factories
// Bullets, build blocks, and other short-lived kinetic entities.
// All use geometric shapes + solid colors (no sprites).
// ============================================================================

import type {
  EntityDef,
  ComponentDef,
  ProjectileComponentConfig,
  BuildBlockComponentConfig,
} from '../types';

// ---------------------------------------------------------------------------
// ID counter
// ---------------------------------------------------------------------------

let projectileCounter = 0;

function nextProjectileId(prefix: string): string {
  projectileCounter += 1;
  return `${prefix}_${projectileCounter}`;
}

/** Reset the ID counter (useful for tests or level reloads) */
export function resetProjectileIdCounter(): void {
  projectileCounter = 0;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function baseProjectileComponents(
  x: number,
  y: number,
  width: number,
  height: number,
): ComponentDef[] {
  return [
    {
      type: 'transform',
      config: { x, y, velocityX: 0, velocityY: 0 },
    },
    {
      type: 'collider',
      config: { shape: 'rect', width, height, isTrigger: true },
    },
  ];
}

// ---------------------------------------------------------------------------
// Player Bullet
// Shape: small thin rectangle (laser-like).
// Travels in the player's aim direction.
// ---------------------------------------------------------------------------

export interface PlayerBulletOptions {
  x: number;
  y: number;
  directionX?: number;
  directionY?: number;
  speed?: number;
  damage?: number;
  color?: string;
  lifetime?: number;
}

/**
 * Thin rectangle projectile fired by the player.
 * Default color: player accent red (#FF5252).
 */
export function createPlayerBullet(options: PlayerBulletOptions): EntityDef {
  const {
    x,
    y,
    directionX = 1,
    directionY = 0,
    speed = 10,
    damage = 1,
    color = '#FF5252', // accent red
    lifetime = 2000,
  } = options;

  const projectileConfig: ProjectileComponentConfig = {
    damage,
    speed,
    direction: { x: directionX, y: directionY },
    lifetime,
    owner: 'player',
  };

  return {
    id: nextProjectileId('pbullet'),
    type: 'projectile_player',
    x,
    y,
    width: 12,
    height: 4,
    color,
    components: [
      ...baseProjectileComponents(x, y, 12, 4),
      { type: 'renderHint', config: { shape: 'rect' } },
      { type: 'projectile', config: projectileConfig as unknown as Record<string, unknown> },
      { type: 'autoDestroy', config: { lifetimeMs: lifetime } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Enemy Bullet
// Shape: small circle.
// Fired by ShooterEnemy entities toward the player.
// ---------------------------------------------------------------------------

export interface EnemyBulletOptions {
  x: number;
  y: number;
  directionX?: number;
  directionY?: number;
  speed?: number;
  damage?: number;
  lifetime?: number;
}

/**
 * Small circle projectile fired by enemies.
 * Color: hot red (#FF1744).
 */
export function createEnemyBullet(options: EnemyBulletOptions): EntityDef {
  const {
    x,
    y,
    directionX = -1,
    directionY = 0,
    speed = 6,
    damage = 1,
    lifetime = 3000,
  } = options;

  const projectileConfig: ProjectileComponentConfig = {
    damage,
    speed,
    direction: { x: directionX, y: directionY },
    lifetime,
    owner: 'enemy',
  };

  return {
    id: nextProjectileId('ebullet'),
    type: 'projectile_enemy',
    x,
    y,
    width: 8,
    height: 8,
    color: '#FF1744', // hot red
    components: [
      ...baseProjectileComponents(x, y, 8, 8),
      { type: 'renderHint', config: { shape: 'circle' } },
      { type: 'projectile', config: projectileConfig as unknown as Record<string, unknown> },
      { type: 'autoDestroy', config: { lifetimeMs: lifetime } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Build Block
// Shape: square. Created by the player with the "build" verb.
// Once placed it becomes a solid platform that other entities collide with.
// ---------------------------------------------------------------------------

export interface BuildBlockOptions {
  x: number;
  y: number;
  color?: string;
  size?: number;
  placedBy?: string;
}

/**
 * Solid square block placed by the player. Acts as a temporary platform.
 * Default color: player build orange (#FF9100).
 */
export function createBuildBlock(options: BuildBlockOptions): EntityDef {
  const {
    x,
    y,
    color = '#FF9100', // build orange
    size = 32,
    placedBy = 'player',
  } = options;

  const blockConfig: BuildBlockComponentConfig = {
    solid: true,
    placedBy,
  };

  return {
    id: nextProjectileId('block'),
    type: 'build_block',
    x,
    y,
    width: size,
    height: size,
    color,
    components: [
      {
        type: 'transform',
        config: { x, y, velocityX: 0, velocityY: 0 },
      },
      {
        type: 'collider',
        config: { shape: 'rect', width: size, height: size, isStatic: true },
      },
      { type: 'renderHint', config: { shape: 'rect', style: 'solid' } },
      { type: 'buildBlock', config: blockConfig as unknown as Record<string, unknown> },
      { type: 'autoDestroy', config: { lifetimeMs: 15000 } }, // blocks despawn after 15 s
    ],
  };
}

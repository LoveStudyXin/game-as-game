// ============================================================================
// Collectible Entity Factories
// Items the player can pick up: coins, health, power-ups, keys.
// All use geometric shapes + solid colors (no sprites).
// ============================================================================

import type {
  EntityDef,
  ComponentDef,
  CollectibleComponentConfig,
} from '../types';

// ---------------------------------------------------------------------------
// ID counter
// ---------------------------------------------------------------------------

let collectibleCounter = 0;

function nextCollectibleId(prefix: string): string {
  collectibleCounter += 1;
  return `${prefix}_${collectibleCounter}`;
}

/** Reset the ID counter (useful for tests or level reloads) */
export function resetCollectibleIdCounter(): void {
  collectibleCounter = 0;
}

// ---------------------------------------------------------------------------
// Shared base components
// ---------------------------------------------------------------------------

function baseCollectibleComponents(
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
// Score Coin
// Shape: small circle, gold color, gives score on collection.
// ---------------------------------------------------------------------------

export interface ScoreCoinOptions {
  x: number;
  y: number;
  value?: number;
  size?: number;
}

/**
 * Small gold circle that awards score when collected.
 * Color: gold (#FFD700).
 */
export function createScoreCoin(options: ScoreCoinOptions): EntityDef {
  const {
    x,
    y,
    value = 100,
    size = 16,
  } = options;

  const collectibleConfig: CollectibleComponentConfig = {
    scoreValue: value,
  };

  return {
    id: nextCollectibleId('coin'),
    type: 'collectible_coin',
    x,
    y,
    width: size,
    height: size,
    color: '#FFD700', // gold
    components: [
      ...baseCollectibleComponents(x, y, size, size),
      { type: 'renderHint', config: { shape: 'circle' } },
      { type: 'collectible', config: collectibleConfig as unknown as Record<string, unknown> },
      { type: 'bobAnimation', config: { amplitude: 4, frequency: 2 } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Health Pickup
// Shape: plus/cross made of overlapping rects (rendered via hint).
// Color: vibrant green.
// ---------------------------------------------------------------------------

export interface HealthPickupOptions {
  x: number;
  y: number;
  healAmount?: number;
  size?: number;
}

/**
 * Green cross/plus shape that restores health.
 * Color: green (#4CAF50).
 */
export function createHealthPickup(options: HealthPickupOptions): EntityDef {
  const {
    x,
    y,
    healAmount = 1,
    size = 20,
  } = options;

  const collectibleConfig: CollectibleComponentConfig = {
    healAmount,
  };

  return {
    id: nextCollectibleId('health'),
    type: 'collectible_health',
    x,
    y,
    width: size,
    height: size,
    color: '#4CAF50', // green
    components: [
      ...baseCollectibleComponents(x, y, size, size),
      { type: 'renderHint', config: { shape: 'cross' } },
      { type: 'collectible', config: collectibleConfig as unknown as Record<string, unknown> },
      { type: 'pulseAnimation', config: { minScale: 0.9, maxScale: 1.1, frequency: 1.5 } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Power-Up
// Shape: small square with glow effect (rendered via hint).
// Color: electric blue. Grants a temporary ability boost.
// ---------------------------------------------------------------------------

export interface PowerUpOptions {
  x: number;
  y: number;
  powerUpType?: string;
  durationMs?: number;
  size?: number;
}

/**
 * Blue glowing square that grants a temporary ability boost.
 * Color: electric blue (#2979FF).
 */
export function createPowerUp(options: PowerUpOptions): EntityDef {
  const {
    x,
    y,
    powerUpType = 'speed_boost',
    durationMs = 5000,
    size = 18,
  } = options;

  const collectibleConfig: CollectibleComponentConfig = {
    powerUpType,
    powerUpDurationMs: durationMs,
  };

  return {
    id: nextCollectibleId('powerup'),
    type: 'collectible_powerup',
    x,
    y,
    width: size,
    height: size,
    color: '#2979FF', // electric blue
    components: [
      ...baseCollectibleComponents(x, y, size, size),
      { type: 'renderHint', config: { shape: 'square', glow: true, glowColor: '#82B1FF', glowRadius: 8 } },
      { type: 'collectible', config: collectibleConfig as unknown as Record<string, unknown> },
      { type: 'rotateAnimation', config: { speed: 90 } }, // degrees per second
    ],
  };
}

// ---------------------------------------------------------------------------
// Key Item
// Shape: diamond (rotated square). Specific color per key.
// Unlocks progression gates.
// ---------------------------------------------------------------------------

export interface KeyItemOptions {
  x: number;
  y: number;
  keyId: string;
  color?: string;
  size?: number;
}

/**
 * Diamond-shaped key item that unlocks progression.
 * Default color: magenta (#E040FB); can be overridden per key.
 */
export function createKeyItem(options: KeyItemOptions): EntityDef {
  const {
    x,
    y,
    keyId,
    color = '#E040FB', // magenta
    size = 22,
  } = options;

  const collectibleConfig: CollectibleComponentConfig = {
    keyId,
  };

  return {
    id: nextCollectibleId('key'),
    type: 'collectible_key',
    x,
    y,
    width: size,
    height: size,
    color,
    components: [
      ...baseCollectibleComponents(x, y, size, size),
      { type: 'renderHint', config: { shape: 'diamond' } },
      { type: 'collectible', config: collectibleConfig as unknown as Record<string, unknown> },
      { type: 'bobAnimation', config: { amplitude: 6, frequency: 1.2 } },
      { type: 'glowEffect', config: { color, radius: 12, pulseFrequency: 0.8 } },
    ],
  };
}

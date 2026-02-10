// ============================================================================
// Platform Entity Factories
// Static and dynamic surfaces the player interacts with.
// All platforms are rectangles with solid colors (no sprites).
// ============================================================================

import type {
  EntityDef,
  ComponentDef,
  MovingComponentConfig,
  BreakableComponentConfig,
  BouncyComponentConfig,
  StickyComponentConfig,
} from '../types';

// ---------------------------------------------------------------------------
// ID counter
// ---------------------------------------------------------------------------

let platformCounter = 0;

function nextPlatformId(prefix: string): string {
  platformCounter += 1;
  return `${prefix}_${platformCounter}`;
}

/** Reset the ID counter (useful for tests or level reloads) */
export function resetPlatformIdCounter(): void {
  platformCounter = 0;
}

// ---------------------------------------------------------------------------
// Shared base components for all platforms
// ---------------------------------------------------------------------------

function basePlatformComponents(
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
      config: { shape: 'rect', width, height, isStatic: true },
    },
  ];
}

// ---------------------------------------------------------------------------
// Static Platform
// A plain solid rectangle. The bread-and-butter of level geometry.
// ---------------------------------------------------------------------------

export interface StaticPlatformOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Basic solid rectangle platform.
 * Default color: slate grey (#546E7A).
 */
export function createStaticPlatform(options: StaticPlatformOptions): EntityDef {
  const {
    x,
    y,
    width = 128,
    height = 16,
    color = '#546E7A', // slate grey
  } = options;

  return {
    id: nextPlatformId('platform_static'),
    type: 'platform_static',
    x,
    y,
    width,
    height,
    color,
    components: [
      ...basePlatformComponents(x, y, width, height),
      { type: 'renderHint', config: { shape: 'rect' } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Moving Platform
// A rectangle that travels between two points at a set speed.
// ---------------------------------------------------------------------------

export interface MovingPlatformOptions {
  x: number;
  y: number;
  endX: number;
  endY: number;
  speed?: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Rectangle platform that moves between (x, y) and (endX, endY).
 * Default color: teal (#00897B).
 */
export function createMovingPlatform(options: MovingPlatformOptions): EntityDef {
  const {
    x,
    y,
    endX,
    endY,
    speed = 2,
    width = 128,
    height = 16,
    color = '#00897B', // teal
  } = options;

  const movingConfig: MovingComponentConfig = {
    startX: x,
    startY: y,
    endX,
    endY,
    speed,
  };

  return {
    id: nextPlatformId('platform_moving'),
    type: 'platform_moving',
    x,
    y,
    width,
    height,
    color,
    components: [
      ...basePlatformComponents(x, y, width, height),
      { type: 'renderHint', config: { shape: 'rect' } },
      { type: 'moving', config: movingConfig as unknown as Record<string, unknown> },
    ],
  };
}

// ---------------------------------------------------------------------------
// Breakable Platform
// A rectangle that shatters after receiving enough damage / weight.
// Lighter color to hint at fragility.
// ---------------------------------------------------------------------------

export interface BreakablePlatformOptions {
  x: number;
  y: number;
  hitPoints?: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Rectangle that breaks after taking enough hits.
 * Default color: light brown (#A1887F) to suggest fragility.
 */
export function createBreakablePlatform(options: BreakablePlatformOptions): EntityDef {
  const {
    x,
    y,
    hitPoints = 3,
    width = 96,
    height = 16,
    color = '#A1887F', // light brown
  } = options;

  const breakableConfig: BreakableComponentConfig = {
    hitPoints,
  };

  return {
    id: nextPlatformId('platform_break'),
    type: 'platform_breakable',
    x,
    y,
    width,
    height,
    color,
    components: [
      ...basePlatformComponents(x, y, width, height),
      { type: 'renderHint', config: { shape: 'rect', style: 'cracked' } },
      { type: 'breakable', config: breakableConfig as unknown as Record<string, unknown> },
    ],
  };
}

// ---------------------------------------------------------------------------
// Bounce Platform
// A rectangle that launches the player upward on contact.
// ---------------------------------------------------------------------------

export interface BouncePlatformOptions {
  x: number;
  y: number;
  bounceForce?: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Rectangle platform that bounces the player upward.
 * Default color: bright green (#00E676).
 */
export function createBouncePlatform(options: BouncePlatformOptions): EntityDef {
  const {
    x,
    y,
    bounceForce = 18,
    width = 96,
    height = 16,
    color = '#00E676', // bright green
  } = options;

  const bouncyConfig: BouncyComponentConfig = {
    bounceForce,
  };

  return {
    id: nextPlatformId('platform_bounce'),
    type: 'platform_bouncy',
    x,
    y,
    width,
    height,
    color,
    components: [
      ...basePlatformComponents(x, y, width, height),
      { type: 'renderHint', config: { shape: 'rect', style: 'striped' } },
      { type: 'bouncy', config: bouncyConfig as unknown as Record<string, unknown> },
    ],
  };
}

// ---------------------------------------------------------------------------
// Sticky Platform
// A rectangle that slows or holds the player in place.
// ---------------------------------------------------------------------------

export interface StickyPlatformOptions {
  x: number;
  y: number;
  friction?: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Rectangle platform that sticks to (slows) the player.
 * Default color: dark purple (#4A148C).
 */
export function createStickyPlatform(options: StickyPlatformOptions): EntityDef {
  const {
    x,
    y,
    friction = 0.95,
    width = 96,
    height = 16,
    color = '#4A148C', // dark purple
  } = options;

  const stickyConfig: StickyComponentConfig = {
    friction,
  };

  return {
    id: nextPlatformId('platform_sticky'),
    type: 'platform_sticky',
    x,
    y,
    width,
    height,
    color,
    components: [
      ...basePlatformComponents(x, y, width, height),
      { type: 'renderHint', config: { shape: 'rect', style: 'gooey' } },
      { type: 'sticky', config: stickyConfig as unknown as Record<string, unknown> },
    ],
  };
}

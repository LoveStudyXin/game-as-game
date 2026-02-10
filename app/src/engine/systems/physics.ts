// ============================================================================
// Physics System Configuration Generators
// ============================================================================

import type { SystemDef, GravityMode, SpecialPhysics, WorldBoundary } from '@/engine/types';

/**
 * Create a gravity system configuration based on the selected gravity mode.
 *
 * - normal:   standard gravity (gravityY = 800)
 * - low:      moon-like gravity (gravityY = 300)
 * - shifting: starts at 800, changes over time (runtime handles oscillation)
 * - reverse:  gravity pulls upward (gravityY = -800)
 */
export function createGravitySystem(mode: GravityMode): SystemDef {
  const gravityMap: Record<GravityMode, Record<string, unknown>> = {
    normal: {
      gravityX: 0,
      gravityY: 800,
      shifting: false,
    },
    low: {
      gravityX: 0,
      gravityY: 300,
      shifting: false,
    },
    shifting: {
      gravityX: 0,
      gravityY: 800,
      shifting: true,
      shiftPeriodMs: 10_000,
      shiftMinY: -400,
      shiftMaxY: 800,
    },
    reverse: {
      gravityX: 0,
      gravityY: -800,
      shifting: false,
    },
  };

  return {
    type: 'gravity',
    config: gravityMap[mode],
  };
}

/**
 * Create a friction / surface-physics system based on the special physics type.
 *
 * - elastic:  high bounciness, moderate friction
 * - slippery: low bounciness, nearly no friction (ice-like)
 * - sticky:   no bounce, very high friction (honey-like)
 */
export function createFrictionSystem(physicsType: SpecialPhysics): SystemDef {
  const frictionMap: Record<SpecialPhysics, Record<string, unknown>> = {
    elastic: {
      bounciness: 0.9,
      friction: 0.3,
      airResistance: 0.01,
    },
    slippery: {
      bounciness: 0.1,
      friction: 0.05,
      airResistance: 0.005,
    },
    sticky: {
      bounciness: 0,
      friction: 0.95,
      airResistance: 0.02,
    },
  };

  return {
    type: 'friction',
    config: frictionMap[physicsType],
  };
}

/**
 * Create a basic collision detection system.
 * Handles AABB overlap tests, collision response, and trigger zones.
 */
export function createCollisionSystem(): SystemDef {
  return {
    type: 'collision',
    config: {
      method: 'aabb',
      enableTriggerZones: true,
      separationForce: 1.0,
      layers: {
        player: ['platform', 'enemy', 'collectible', 'projectile', 'block'],
        enemy: ['platform', 'player', 'projectile', 'block'],
        projectile: ['platform', 'enemy', 'player', 'block'],
        collectible: ['player'],
        block: ['player', 'enemy', 'projectile'],
      },
    },
  };
}

/**
 * Create world-bounds configuration that determines behaviour at the edges.
 *
 * - walled:   solid walls on all four sides
 * - loop:     entities exiting one side reappear on the opposite side
 * - infinite: camera follows player; entities off-screen are despawned/paused
 */
export function createWorldBounds(
  boundary: WorldBoundary,
  width: number,
  height: number,
): SystemDef {
  const boundaryConfig: Record<WorldBoundary, Record<string, unknown>> = {
    walled: {
      mode: 'walled',
      wallThickness: 16,
      wallBounce: 0.2,
    },
    loop: {
      mode: 'loop',
      seamless: true,
    },
    infinite: {
      mode: 'infinite',
      despawnMargin: 200,
      cameraFollow: true,
    },
  };

  return {
    type: 'world_bounds',
    config: {
      width,
      height,
      ...boundaryConfig[boundary],
    },
  };
}

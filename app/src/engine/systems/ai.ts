// ============================================================================
// AI Behaviour System Configurations
// ============================================================================

import type { SystemDef } from '@/engine/types';

/**
 * Create a patrol AI system.
 * Entities walk back and forth within a given range at a set speed.
 */
export function createPatrolAI(config: {
  speed: number;
  range: number;
}): SystemDef {
  return {
    type: 'ai_patrol',
    config: {
      speed: config.speed,
      range: config.range,
      pauseAtEndsMs: 0,
      facesMovementDirection: true,
    },
  };
}

/**
 * Create a chaser AI system.
 * Entities pursue the player when within detection radius and disengage
 * when the player exceeds the lose radius.
 */
export function createChaserAI(config: {
  speed: number;
  detectionRadius: number;
  loseRadius: number;
}): SystemDef {
  return {
    type: 'ai_chaser',
    config: {
      speed: config.speed,
      detectionRadius: config.detectionRadius,
      loseRadius: config.loseRadius,
      acceleration: config.speed * 0.5,
      predictPlayerMovement: false,
    },
  };
}

/**
 * Create a shooter AI system.
 * Entities fire projectiles toward the player at a regular interval when
 * the player is within range.
 */
export function createShooterAI(config: {
  fireRate: number;
  bulletSpeed: number;
  range: number;
}): SystemDef {
  return {
    type: 'ai_shooter',
    config: {
      fireRate: config.fireRate,
      bulletSpeed: config.bulletSpeed,
      range: config.range,
      bulletColor: '#FF4444',
      bulletWidth: 8,
      bulletHeight: 8,
      bulletDamage: 1,
      leadTarget: false,
    },
  };
}

/**
 * Create a bouncer AI system.
 * Entities move in bouncing patterns with optional randomness in direction.
 */
export function createBouncerAI(config: {
  speed: number;
  bounceRandomness: number;
}): SystemDef {
  return {
    type: 'ai_bouncer',
    config: {
      speed: config.speed,
      bounceRandomness: config.bounceRandomness,
      affectedByGravity: true,
      minBounceAngle: 30,
      maxBounceAngle: 150,
    },
  };
}

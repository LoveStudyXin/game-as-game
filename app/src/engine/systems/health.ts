// ============================================================================
// Health / Damage System Configuration
// ============================================================================

import type { SystemDef } from '@/engine/types';

/**
 * Create a health system that manages hit-points, invincibility frames,
 * and damage-flash visual feedback.
 *
 * - maxHealth:        starting (and cap) hit-points
 * - invincibilityMs:  post-hit invincibility window
 * - damageFlashMs:    how long the entity flashes after taking damage
 */
export function createHealthSystem(config: {
  maxHealth: number;
  invincibilityMs: number;
  damageFlashMs: number;
}): SystemDef {
  return {
    type: 'health',
    config: {
      maxHealth: config.maxHealth,
      startHealth: config.maxHealth,
      invincibilityMs: config.invincibilityMs,
      damageFlashMs: config.damageFlashMs,
      flashColor: '#FFFFFF',
      flashFrequencyMs: 100,
      deathAnimationMs: 500,
      showHealthBar: config.maxHealth > 1,
      healthBarWidth: 32,
      healthBarHeight: 4,
      healthBarOffsetY: -8,
      healthBarColorFull: '#00FF00',
      healthBarColorLow: '#FF0000',
      lowHealthThreshold: 0.3,
    },
  };
}

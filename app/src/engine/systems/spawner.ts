// ============================================================================
// Dynamic Entity Spawner System Configuration
// ============================================================================

import type { SystemDef } from '@/engine/types';

/** A rectangular region where entities can be spawned */
interface SpawnZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Create a spawner system that dynamically introduces new entities
 * during gameplay.
 *
 * - entityTypes:  array of entity type identifiers eligible for spawning
 * - spawnRate:    average spawns per second
 * - maxEntities:  cap on total alive entities of these types
 * - spawnZones:   rectangular regions where spawning can occur
 */
export function createSpawnerSystem(config: {
  entityTypes: string[];
  spawnRate: number;
  maxEntities: number;
  spawnZones: SpawnZone[];
}): SystemDef {
  return {
    type: 'spawner',
    config: {
      entityTypes: config.entityTypes,
      spawnRate: config.spawnRate,
      maxEntities: config.maxEntities,
      spawnZones: config.spawnZones,
      spawnRandomness: 0.3,
      initialDelay: 2000,
      rampUpDurationMs: 30_000,
      rampUpMultiplier: 1.5,
      avoidPlayerRadius: 100,
      offScreenOnly: false,
    },
  };
}

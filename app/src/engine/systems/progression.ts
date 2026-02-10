// ============================================================================
// Level / Progression System Configuration
// ============================================================================

import type { SystemDef } from '@/engine/types';

/** The condition type that determines how a level is completed */
export type ProgressionType =
  | 'score_threshold'
  | 'collect_all'
  | 'reach_goal'
  | 'survive_time';

/**
 * Create a progression system that defines how the player advances
 * through levels.
 *
 * - type:        what condition completes a level
 *   - score_threshold: reach a target score
 *   - collect_all:     collect every collectible in the level
 *   - reach_goal:      reach a specific goal entity
 *   - survive_time:    survive for a given duration
 * - thresholds:  per-level target values (scores, durations in ms, etc.)
 * - levelCount:  total number of levels
 */
export function createProgressionSystem(config: {
  type: ProgressionType;
  thresholds: number[];
  levelCount: number;
}): SystemDef {
  return {
    type: 'progression',
    config: {
      progressionType: config.type,
      thresholds: config.thresholds,
      levelCount: config.levelCount,
      currentLevel: 0,
      showLevelTransition: true,
      transitionDurationMs: 2000,
      transitionText: 'Level {level}',
      difficultyScalePerLevel: 1.15,
      showProgressBar: config.type === 'score_threshold' || config.type === 'survive_time',
    },
  };
}

// ============================================================================
// Scoring System Configuration
// ============================================================================

import type { SystemDef } from '@/engine/types';

/**
 * Create a scoring system with optional combo support.
 *
 * When combos are enabled, rapid successive score events within the
 * `comboTimeWindow` multiply the score by `comboMultiplier` per hit,
 * up to a configurable maximum.
 */
export function createScoringSystem(config: {
  baseScore: number;
  comboEnabled: boolean;
  comboMultiplier: number;
  comboTimeWindow: number;
}): SystemDef {
  return {
    type: 'scoring',
    config: {
      baseScore: config.baseScore,
      comboEnabled: config.comboEnabled,
      comboMultiplier: config.comboMultiplier,
      comboTimeWindowMs: config.comboTimeWindow,
      maxComboMultiplier: config.comboMultiplier * 5,
      comboDecayMs: config.comboTimeWindow * 1.5,
      displayComboText: config.comboEnabled,
      scorePopupDurationMs: 800,
    },
  };
}

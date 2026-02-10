// ============================================================================
// Pre-configured Chaos Presets (for the chaos slider labels)
// ============================================================================

import type { ChaosConfig } from '@/engine/types';
import { ChaosEngine } from '@/engine/chaos/chaos-engine';

// ---------------------------------------------------------------------------
// Preset Definitions
// ---------------------------------------------------------------------------

/**
 * ORDER (0%) -- No chaos whatsoever.
 * The game plays exactly as designed, fully deterministic.
 */
export const ORDER_PRESET: ChaosConfig = new ChaosEngine(0).getConfig();

/**
 * MILD (25%) -- Gentle, mostly visual mutations.
 * Occasional colour shifts or pixel size changes. Nothing game-breaking.
 */
export const MILD_PRESET: ChaosConfig = new ChaosEngine(25).getConfig();

/**
 * EMERGENT (50%) -- Interesting interactions, entity swaps.
 * Enemies may become friends, bullets may become platforms.
 * Still manageable but surprising.
 */
export const EMERGENT_PRESET: ChaosConfig = new ChaosEngine(50).getConfig();

/**
 * WILD (75%) -- Frequent mutations, rules shifting.
 * Score logic, time flow, and entity sizes can all change.
 * The game becomes a moving target.
 */
export const WILD_PRESET: ChaosConfig = new ChaosEngine(75).getConfig();

/**
 * SURREAL (100%) -- Everything mutates constantly.
 * All categories including narrative mutations. The narrator lies,
 * goals shift, text becomes hostile. Maximum entropy.
 */
export const SURREAL_PRESET: ChaosConfig = new ChaosEngine(100).getConfig();

// ---------------------------------------------------------------------------
// Lookup Helper
// ---------------------------------------------------------------------------

export type ChaosPresetLabel = 'order' | 'mild' | 'emergent' | 'wild' | 'surreal';

const PRESET_MAP: Record<ChaosPresetLabel, ChaosConfig> = {
  order: ORDER_PRESET,
  mild: MILD_PRESET,
  emergent: EMERGENT_PRESET,
  wild: WILD_PRESET,
  surreal: SURREAL_PRESET,
};

/**
 * Get a chaos preset by its label name.
 */
export function getChaosPreset(label: ChaosPresetLabel): ChaosConfig {
  return PRESET_MAP[label];
}

/**
 * Map a numeric chaos level (0-100) to the nearest preset label.
 */
export function chaosLevelToPresetLabel(level: number): ChaosPresetLabel {
  if (level <= 0) return 'order';
  if (level <= 25) return 'mild';
  if (level <= 50) return 'emergent';
  if (level <= 75) return 'wild';
  return 'surreal';
}

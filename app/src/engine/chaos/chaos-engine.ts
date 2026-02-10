// ============================================================================
// Chaos Controller
// ============================================================================

import type { ChaosConfig } from '@/engine/types';
import {
  getEligibleMutations,
  type Mutation,
  type MutationCategory,
} from '@/engine/chaos/mutations';

// ---------------------------------------------------------------------------
// Chaos Level Tier Definitions
// ---------------------------------------------------------------------------

interface ChaosTier {
  mutationFrequencyMs: number;
  maxActiveMutations: number;
  allowedCategories: MutationCategory[];
}

function getTier(level: number): ChaosTier {
  if (level <= 0) {
    return {
      mutationFrequencyMs: Infinity,
      maxActiveMutations: 0,
      allowedCategories: [],
    };
  }

  if (level <= 30) {
    return {
      mutationFrequencyMs: 90_000,
      maxActiveMutations: 1,
      allowedCategories: ['physics', 'visual'],
    };
  }

  if (level <= 60) {
    return {
      mutationFrequencyMs: 60_000,
      maxActiveMutations: 2,
      allowedCategories: ['physics', 'visual', 'entity'],
    };
  }

  if (level <= 90) {
    return {
      mutationFrequencyMs: 30_000,
      maxActiveMutations: 3,
      allowedCategories: ['physics', 'visual', 'entity', 'rule'],
    };
  }

  // 91 - 100: surreal tier
  return {
    mutationFrequencyMs: 15_000,
    maxActiveMutations: Infinity,
    allowedCategories: ['physics', 'visual', 'entity', 'rule', 'narrative'],
  };
}

// ---------------------------------------------------------------------------
// ChaosEngine
// ---------------------------------------------------------------------------

/**
 * The ChaosEngine manages mutation scheduling, selection, and lifecycle
 * based on the configured chaos level (0-100).
 *
 * Level mapping:
 *   0:      no mutations
 *   1-30:   every 90 s, max 1 active, physics + visual only
 *   31-60:  every 60 s, max 2 active, + entity
 *   61-90:  every 30 s, max 3 active, + rule
 *   91-100: every 15 s, unlimited,    all categories including narrative
 */
export class ChaosEngine {
  private level: number;
  private tier: ChaosTier;

  constructor(chaosLevel: number) {
    this.level = Math.max(0, Math.min(100, chaosLevel));
    this.tier = getTier(this.level);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Build a ChaosConfig object suitable for inclusion in a GameConfig.
   */
  getConfig(): ChaosConfig {
    const eligible = this.getAvailableMutations();
    return {
      level: this.level,
      mutations: eligible.map((m) => m.id),
      mutationFrequencyMs: this.tier.mutationFrequencyMs,
      maxActiveMutations: this.tier.maxActiveMutations === Infinity
        ? 999
        : this.tier.maxActiveMutations,
    };
  }

  /**
   * Select the next mutation to activate.
   * Picks a random eligible mutation that is not already active.
   * Returns undefined if no eligible mutations remain.
   */
  selectNextMutation(activeMutationIds: string[]): Mutation | undefined {
    const activeSet = new Set(activeMutationIds);
    const candidates = this.getAvailableMutations().filter(
      (m) => !activeSet.has(m.id),
    );

    if (candidates.length === 0) return undefined;

    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  /**
   * Determine whether a new mutation should trigger right now.
   *
   * @param elapsedMs     total time elapsed since the game started
   * @param lastTriggerMs timestamp (ms since start) of the last mutation trigger
   */
  shouldTrigger(elapsedMs: number, lastTriggerMs: number): boolean {
    if (this.level <= 0) return false;
    if (this.tier.mutationFrequencyMs === Infinity) return false;
    return (elapsedMs - lastTriggerMs) >= this.tier.mutationFrequencyMs;
  }

  /**
   * Get the current chaos level.
   */
  getLevel(): number {
    return this.level;
  }

  /**
   * Update the chaos level at runtime (e.g. via a slider or game event).
   */
  setLevel(newLevel: number): void {
    this.level = Math.max(0, Math.min(100, newLevel));
    this.tier = getTier(this.level);
  }

  // -----------------------------------------------------------------------
  // Internal Helpers
  // -----------------------------------------------------------------------

  /**
   * Get the full list of mutations available at the current chaos level,
   * filtered by the tier's allowed categories.
   */
  private getAvailableMutations(): Mutation[] {
    const eligible = getEligibleMutations(this.level);
    const allowedSet = new Set(this.tier.allowedCategories);
    return eligible.filter((m) => allowedSet.has(m.category));
  }
}

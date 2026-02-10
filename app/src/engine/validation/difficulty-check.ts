// ============================================================================
// Difficulty Validation (PX-02)
//
// Checks that the generated difficulty curve is neither too flat (boring),
// too steep (frustrating), nor monotonically increasing (exhausting).
// ============================================================================

import type { GameConfig } from '@/engine/types';

// ---------------------------------------------------------------------------
// Validation Result (same shape as meaningful-play for consistency)
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Difficulty of the first level must be below this to feel accessible. */
const MAX_INITIAL_DIFFICULTY = 0.4;

/** The range of the curve (max - min) must be at least this wide. */
const MIN_CURVE_RANGE = 0.15;

/** Maximum consecutive "strictly increasing" steps before we flag monotonicity. */
const MAX_MONOTONE_RUN = 5;

/** The steepest allowed single-step increase. */
const MAX_SINGLE_STEP = 0.35;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the range (max - min) of a numeric array.
 */
function curveRange(curve: number[]): number {
  if (curve.length === 0) return 0;
  let min = curve[0];
  let max = curve[0];
  for (const v of curve) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

/**
 * Find the longest run of strictly increasing values.
 */
function longestIncreasingRun(curve: number[]): number {
  if (curve.length < 2) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i] > curve[i - 1]) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

/**
 * Find the maximum single-step increase in the curve.
 */
function maxStepIncrease(curve: number[]): number {
  let maxStep = 0;
  for (let i = 1; i < curve.length; i++) {
    const step = curve[i] - curve[i - 1];
    if (step > maxStep) maxStep = step;
  }
  return maxStep;
}

/**
 * Check whether the curve contains at least one "dip" (a decrease) to serve
 * as a breathing room for the player.
 */
function hasBreathingRoom(curve: number[]): boolean {
  for (let i = 1; i < curve.length; i++) {
    if (curve[i] < curve[i - 1]) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate the difficulty curve embedded in a GameConfig.
 *
 * Checks:
 * 1. Curve is not empty or degenerate.
 * 2. First level is accessible (difficulty < 0.4).
 * 3. Curve is not too flat (range >= 0.15).
 * 4. Curve is not monotonically increasing without breathing rooms.
 * 5. No single step is too steep (> 0.35 jump).
 */
export function validateDifficulty(config: GameConfig): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const { curve } = config.difficulty;

  // ---- Degenerate checks ----

  if (!curve || curve.length === 0) {
    warnings.push('Difficulty curve is empty. The game has no difficulty progression at all.');
    return { valid: false, warnings, suggestions };
  }

  if (curve.length < 3) {
    suggestions.push(
      `Difficulty curve has only ${curve.length} point(s). Consider at least 5 points for a meaningful progression arc.`,
    );
  }

  // ---- Check 1: First level accessibility ----

  if (curve[0] > MAX_INITIAL_DIFFICULTY) {
    warnings.push(
      `Initial difficulty is ${curve[0].toFixed(2)}, which exceeds the accessibility threshold of ${MAX_INITIAL_DIFFICULTY}. New players may feel overwhelmed.`,
    );
  }

  // ---- Check 2: Flatness ----

  const range = curveRange(curve);
  if (range < MIN_CURVE_RANGE) {
    warnings.push(
      `Difficulty curve range is only ${range.toFixed(2)}. A range below ${MIN_CURVE_RANGE} feels flat and boring.`,
    );
  }

  // ---- Check 3: Monotonicity / breathing room ----

  const monoRun = longestIncreasingRun(curve);
  if (monoRun > MAX_MONOTONE_RUN) {
    suggestions.push(
      `The curve has a run of ${monoRun} consecutively increasing levels. Consider inserting a dip or plateau to let the player recover.`,
    );
  }

  if (curve.length >= 5 && !hasBreathingRoom(curve)) {
    warnings.push(
      'The difficulty curve never decreases. Players need occasional "breathing rooms" where pressure eases before climbing again.',
    );
  }

  // ---- Check 4: Steep single-step jump ----

  const steepest = maxStepIncrease(curve);
  if (steepest > MAX_SINGLE_STEP) {
    suggestions.push(
      `The largest single-step difficulty increase is ${steepest.toFixed(2)}. Steps above ${MAX_SINGLE_STEP} can feel like hitting a wall.`,
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

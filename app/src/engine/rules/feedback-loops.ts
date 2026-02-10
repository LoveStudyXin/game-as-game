// ============================================================================
// Feedback Loop Definitions (SY-02 Skill)
// ============================================================================

import type { FeedbackLoop, CoreVerb, DifficultyStyle } from '@/engine/types';

// ---------------------------------------------------------------------------
// Positive Feedback Loops
// ---------------------------------------------------------------------------

/**
 * Generate positive feedback loops based on the active verbs and difficulty.
 *
 * Positive loops amplify player performance:
 * "more score -> faster movement -> easier to score more"
 *
 * In relaxed/steady difficulties these are stronger (the game gets easier
 * the better you do). In hardcore they are weaker.
 */
export function getPositiveFeedbackLoops(
  verbs: CoreVerb[],
  difficulty: DifficultyStyle,
): FeedbackLoop[] {
  const loops: FeedbackLoop[] = [];
  const verbSet = new Set(verbs);

  // Universal: combo multiplier loop
  loops.push({
    type: 'positive',
    description: 'Successive successful actions increase combo multiplier, yielding more points per action',
    variables: ['combo_multiplier', 'score_rate', 'player_confidence'],
  });

  if (verbSet.has('jump')) {
    loops.push({
      type: 'positive',
      description: 'Consecutive precision jumps grant a speed boost, making it easier to reach platforms',
      variables: ['jump_streak', 'movement_speed', 'platform_reach'],
    });
  }

  if (verbSet.has('shoot')) {
    loops.push({
      type: 'positive',
      description: 'Kill streaks increase fire rate temporarily, making it easier to extend the streak',
      variables: ['kill_streak', 'fire_rate', 'score_per_kill'],
    });
  }

  if (verbSet.has('collect')) {
    loops.push({
      type: 'positive',
      description: 'Collecting items increases magnet radius, making nearby items easier to collect',
      variables: ['items_collected', 'collect_radius', 'collection_speed'],
    });
  }

  if (verbSet.has('dodge')) {
    loops.push({
      type: 'positive',
      description: 'Successful dodges charge a power meter that slows time, making dodging even easier',
      variables: ['dodge_streak', 'time_slow_factor', 'dodge_window'],
    });
  }

  if (verbSet.has('build')) {
    loops.push({
      type: 'positive',
      description: 'Building structures grants resource bonuses, enabling more building',
      variables: ['blocks_placed', 'resource_generation', 'build_speed'],
    });
  }

  // Scale loop strength based on difficulty
  if (difficulty === 'hardcore') {
    // In hardcore, positive loops are weaker: remove the universal combo loop
    return loops.slice(1);
  }

  return loops;
}

// ---------------------------------------------------------------------------
// Negative Feedback Loops
// ---------------------------------------------------------------------------

/**
 * Generate negative feedback loops (rubber-banding) based on verbs and difficulty.
 *
 * Negative loops dampen runaway advantages:
 * "more enemies killed -> stronger enemies spawn"
 *
 * In hardcore mode these are stronger (the game fights back harder).
 * In relaxed mode these are weaker.
 */
export function getNegativeFeedbackLoops(
  verbs: CoreVerb[],
  difficulty: DifficultyStyle,
): FeedbackLoop[] {
  const loops: FeedbackLoop[] = [];
  const verbSet = new Set(verbs);

  // Universal: difficulty escalation
  loops.push({
    type: 'negative',
    description: 'As the player scores higher, enemy spawn rate and speed increase proportionally',
    variables: ['player_score', 'enemy_spawn_rate', 'enemy_speed'],
  });

  if (verbSet.has('jump')) {
    loops.push({
      type: 'negative',
      description: 'As the player progresses, platforms become smaller and gaps wider',
      variables: ['levels_cleared', 'platform_width', 'gap_distance'],
    });
  }

  if (verbSet.has('shoot')) {
    loops.push({
      type: 'negative',
      description: 'Enemies killed increase the health and armour of subsequent spawns',
      variables: ['total_kills', 'enemy_health', 'enemy_armor'],
    });
  }

  if (verbSet.has('collect')) {
    loops.push({
      type: 'negative',
      description: 'More items collected causes remaining items to move or hide more aggressively',
      variables: ['collection_progress', 'item_evasion_speed', 'item_hide_chance'],
    });
  }

  if (verbSet.has('dodge')) {
    loops.push({
      type: 'negative',
      description: 'Successful dodges cause enemies to attack in tighter, faster patterns',
      variables: ['dodge_count', 'attack_frequency', 'attack_pattern_complexity'],
    });
  }

  if (verbSet.has('build')) {
    loops.push({
      type: 'negative',
      description: 'More structures built attract more enemies and environmental hazards',
      variables: ['structure_count', 'enemy_aggression', 'hazard_frequency'],
    });
  }

  // Scale loop strength based on difficulty
  if (difficulty === 'relaxed') {
    // In relaxed mode, negative loops are weaker: only keep the universal one
    return loops.slice(0, 1);
  }

  return loops;
}

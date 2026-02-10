// ============================================================================
// Pre-defined Rule Sets for Verb Combinations
// ============================================================================

import type { RuleDef, CoreVerb } from '@/engine/types';

// ---------------------------------------------------------------------------
// Platformer Rules
// ---------------------------------------------------------------------------

/**
 * Basic platformer rules:
 * - Falling off the world = damage
 * - Collecting a coin = score
 * - Landing on enemy = enemy dies + score
 * - Touching enemy from side = damage
 */
export function getPlatformerRules(): RuleDef[] {
  return [
    {
      trigger: 'player_fall_out',
      action: 'damage_player',
      effect: 'health-1',
    },
    {
      trigger: 'player_collect_coin',
      action: 'add_score',
      effect: 'score+1',
    },
    {
      trigger: 'player_stomp_enemy',
      action: 'kill_enemy_and_score',
      effect: 'score+2',
    },
    {
      trigger: 'player_stomp_enemy',
      action: 'destroy_enemy',
      effect: 'spawn:particle_burst',
    },
    {
      trigger: 'enemy_touch_player',
      condition: 'health>0',
      action: 'damage_player',
      effect: 'health-1',
    },
    {
      trigger: 'player_reach_goal',
      action: 'complete_level',
      effect: 'level+1',
    },
  ];
}

// ---------------------------------------------------------------------------
// Shooter Rules
// ---------------------------------------------------------------------------

/**
 * Shooting rules:
 * - Bullet hits enemy = score + enemy dies
 * - Enemy bullet hits player = damage
 * - Kill streak = bonus score
 */
export function getShooterRules(): RuleDef[] {
  return [
    {
      trigger: 'bullet_hit_enemy',
      action: 'kill_enemy_and_score',
      effect: 'score+3',
    },
    {
      trigger: 'bullet_hit_enemy',
      action: 'destroy_enemy',
      effect: 'spawn:particle_burst',
    },
    {
      trigger: 'enemy_bullet_hit_player',
      condition: 'health>0',
      action: 'damage_player',
      effect: 'health-1',
    },
    {
      trigger: 'kill_streak_5',
      action: 'bonus_score',
      effect: 'score+10',
    },
    {
      trigger: 'player_shoot',
      action: 'spawn_bullet',
      effect: 'spawn:player_bullet',
    },
  ];
}

// ---------------------------------------------------------------------------
// Collector Rules
// ---------------------------------------------------------------------------

/**
 * Collection rules:
 * - Collect item = score
 * - Collect all items = level complete
 * - Collect power-up = temporary buff
 * - Collect key = unlock gate
 */
export function getCollectorRules(): RuleDef[] {
  return [
    {
      trigger: 'player_collect_item',
      action: 'add_score',
      effect: 'score+1',
    },
    {
      trigger: 'player_collect_powerup',
      action: 'apply_powerup',
      effect: 'flag=powerup_active',
    },
    {
      trigger: 'player_collect_key',
      action: 'unlock_gate',
      effect: 'flag=key_collected',
    },
    {
      trigger: 'all_items_collected',
      action: 'complete_level',
      effect: 'level+1',
    },
    {
      trigger: 'player_collect_health',
      action: 'heal_player',
      effect: 'health+1',
    },
  ];
}

// ---------------------------------------------------------------------------
// Dodger Rules
// ---------------------------------------------------------------------------

/**
 * Dodging rules:
 * - Successfully dodge an enemy = score
 * - Get hit = damage
 * - Survive time threshold = bonus score
 * - Near miss = extra score
 */
export function getDodgerRules(): RuleDef[] {
  return [
    {
      trigger: 'player_dodge_enemy',
      action: 'dodge_score',
      effect: 'score+2',
    },
    {
      trigger: 'enemy_touch_player',
      condition: 'health>0',
      action: 'damage_player',
      effect: 'health-1',
    },
    {
      trigger: 'near_miss',
      action: 'near_miss_bonus',
      effect: 'score+3',
    },
    {
      trigger: 'survive_10s',
      action: 'survival_bonus',
      effect: 'score+5',
    },
    {
      trigger: 'player_dash',
      action: 'trigger_invincibility',
      effect: 'flag=invincible',
    },
  ];
}

// ---------------------------------------------------------------------------
// Builder Rules
// ---------------------------------------------------------------------------

/**
 * Building rules:
 * - Place block = costs resource
 * - Block supports player = valid placement
 * - Block hit by enemy = block destroyed
 * - Build bridge to goal = level complete
 */
export function getBuilderRules(): RuleDef[] {
  return [
    {
      trigger: 'player_place_block',
      action: 'create_block',
      effect: 'spawn:block',
    },
    {
      trigger: 'block_supports_player',
      action: 'valid_placement',
      effect: 'score+1',
    },
    {
      trigger: 'enemy_hit_block',
      action: 'destroy_block',
      effect: 'spawn:particle_burst',
    },
    {
      trigger: 'player_reach_goal',
      action: 'complete_level',
      effect: 'level+1',
    },
    {
      trigger: 'block_chain_complete',
      action: 'chain_bonus',
      effect: 'score+5',
    },
  ];
}

// ---------------------------------------------------------------------------
// Combined Rules
// ---------------------------------------------------------------------------

/**
 * Merge rule sets for games that use multiple verbs.
 * Deduplicates rules with identical trigger+action+effect combinations.
 */
export function getCombinedRules(verbs: CoreVerb[]): RuleDef[] {
  const allRules: RuleDef[] = [];
  const verbSet = new Set(verbs);

  // Always include platformer basics (movement is always present)
  allRules.push(...getPlatformerRules());

  if (verbSet.has('shoot')) {
    allRules.push(...getShooterRules());
  }

  if (verbSet.has('collect')) {
    allRules.push(...getCollectorRules());
  }

  if (verbSet.has('dodge')) {
    allRules.push(...getDodgerRules());
  }

  if (verbSet.has('build')) {
    allRules.push(...getBuilderRules());
  }

  // Deduplicate by trigger + action + effect
  const seen = new Set<string>();
  const deduplicated: RuleDef[] = [];

  for (const rule of allRules) {
    const key = `${rule.trigger}|${rule.action}|${rule.effect}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(rule);
    }
  }

  return deduplicated;
}

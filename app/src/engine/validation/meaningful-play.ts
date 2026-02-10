// ============================================================================
// Meaningful Play Validation (PX-04)
//
// Every player action must be:
//   1. Discernible -- the player can perceive the result of their action.
//   2. Integrated  -- the action affects the larger game state and progression.
//
// This module inspects a fully-generated GameConfig and produces warnings
// when either property is at risk.
// ============================================================================

import type { GameConfig, CoreVerb, SystemDef, RuleDef } from '@/engine/types';

// ---------------------------------------------------------------------------
// Validation Result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  /** `true` if no blocking problems were found */
  valid: boolean;
  /** Issues that should be addressed before shipping the game */
  warnings: string[];
  /** Non-blocking suggestions to improve quality */
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// System mapping -- which system types correspond to each verb
// ---------------------------------------------------------------------------

const VERB_SYSTEM_MAP: Record<CoreVerb, string[]> = {
  jump: ['physics', 'movement', 'jump'],
  shoot: ['shooting', 'projectile', 'combat'],
  collect: ['collection', 'pickup', 'collectible'],
  dodge: ['dodge', 'movement', 'dash'],
  build: ['building', 'placement', 'construction'],
  explore: ['exploration', 'movement', 'discovery'],
  push: ['physics', 'movement', 'pushing'],
  activate: ['interaction', 'trigger', 'activation'],
  craft: ['crafting', 'inventory', 'combination'],
  defend: ['defense', 'shielding', 'combat'],
  dash: ['dash', 'movement', 'speed'],
};

/**
 * Check whether at least one system exists that is relevant to the given verb.
 */
function hasSystemForVerb(systems: SystemDef[], verb: CoreVerb): boolean {
  const expected = VERB_SYSTEM_MAP[verb];
  return systems.some((s) => expected.includes(s.type));
}

// ---------------------------------------------------------------------------
// Rule effect inspection
// ---------------------------------------------------------------------------

/**
 * Check whether at least one rule references an effect that implies visual
 * feedback (e.g. particle, flash, sound, animation).
 */
function hasVisibleEffect(rules: RuleDef[]): boolean {
  const VISIBLE_KEYWORDS = [
    'particle',
    'flash',
    'sound',
    'animation',
    'shake',
    'color',
    'glow',
    'spawn',
    'destroy',
    'score',
    'text',
  ];
  return rules.some((r) =>
    VISIBLE_KEYWORDS.some((kw) => r.effect.toLowerCase().includes(kw)),
  );
}

/**
 * Check whether scoring exists for at least one verb.
 */
function hasScoringForVerbs(rules: RuleDef[], verbs: CoreVerb[]): boolean {
  return rules.some(
    (r) =>
      r.effect.toLowerCase().includes('score') &&
      verbs.some(
        (v) =>
          r.trigger.toLowerCase().includes(v) ||
          r.action.toLowerCase().includes(v),
      ),
  );
}

/**
 * Check whether rules connect to any form of progression (level, unlock, etc.)
 */
function hasProgressionLink(rules: RuleDef[]): boolean {
  const PROGRESSION_KEYWORDS = [
    'level',
    'unlock',
    'progress',
    'advance',
    'next',
    'complete',
    'win',
    'stage',
  ];
  return rules.some((r) =>
    PROGRESSION_KEYWORDS.some(
      (kw) =>
        r.effect.toLowerCase().includes(kw) ||
        r.action.toLowerCase().includes(kw),
    ),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate that a GameConfig satisfies the two pillars of Meaningful Play:
 *
 * **Discernible** -- the player can see / hear / feel every action result.
 * **Integrated** -- player actions feed back into state and progression.
 */
export function validateMeaningfulPlay(config: GameConfig): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // ---- Discernible checks ----

  // Check 1a: Every verb should map to at least one active system.
  for (const verb of config.verbs) {
    if (!hasSystemForVerb(config.systems, verb)) {
      warnings.push(
        `Verb "${verb}" has no corresponding system. The player will press the button and nothing will happen.`,
      );
    }
  }

  // Check 1b: Rules should produce visible effects.
  if (config.rules.length > 0 && !hasVisibleEffect(config.rules)) {
    suggestions.push(
      'None of the rules produce an obviously visible effect (particle, flash, score change). Consider adding visual feedback so the player can perceive rule outcomes.',
    );
  }

  // Check 1c: At least one rule should exist per verb.
  for (const verb of config.verbs) {
    const verbHasRule = config.rules.some(
      (r) =>
        r.trigger.toLowerCase().includes(verb) ||
        r.action.toLowerCase().includes(verb) ||
        r.condition?.toLowerCase().includes(verb),
    );
    if (!verbHasRule) {
      suggestions.push(
        `No rule references the "${verb}" verb. The action may feel disconnected from the game world.`,
      );
    }
  }

  // ---- Integrated checks ----

  // Check 2a: Scoring should exist for at least one verb.
  if (!hasScoringForVerbs(config.rules, config.verbs)) {
    warnings.push(
      'No scoring rule is linked to any player verb. Actions will feel pointless because they do not affect the score.',
    );
  }

  // Check 2b: Rules should connect to progression.
  if (!hasProgressionLink(config.rules)) {
    suggestions.push(
      'No rule connects to a progression mechanic (level advance, unlock, etc.). The game may lack a sense of forward motion.',
    );
  }

  // Check 2c: Feedback loops should exist.
  if (config.feedbackLoops.length === 0) {
    suggestions.push(
      'No feedback loops defined. Adding at least one positive and one negative loop improves the feeling that actions have consequences.',
    );
  }

  // Check 2d: Narrative events should exist.
  if (config.narrative.events.length === 0) {
    suggestions.push(
      'No narrative events. Even minimal story beats help the player feel that their actions matter.',
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Core Rule Engine
// ============================================================================

import type { RuleDef } from '@/engine/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal game state interface that the rule engine operates on */
export interface GameState {
  score: number;
  health: number;
  combo: number;
  level: number;
  timeElapsedMs: number;
  entities: Record<string, unknown>[];
  flags: Record<string, boolean>;
  [key: string]: unknown;
}

/** A parsed effect produced by the rule engine */
export interface ParsedEffect {
  type: 'score' | 'health' | 'spawn' | 'chaos' | 'flag' | 'level' | 'speed' | 'custom';
  operator: '+' | '-' | ':' | '=' | 'trigger';
  value: string | number;
}

// ---------------------------------------------------------------------------
// Effect Parser
// ---------------------------------------------------------------------------

/**
 * Parse an effect string into a structured ParsedEffect.
 *
 * Supported formats:
 *   "score+1"       -> { type: 'score',  operator: '+', value: 1 }
 *   "health-1"      -> { type: 'health', operator: '-', value: 1 }
 *   "spawn:enemy"   -> { type: 'spawn',  operator: ':', value: 'enemy' }
 *   "chaos:trigger" -> { type: 'chaos',  operator: 'trigger', value: 'trigger' }
 *   "flag=collected" -> { type: 'flag',  operator: '=', value: 'collected' }
 *   "level+1"       -> { type: 'level',  operator: '+', value: 1 }
 *   "speed+50"      -> { type: 'speed',  operator: '+', value: 50 }
 */
export function parseEffect(effect: string): ParsedEffect {
  // Try arithmetic operators first: score+1, health-1
  const arithmeticMatch = effect.match(/^(\w+)([+\-])(\d+(?:\.\d+)?)$/);
  if (arithmeticMatch) {
    const [, typePart, op, val] = arithmeticMatch;
    return {
      type: typePart as ParsedEffect['type'],
      operator: op as '+' | '-',
      value: parseFloat(val),
    };
  }

  // Try colon operator: spawn:enemy, chaos:trigger
  const colonMatch = effect.match(/^(\w+):(\w+)$/);
  if (colonMatch) {
    const [, typePart, val] = colonMatch;
    if (val === 'trigger') {
      return {
        type: typePart as ParsedEffect['type'],
        operator: 'trigger',
        value: 'trigger',
      };
    }
    return {
      type: typePart as ParsedEffect['type'],
      operator: ':',
      value: val,
    };
  }

  // Try assignment operator: flag=collected
  const assignMatch = effect.match(/^(\w+)=(\w+)$/);
  if (assignMatch) {
    const [, typePart, val] = assignMatch;
    return {
      type: typePart as ParsedEffect['type'],
      operator: '=',
      value: val,
    };
  }

  // Fallback: treat as custom
  return {
    type: 'custom',
    operator: 'trigger',
    value: effect,
  };
}

// ---------------------------------------------------------------------------
// Condition Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate a simple condition string against game state.
 *
 * Supported formats:
 *   "health>0"       -> gameState.health > 0
 *   "score>=100"     -> gameState.score >= 100
 *   "flag:collected" -> gameState.flags.collected === true
 *   "has:shoot"      -> checks if a verb/capability is present
 *   undefined/empty  -> always true
 */
export function evaluateCondition(condition: string | undefined, gameState: GameState): boolean {
  if (!condition || condition.trim() === '') return true;

  // Flag check: "flag:name"
  const flagMatch = condition.match(/^flag:(\w+)$/);
  if (flagMatch) {
    return gameState.flags[flagMatch[1]] === true;
  }

  // Has check: "has:ability"
  const hasMatch = condition.match(/^has:(\w+)$/);
  if (hasMatch) {
    const abilities = gameState['abilities'] as string[] | undefined;
    return Array.isArray(abilities) && abilities.includes(hasMatch[1]);
  }

  // Comparison: "property>=value", "property>value", "property<=value",
  //             "property<value", "property==value"
  const compMatch = condition.match(/^(\w+)(>=|<=|==|!=|>|<)(\d+(?:\.\d+)?)$/);
  if (compMatch) {
    const [, prop, op, valStr] = compMatch;
    const stateVal = Number(gameState[prop] ?? 0);
    const target = parseFloat(valStr);

    switch (op) {
      case '>':  return stateVal > target;
      case '>=': return stateVal >= target;
      case '<':  return stateVal < target;
      case '<=': return stateVal <= target;
      case '==': return stateVal === target;
      case '!=': return stateVal !== target;
      default:   return false;
    }
  }

  // Unknown condition format -- default to true
  return true;
}

// ---------------------------------------------------------------------------
// Rule Engine
// ---------------------------------------------------------------------------

/**
 * The RuleEngine evaluates declarative rules against the current game state
 * and produces a list of effects to apply.
 */
export class RuleEngine {
  private rules: RuleDef[];

  constructor(rules: RuleDef[]) {
    this.rules = rules;
  }

  /** Replace the entire rule set (e.g. when chaos mutates the rules). */
  setRules(rules: RuleDef[]): void {
    this.rules = rules;
  }

  /** Add additional rules without replacing existing ones. */
  addRules(rules: RuleDef[]): void {
    this.rules = [...this.rules, ...rules];
  }

  /** Remove rules whose trigger matches the given string. */
  removeRulesByTrigger(trigger: string): void {
    this.rules = this.rules.filter((r) => r.trigger !== trigger);
  }

  /** Get the current rule set (read-only copy). */
  getRules(): RuleDef[] {
    return [...this.rules];
  }

  /**
   * Evaluate a single rule against the game state.
   * Returns true if the trigger is relevant and the condition is met.
   */
  evaluateRule(rule: RuleDef, gameState: GameState): boolean {
    return evaluateCondition(rule.condition, gameState);
  }

  /**
   * Apply an effect string to the game state, mutating it in place.
   * Returns the parsed effect for consumers that need to react to it.
   */
  applyEffect(effect: string, gameState: GameState): ParsedEffect {
    const parsed = parseEffect(effect);

    switch (parsed.type) {
      case 'score':
        if (parsed.operator === '+') gameState.score += parsed.value as number;
        if (parsed.operator === '-') gameState.score -= parsed.value as number;
        break;

      case 'health':
        if (parsed.operator === '+') gameState.health += parsed.value as number;
        if (parsed.operator === '-') gameState.health -= parsed.value as number;
        break;

      case 'level':
        if (parsed.operator === '+') gameState.level += parsed.value as number;
        break;

      case 'flag':
        if (parsed.operator === '=') {
          gameState.flags[parsed.value as string] = true;
        }
        break;

      case 'spawn':
        // Spawn effects are handled by the spawner system at runtime;
        // we record the request so it can be consumed.
        break;

      case 'chaos':
        // Chaos triggers are handled by the chaos engine at runtime.
        break;

      default:
        break;
    }

    return parsed;
  }

  /**
   * Process all rules for a given trigger event.
   * Returns the list of effects that were applied.
   */
  processEvent(trigger: string, gameState: GameState): ParsedEffect[] {
    const effects: ParsedEffect[] = [];

    for (const rule of this.rules) {
      if (rule.trigger !== trigger) continue;
      if (!this.evaluateRule(rule, gameState)) continue;

      const parsed = this.applyEffect(rule.effect, gameState);
      effects.push(parsed);
    }

    return effects;
  }
}

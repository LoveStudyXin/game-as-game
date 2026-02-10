// ============================================================================
// Event Generation (NR-01 Dialogue + NR-05 Branching Narrative)
//
// Generates a diamond-structure event chain whose prose is influenced by:
//   - the world's "key difference"
//   - the player's character archetype
//   - the active core verbs
//   - the current chaos level (higher = more surreal language)
// ============================================================================

import type { NarrativeEvent, CoreVerb } from '@/engine/types';
import { fillDiamondTemplate } from '@/engine/narrative/templates/diamond';
import { resolveTemplate } from '@/engine/narrative/world-gen';

// ---------------------------------------------------------------------------
// Chaos Flavour Modifiers
// ---------------------------------------------------------------------------

/**
 * The chaos level (0-100) is quantised into tiers. Each tier applies
 * increasingly surreal modifiers to the prose.
 */
interface ChaosTier {
  threshold: number;
  prefix: string;
  suffix: string;
}

const CHAOS_TIERS: ChaosTier[] = [
  { threshold: 0, prefix: '', suffix: '' },
  { threshold: 20, prefix: 'Strange ripples cross the sky. ', suffix: ' Something feels off.' },
  {
    threshold: 40,
    prefix: 'Reality shudders. ',
    suffix: ' The rules you thought you knew are bending.',
  },
  {
    threshold: 60,
    prefix: 'The world glitches -- colors bleed, edges dissolve. ',
    suffix: ' Nothing is certain anymore.',
  },
  {
    threshold: 80,
    prefix: 'EVERYTHING IS FOLDING. Geometry screams. ',
    suffix: ' You are not sure you are still yourself.',
  },
];

function getChaosTier(level: number): ChaosTier {
  let tier = CHAOS_TIERS[0];
  for (const t of CHAOS_TIERS) {
    if (level >= t.threshold) tier = t;
  }
  return tier;
}

// ---------------------------------------------------------------------------
// Verb Phrase Mapping
// ---------------------------------------------------------------------------

const VERB_PHRASES: Record<CoreVerb, string> = {
  jump: 'leap and soar',
  shoot: 'aim and fire',
  collect: 'gather and hoard',
  dodge: 'weave and evade',
  build: 'create and construct',
  explore: 'wander and discover',
  push: 'push and rearrange',
  activate: 'trigger and unlock',
  craft: 'combine and forge',
  defend: 'shield and protect',
  dash: 'rush and blur',
};

/**
 * Condense a list of verbs into a single readable phrase.
 *  - 1 verb  : "leap and soar"
 *  - 2 verbs : "leap and soar, and aim and fire"
 *  - 3+ verbs: "leap, aim, and build"
 */
function verbsToPhrase(verbs: CoreVerb[]): string {
  if (verbs.length === 0) return 'act';
  if (verbs.length === 1) return VERB_PHRASES[verbs[0]];
  if (verbs.length === 2) {
    return `${VERB_PHRASES[verbs[0]]}, and ${VERB_PHRASES[verbs[1]]}`;
  }
  const short = verbs.map((v) => v);
  return short.slice(0, -1).join(', ') + ', and ' + short[short.length - 1];
}

// ---------------------------------------------------------------------------
// World Description Shortener
// ---------------------------------------------------------------------------

/**
 * The full world description from world-gen.ts can be quite long.  For
 * interpolation inside diamond-template prose, we extract a short phrase.
 */
function shortenWorldDescription(worldDifference: string): string {
  const templateKey = resolveTemplate(worldDifference);
  if (templateKey) {
    const SHORT_MAP: Record<string, string> = {
      colors_alive: 'colors are living beings',
      sound_solid: 'sounds crystallize into solid objects',
      memory_touch: 'memories can be touched and traded',
      time_uneven: 'time flows at different speeds',
    };
    return SHORT_MAP[templateKey] ?? worldDifference;
  }
  // Custom text -- truncate if too long
  if (worldDifference.length > 80) {
    return worldDifference.slice(0, 77) + '...';
  }
  return worldDifference;
}

// ---------------------------------------------------------------------------
// Chaos Post-Processing
// ---------------------------------------------------------------------------

/**
 * Apply chaos modifiers to a set of events. Higher chaos levels prepend /
 * append surreal flavour text.
 */
function applyChaos(events: NarrativeEvent[], chaosLevel: number): NarrativeEvent[] {
  const tier = getChaosTier(chaosLevel);
  if (!tier.prefix && !tier.suffix) return events;

  return events.map((ev) => ({
    ...ev,
    text: `${tier.prefix}${ev.text}${tier.suffix}`,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a full diamond-structure event chain.
 *
 * @param worldDifference - Template key (e.g. `'colors_alive'`) or custom text.
 * @param archetype       - Character archetype label.
 * @param verbs           - The core verbs the player chose.
 * @param chaosLevel      - 0-100 chaos value.
 * @returns An ordered array of {@link NarrativeEvent} objects.
 */
export function generateEvents(
  worldDifference: string,
  archetype: string,
  verbs: CoreVerb[],
  chaosLevel: number,
): NarrativeEvent[] {
  const worldPhrase = shortenWorldDescription(worldDifference);
  const verbPhrase = verbsToPhrase(verbs);

  // Fill the diamond template
  const events = fillDiamondTemplate(worldPhrase, archetype, verbPhrase);

  // Apply chaos modifiers
  return applyChaos(events, chaosLevel);
}

export { VERB_PHRASES, CHAOS_TIERS };

// ============================================================================
// World Generation (NR-03 "Key Difference" Skill)
// Generates narrative world descriptions based on the user's chosen
// "key difference" -- the single rule that makes this world unique.
// ============================================================================

import type {
  NarrativeConfig,
  NarrativeEvent,
  CharacterArchetype,
} from '@/engine/types';

// ---------------------------------------------------------------------------
// Pre-defined World Difference Templates
// ---------------------------------------------------------------------------

/** Canonical template identifiers that map to curated world descriptions. */
export type WorldDifferenceTemplate =
  | 'colors_alive'
  | 'sound_solid'
  | 'memory_touch'
  | 'time_uneven';

const WORLD_TEMPLATES: Record<WorldDifferenceTemplate, string> = {
  colors_alive:
    'In this world, colors are living beings. They drift through the air, merge when they collide, and can be captured -- but never truly tamed. The landscape shifts hue with the mood of its inhabitants, and darkness is not merely the absence of light but a predator that devours pigment.',
  sound_solid:
    'Here, sounds crystallize into solid objects the moment they leave their source. A shout becomes a jagged shard, a melody turns into a spiraling bridge, and silence is the most dangerous terrain of all -- an invisible void where nothing can exist.',
  memory_touch:
    'Memories can be touched, held, and traded like precious gems. Forgotten moments litter the ground as translucent stones, and the most powerful beings are those who carry the heaviest recollections. Losing a memory means losing a piece of yourself -- literally.',
  time_uneven:
    'Time flows at different speeds in different places. Step into a golden zone and hours pass in seconds; cross a silver border and a heartbeat stretches into minutes. The world is a patchwork of temporal pockets, and mastering the map of time is the key to survival.',
};

// ---------------------------------------------------------------------------
// Archetype Flavour Text
// ---------------------------------------------------------------------------

const ARCHETYPE_DESCRIPTIONS: Record<CharacterArchetype, string> = {
  explorer:
    'You are driven by insatiable curiosity. Every horizon hides a question, and every question deserves pursuit. The unknown is not frightening -- it is an invitation.',
  guardian:
    'You stand between the vulnerable and the void. Your strength is measured not in what you can destroy, but in what you can preserve when everything else falls apart.',
  fugitive:
    'You are always one step ahead -- or one step behind. The world wants to catch you, cage you, define you. Your only power is motion, and you intend to keep moving.',
  collector:
    'Every fragment matters. Every shard, every echo, every forgotten scrap of this world calls to you. Completion is not a goal; it is a hunger that sharpens with every piece you find.',
};

// ---------------------------------------------------------------------------
// Narrative Event Seeds per World x Archetype
// ---------------------------------------------------------------------------

/**
 * Build a small set of introductory narrative events that blend the world
 * description with the character archetype. These are NOT the full diamond
 * chain (see event-gen.ts for that); they are flavour seeds used to
 * bootstrap the NarrativeConfig.
 */
function buildSeedEvents(
  worldDescription: string,
  archetype: CharacterArchetype,
): NarrativeEvent[] {
  const base: NarrativeEvent[] = [
    {
      id: 'world_intro',
      trigger: 'game_start',
      text: worldDescription,
    },
    {
      id: 'character_intro',
      trigger: 'game_start',
      text: ARCHETYPE_DESCRIPTIONS[archetype],
    },
    {
      id: 'first_challenge',
      trigger: 'score_10',
      text: `The world tests you for the first time. As a ${archetype}, you feel the weight of your purpose pressing in.`,
    },
  ];

  // Add archetype-specific mid-game hook
  const hooks: Record<CharacterArchetype, NarrativeEvent> = {
    explorer: {
      id: 'explorer_hook',
      trigger: 'area_2',
      text: 'A passage you have never seen before shimmers into existence. It was not here a moment ago -- or was it always here, waiting for someone curious enough to notice?',
      choices: [
        { text: 'Enter without hesitation', effect: 'boost_speed' },
        { text: 'Observe from a distance first', effect: 'reveal_map' },
      ],
    },
    guardian: {
      id: 'guardian_hook',
      trigger: 'area_2',
      text: 'A faint cry echoes through the terrain. Something small and fragile needs protection -- but reaching it means crossing dangerous ground.',
      choices: [
        { text: 'Rush to help', effect: 'gain_ally' },
        { text: 'Find a safer path', effect: 'boost_defense' },
      ],
    },
    fugitive: {
      id: 'fugitive_hook',
      trigger: 'area_2',
      text: 'The shadows behind you grow longer. Whatever pursues you is closer now. You can feel its attention like a hand on your shoulder.',
      choices: [
        { text: 'Sprint forward recklessly', effect: 'boost_speed' },
        { text: 'Set a false trail', effect: 'slow_enemies' },
      ],
    },
    collector: {
      id: 'collector_hook',
      trigger: 'area_2',
      text: 'A glimmer catches your eye -- something rare, half-buried beneath the surface. But extracting it will take time you may not have.',
      choices: [
        { text: 'Dig it out now', effect: 'rare_collectible' },
        { text: 'Mark the spot and return later', effect: 'reveal_collectibles' },
      ],
    },
  };

  base.push(hooks[archetype]);

  // Closing teaser
  base.push({
    id: 'midpoint_tease',
    trigger: 'score_50',
    text: 'You begin to understand the shape of this world. What once felt alien now feels like a language -- one you are slowly learning to speak.',
  });

  return base;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a worldDifference string to its template key, or `null` if the
 * string is free-form custom text.
 */
export function resolveTemplate(
  worldDifference: string,
): WorldDifferenceTemplate | null {
  const key = worldDifference as WorldDifferenceTemplate;
  if (key in WORLD_TEMPLATES) return key;
  return null;
}

/**
 * Generate a NarrativeConfig from the user's "key difference" and chosen
 * character archetype.
 *
 * If `worldDifference` matches a known template key (e.g. `'colors_alive'`),
 * the curated description is used. Otherwise the raw string is treated as a
 * custom world description.
 */
export function generateWorldNarrative(
  worldDifference: string,
  characterArchetype: CharacterArchetype,
): NarrativeConfig {
  const templateKey = resolveTemplate(worldDifference);
  const worldDescription = templateKey
    ? WORLD_TEMPLATES[templateKey]
    : worldDifference;

  const events = buildSeedEvents(worldDescription, characterArchetype);

  return {
    worldDifference: worldDescription,
    characterArchetype,
    events,
  };
}

export { WORLD_TEMPLATES, ARCHETYPE_DESCRIPTIONS };

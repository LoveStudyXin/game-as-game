// ============================================================================
// Diamond Narrative Structure Template (NR-05)
//
// The "diamond" is a classic branching-then-converging story shape:
//
//       [Intro]            <- act1_intro (single node)
//         / | \
//    [A] [B] [C]           <- act2_paths (2-3 branches)
//         \ | /
//      [Converge]          <- act2_converge (single node)
//          |
//       [Climax]           <- act3_climax
//          |
//     [Resolution]         <- act3_resolution
//
// The template is filled with contextual prose by the event generator.
// ============================================================================

import type { NarrativeEvent, NarrativeChoice } from '@/engine/types';

// ---------------------------------------------------------------------------
// Template Shape
// ---------------------------------------------------------------------------

export interface DiamondSlot {
  /** Unique event id suffix (prefixed at fill time) */
  idSuffix: string;
  /** The trigger condition that activates this event */
  trigger: string;
  /** Prose template with `{world}`, `{character}`, `{verb}` placeholders */
  textTemplate: string;
  /** Optional choice templates */
  choices?: Array<{ textTemplate: string; effect: string }>;
}

export interface DiamondTemplate {
  act1_intro: DiamondSlot;
  act2_branch: DiamondSlot;
  act2_paths: DiamondSlot[];
  act2_converge: DiamondSlot;
  act3_climax: DiamondSlot;
  act3_resolution: DiamondSlot;
}

// ---------------------------------------------------------------------------
// Default Diamond Template
// ---------------------------------------------------------------------------

export const DIAMOND_TEMPLATE: DiamondTemplate = {
  act1_intro: {
    idSuffix: 'intro',
    trigger: 'game_start',
    textTemplate:
      'You awaken in a world where {world}. As a {character}, you feel the pull of your purpose immediately. The air itself seems to acknowledge your arrival.',
  },

  act2_branch: {
    idSuffix: 'branch',
    trigger: 'score_25',
    textTemplate:
      'The path ahead splits. The world of {world} offers you a choice that will shape your journey. Your instinct to {verb} could serve you well -- but which direction?',
    choices: [
      { textTemplate: 'Take the high road -- risk and reward', effect: 'path_high' },
      { textTemplate: 'Take the low road -- caution and certainty', effect: 'path_low' },
      { textTemplate: 'Forge your own path through the unknown', effect: 'path_wild' },
    ],
  },

  act2_paths: [
    {
      idSuffix: 'path_high',
      trigger: 'path_high',
      textTemplate:
        'The high road reveals breathtaking vistas of {world}. Danger walks beside you, but so does wonder. Your ability to {verb} is tested at every turn.',
    },
    {
      idSuffix: 'path_low',
      trigger: 'path_low',
      textTemplate:
        'The low road is quieter, darker. In the shadows of {world}, you find secrets others have overlooked. Patience rewards those who {verb} carefully.',
    },
    {
      idSuffix: 'path_wild',
      trigger: 'path_wild',
      textTemplate:
        'There is no path here -- only the raw substance of {world}. You carve your own way, and the world reshapes itself around your will to {verb}.',
    },
  ],

  act2_converge: {
    idSuffix: 'converge',
    trigger: 'score_60',
    textTemplate:
      'All roads lead to this place. The threads of {world} pull tight, and you stand at the nexus. Whatever choices you made, the world has been watching -- and it remembers.',
  },

  act3_climax: {
    idSuffix: 'climax',
    trigger: 'score_80',
    textTemplate:
      'This is the moment. The heart of {world} beats in time with yours. Everything you know about how to {verb} will be tested now. As a {character}, this is what you were made for.',
    choices: [
      { textTemplate: 'Face the challenge head-on', effect: 'climax_brave' },
      { textTemplate: 'Find the hidden weakness', effect: 'climax_clever' },
    ],
  },

  act3_resolution: {
    idSuffix: 'resolution',
    trigger: 'score_100',
    textTemplate:
      'The world of {world} settles into a new equilibrium. Your journey as a {character} has left its mark -- not just on this place, but on the very rules that govern it. The game remembers you.',
  },
};

// ---------------------------------------------------------------------------
// Template Filler
// ---------------------------------------------------------------------------

interface FillContext {
  /** Short world-description phrase suitable for interpolation */
  worldContext: string;
  /** Character archetype label (e.g. "explorer") */
  characterContext: string;
  /** Primary verb label (e.g. "jump") */
  verbContext: string;
}

/**
 * Replace `{world}`, `{character}`, and `{verb}` tokens in a template string.
 */
function interpolate(template: string, ctx: FillContext): string {
  return template
    .replace(/\{world\}/g, ctx.worldContext)
    .replace(/\{character\}/g, ctx.characterContext)
    .replace(/\{verb\}/g, ctx.verbContext);
}

function slotToEvent(
  slot: DiamondSlot,
  ctx: FillContext,
  idPrefix: string,
): NarrativeEvent {
  const choices: NarrativeChoice[] | undefined = slot.choices?.map((c) => ({
    text: interpolate(c.textTemplate, ctx),
    effect: c.effect,
  }));

  return {
    id: `${idPrefix}_${slot.idSuffix}`,
    trigger: slot.trigger,
    text: interpolate(slot.textTemplate, ctx),
    ...(choices && choices.length > 0 ? { choices } : {}),
  };
}

/**
 * Fill the diamond template with contextual content and return a complete
 * ordered array of NarrativeEvents.
 */
export function fillDiamondTemplate(
  worldContext: string,
  characterContext: string,
  verbContext: string,
): NarrativeEvent[] {
  const ctx: FillContext = { worldContext, characterContext, verbContext };
  const prefix = 'diamond';

  const events: NarrativeEvent[] = [];

  // Act 1
  events.push(slotToEvent(DIAMOND_TEMPLATE.act1_intro, ctx, prefix));

  // Act 2 -- branch point
  events.push(slotToEvent(DIAMOND_TEMPLATE.act2_branch, ctx, prefix));

  // Act 2 -- parallel paths
  for (const pathSlot of DIAMOND_TEMPLATE.act2_paths) {
    events.push(slotToEvent(pathSlot, ctx, prefix));
  }

  // Act 2 -- convergence
  events.push(slotToEvent(DIAMOND_TEMPLATE.act2_converge, ctx, prefix));

  // Act 3
  events.push(slotToEvent(DIAMOND_TEMPLATE.act3_climax, ctx, prefix));
  events.push(slotToEvent(DIAMOND_TEMPLATE.act3_resolution, ctx, prefix));

  return events;
}

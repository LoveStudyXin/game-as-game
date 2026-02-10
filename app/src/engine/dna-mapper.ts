// ============================================================================
// DNA → UserChoices Mapper
//
// The core translation layer that converts a user's DNA answers (scenario-based
// questions + free text + chaos slider) into a complete UserChoices object that
// the existing generator.ts can consume.
//
// Data flow: GameDNA  →  mapDNAToChoices()  →  UserChoices  →  generator.ts
// ============================================================================

import type { UserChoices, GameGenre, CoreVerb } from '@/engine/types';
import type { GameDNA, DNAMapping } from './dna-types';
import { DNA_BANKS } from './dna-questions';

// ---------------------------------------------------------------------------
// Genre Defaults — sensible fallback values when DNA questions don't cover
// a field. These are designed so that even with zero answers, the generator
// still produces a playable game.
// ---------------------------------------------------------------------------

const GENRE_DEFAULTS: Record<GameGenre, UserChoices> = {
  action: {
    genre: 'action',
    visualStyle: 'pixel',
    verbs: ['jump', 'collect'],
    objectTypes: [],
    customElement: '',
    gravity: 'normal',
    boundary: 'walled',
    specialPhysics: 'elastic',
    customPhysics: '',
    worldDifference: 'colors_alive',
    characterArchetype: 'explorer',
    difficultyStyle: 'steady',
    gamePace: 'medium',
    skillLuckRatio: 'balanced',
    chaosLevel: 0,
  },
  narrative: {
    genre: 'narrative',
    visualStyle: 'retro_crt',
    verbs: ['explore', 'collect', 'craft'],
    objectTypes: [],
    customElement: '',
    gravity: 'normal',
    boundary: 'walled',
    specialPhysics: 'elastic',
    customPhysics: '',
    worldDifference: 'sound_solid',
    characterArchetype: 'explorer',
    difficultyStyle: 'steady',
    gamePace: 'medium',
    skillLuckRatio: 'balanced',
    chaosLevel: 0,
  },
  card: {
    genre: 'card',
    visualStyle: 'neon',
    verbs: ['collect', 'activate', 'defend'],
    objectTypes: [],
    customElement: '',
    gravity: 'normal',
    boundary: 'walled',
    specialPhysics: 'elastic',
    customPhysics: '',
    worldDifference: 'colors_alive',
    characterArchetype: 'explorer',
    difficultyStyle: 'steady',
    gamePace: 'medium',
    skillLuckRatio: 'balanced',
    chaosLevel: 0,
  },
  board: {
    genre: 'board',
    visualStyle: 'pixel',
    verbs: ['push', 'defend', 'activate'],
    objectTypes: [],
    customElement: '',
    gravity: 'normal',
    boundary: 'walled',
    specialPhysics: 'elastic',
    customPhysics: '',
    worldDifference: 'colors_alive',
    characterArchetype: 'explorer',
    difficultyStyle: 'steady',
    gamePace: 'medium',
    skillLuckRatio: 'balanced',
    chaosLevel: 0,
  },
  puzzle_logic: {
    genre: 'puzzle_logic',
    visualStyle: 'minimal',
    verbs: ['activate', 'explore'],
    objectTypes: [],
    customElement: '',
    gravity: 'normal',
    boundary: 'walled',
    specialPhysics: 'elastic',
    customPhysics: '',
    worldDifference: 'colors_alive',
    characterArchetype: 'explorer',
    difficultyStyle: 'steady',
    gamePace: 'slow',
    skillLuckRatio: 'balanced',
    chaosLevel: 0,
  },
  rhythm: {
    genre: 'rhythm',
    visualStyle: 'neon',
    verbs: ['activate', 'dodge', 'dash'],
    objectTypes: [],
    customElement: '',
    gravity: 'normal',
    boundary: 'walled',
    specialPhysics: 'elastic',
    customPhysics: '',
    worldDifference: 'sound_solid',
    characterArchetype: 'explorer',
    difficultyStyle: 'steady',
    gamePace: 'medium',
    skillLuckRatio: 'balanced',
    chaosLevel: 0,
  },
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/**
 * Resolve a DNA mapping overlay into the choices object.
 * Later overlays win over earlier ones for scalar fields.
 * For verbs (array), we accumulate unique values.
 */
function applyMapping(choices: UserChoices, mapping: DNAMapping): UserChoices {
  const next = { ...choices };

  if (mapping.visualStyle) next.visualStyle = mapping.visualStyle;
  if (mapping.gravity) next.gravity = mapping.gravity;
  if (mapping.boundary) next.boundary = mapping.boundary;
  if (mapping.specialPhysics) next.specialPhysics = mapping.specialPhysics;
  if (mapping.worldDifference) next.worldDifference = mapping.worldDifference;
  if (mapping.characterArchetype) next.characterArchetype = mapping.characterArchetype;
  if (mapping.difficultyStyle) next.difficultyStyle = mapping.difficultyStyle;
  if (mapping.gamePace) next.gamePace = mapping.gamePace;
  if (mapping.skillLuckRatio) next.skillLuckRatio = mapping.skillLuckRatio;

  // Accumulate verbs from all answered questions (deduplicated)
  if (mapping.verbs && mapping.verbs.length > 0) {
    const verbSet = new Set<CoreVerb>(next.verbs);
    for (const v of mapping.verbs) verbSet.add(v);
    next.verbs = Array.from(verbSet);
  }

  return next;
}

/**
 * Convert a GameDNA (scenario-based answers) into a complete UserChoices.
 *
 * Steps:
 * 1. Start from genre defaults
 * 2. For each answered question, look up the selected option's mapping and overlay
 * 3. Apply free-text sceneDescription → customElement
 * 4. Apply chaos level
 * 5. Ensure verbs are not empty (fall back to genre default verbs)
 * 6. Sort verbs for deterministic seed encoding
 */
export function mapDNAToChoices(dna: GameDNA): UserChoices {
  const genre = dna.genre;
  let choices: UserChoices = { ...GENRE_DEFAULTS[genre] };

  // Resolve the question bank for this genre
  const bank = DNA_BANKS[genre];
  if (bank) {
    for (const question of bank.questions) {
      const selectedOptionId = dna.answers[question.id];
      if (!selectedOptionId) continue;

      const selectedOption = question.options.find((o) => o.id === selectedOptionId);
      if (!selectedOption) continue;

      choices = applyMapping(choices, selectedOption.mapping);
    }
  }

  // Free-text scene description → customElement
  if (dna.sceneDescription.trim()) {
    choices.customElement = dna.sceneDescription.trim().slice(0, 50);
  }

  // Chaos level
  choices.chaosLevel = dna.chaosLevel;

  // Safety: ensure verbs is never empty (seed encoding needs at least one)
  if (choices.verbs.length === 0) {
    choices.verbs = [...GENRE_DEFAULTS[genre].verbs];
  }

  // Sort verbs alphabetically for deterministic seed encoding
  choices.verbs.sort();

  return choices;
}

/**
 * Extract visible "gene" labels from the DNA answers for display on the DNA card.
 * Returns an array of { icon, label } pairs from the selected options.
 */
export function extractVisibleGenes(
  dna: GameDNA,
): Array<{ icon: string; label: string }> {
  const bank = DNA_BANKS[dna.genre];
  if (!bank) return [];

  const genes: Array<{ icon: string; label: string }> = [];

  for (const question of bank.questions) {
    const selectedOptionId = dna.answers[question.id];
    if (!selectedOptionId) continue;

    const option = question.options.find((o) => o.id === selectedOptionId);
    if (option) {
      genes.push({ icon: option.icon, label: option.label });
    }
  }

  return genes;
}

/**
 * Generate a soul description text from DNA answers.
 * Used for the DNA card and game description.
 */
export function generateSoulText(dna: GameDNA): string {
  const genes = extractVisibleGenes(dna);
  const geneName = dna.gameName.trim() || '未命名的游戏';

  if (genes.length === 0) {
    return `${geneName}——一段独一无二的冒险`;
  }

  const geneLabels = genes.map((g) => g.label);

  if (genes.length === 1) {
    return `${geneName}——在${geneLabels[0]}的世界中开启冒险`;
  }

  if (genes.length === 2) {
    return `${geneName}——${geneLabels[0]}遇上${geneLabels[1]}的奇妙旅程`;
  }

  // 3+ genes
  const first = geneLabels.slice(0, -1).join('、');
  const last = geneLabels[geneLabels.length - 1];
  return `${geneName}——${first}与${last}交织的世界`;
}

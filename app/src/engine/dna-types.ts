// ============================================================================
// Game DNA Type Definitions
//
// The DNA system replaces the 7-step parameter wizard with a 3-step
// "personality discovery" flow. Users answer scenario-based questions
// instead of tweaking technical parameters.
//
// Data flow: GameDNA -> dna-mapper -> UserChoices -> generator -> GameConfig
// ============================================================================

import type {
  GameGenre,
  VisualStyle,
  CoreVerb,
  GravityMode,
  WorldBoundary,
  SpecialPhysics,
  CharacterArchetype,
  DifficultyStyle,
  GamePace,
  SkillLuckRatio,
  ChaosLevel,
  UserChoices,
} from '@/engine/types';

// ---------------------------------------------------------------------------
// Question & Option
// ---------------------------------------------------------------------------

/**
 * A partial mapping from one DNA option to UserChoices fields.
 * Each option can set 1-4 fields at once.
 */
export interface DNAMapping {
  visualStyle?: VisualStyle;
  verbs?: CoreVerb[];
  gravity?: GravityMode;
  boundary?: WorldBoundary;
  specialPhysics?: SpecialPhysics;
  worldDifference?: string;
  characterArchetype?: CharacterArchetype;
  difficultyStyle?: DifficultyStyle;
  gamePace?: GamePace;
  skillLuckRatio?: SkillLuckRatio;
}

/** A single selectable option within a DNA question */
export interface DNAOption {
  id: string;
  icon: string;
  label: string;
  description: string;
  /** Which UserChoices fields this option sets */
  mapping: DNAMapping;
}

/** A single scenario-based question */
export interface DNAQuestion {
  id: string;
  /** The question text shown to the user */
  prompt: string;
  /** 2-4 options */
  options: DNAOption[];
}

/** A genre's complete question bank */
export interface GenreDNABank {
  genre: GameGenre;
  /** 3-4 scenario-based questions */
  questions: DNAQuestion[];
}

// ---------------------------------------------------------------------------
// User's DNA State (intermediate representation)
// ---------------------------------------------------------------------------

/** The user's DNA answers — stored in Zustand between steps */
export interface GameDNA {
  genre: GameGenre;
  /** Map of questionId -> selected optionId */
  answers: Record<string, string>;
  /** Free-text scene/element description */
  sceneDescription: string;
  /** Free-text game name */
  gameName: string;
  /** Chaos level 0-100 */
  chaosLevel: ChaosLevel;
}

// ---------------------------------------------------------------------------
// Classic DNA Presets ("致敬经典")
// ---------------------------------------------------------------------------

/** A predefined DNA profile that maps to a complete UserChoices */
export interface ClassicDNAProfile {
  id: string;
  name: string;
  icon: string;
  /** One-sentence story/backstory */
  story: string;
  genre: GameGenre;
  /** Complete choices for this preset */
  choices: UserChoices;
}

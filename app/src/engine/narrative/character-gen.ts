// ============================================================================
// Character Generation (NR-04 Skill: Motivation / Fear / Arc)
// Produces a CharacterDef from one of four archetypes, each carrying a
// distinct motivation, fear, and visual identity color.
// ============================================================================

import type { CharacterArchetype } from '@/engine/types';

// ---------------------------------------------------------------------------
// CharacterDef (local enriched type -- not in core types.ts because it is
// narrative-layer only and consumed by the generator, not the runtime)
// ---------------------------------------------------------------------------

export interface CharacterDef {
  /** Archetype key */
  archetype: CharacterArchetype;
  /** Template name (player fills in their own name later) */
  nameTemplate: string;
  /** Short prose description */
  description: string;
  /** What drives this character forward */
  motivation: string;
  /** What this character dreads most */
  fear: string;
  /** Primary accent color (hex) */
  color: string;
}

// ---------------------------------------------------------------------------
// Archetype Definitions
// ---------------------------------------------------------------------------

const ARCHETYPE_DATA: Record<CharacterArchetype, CharacterDef> = {
  explorer: {
    archetype: 'explorer',
    nameTemplate: 'The Wanderer',
    description:
      'A restless soul drawn to every uncharted corner. The Explorer moves with purpose but no fixed destination, gathering knowledge the way others gather gold.',
    motivation: 'discover the unknown',
    fear: 'stagnation',
    color: '#00d4ff',
  },
  guardian: {
    archetype: 'guardian',
    nameTemplate: 'The Sentinel',
    description:
      'A steadfast protector who measures strength not by destruction but by what remains standing. The Guardian draws power from the bonds they defend.',
    motivation: 'protect what matters',
    fear: 'failure',
    color: '#00ff88',
  },
  fugitive: {
    archetype: 'fugitive',
    nameTemplate: 'The Drifter',
    description:
      'Always running, never resting. The Fugitive turns danger into momentum, leaving decoys and false trails in their wake. Freedom is the only treasure worth keeping.',
    motivation: 'escape and survive',
    fear: 'being caught',
    color: '#e94560',
  },
  collector: {
    archetype: 'collector',
    nameTemplate: 'The Seeker',
    description:
      'Driven by an unshakeable need to make the incomplete whole. The Collector sees value where others see debris, and every missing piece is a wound that must be healed.',
    motivation: 'find them all',
    fear: 'missing something',
    color: '#ffd700',
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a full character definition from an archetype key.
 *
 * The returned `CharacterDef` contains narrative scaffolding (motivation,
 * fear, description) as well as the visual accent color used by the renderer
 * to tint the player entity.
 */
export function generateCharacter(archetype: CharacterArchetype): CharacterDef {
  return { ...ARCHETYPE_DATA[archetype] };
}

/**
 * Return all available archetype keys. Useful for UI enumeration.
 */
export function getAvailableArchetypes(): CharacterArchetype[] {
  return Object.keys(ARCHETYPE_DATA) as CharacterArchetype[];
}

export { ARCHETYPE_DATA };

// ============================================================================
// Player Entity Factory
// Creates a player EntityDef based on the chosen core verbs.
// All players are geometric squares with solid colors -- no sprites.
// ============================================================================

import type {
  CoreVerb,
  EntityDef,
  ComponentDef,
  JumpComponentConfig,
  ShooterComponentConfig,
  CollectorComponentConfig,
  DodgerComponentConfig,
  BuilderComponentConfig,
} from '../types';

// ---------------------------------------------------------------------------
// Verb-to-color mapping
// The PRIMARY verb (first in the array) determines the player's base color.
// ---------------------------------------------------------------------------

const VERB_COLORS: Record<CoreVerb, string> = {
  jump:     '#00E5FF', // cyan -- agile, airy
  shoot:    '#FF1744', // red -- aggressive, fiery
  collect:  '#FFD600', // gold -- treasure-seeking
  dodge:    '#76FF03', // lime green -- nimble, evasive
  build:    '#FF9100', // orange -- constructive, warm
  explore:  '#B388FF', // purple -- curious, mystical
  push:     '#8D6E63', // brown -- sturdy, grounded
  activate: '#FFAB40', // amber -- energetic, electric
  craft:    '#4DB6AC', // teal -- resourceful, creative
  defend:   '#78909C', // steel -- protective, solid
  dash:     '#E040FB', // magenta -- fast, flashy
};

/** Fallback color when no verb is selected (should not happen in practice) */
const DEFAULT_PLAYER_COLOR = '#FFFFFF';

// ---------------------------------------------------------------------------
// Verb-to-component factories
// Each returns a ComponentDef that gets attached to the player entity.
// ---------------------------------------------------------------------------

function jumpComponent(): ComponentDef {
  const config: JumpComponentConfig = {
    jumpForce: 12,
    maxJumps: 2,
  };
  return { type: 'jump', config: config as unknown as Record<string, unknown> };
}

function shooterComponent(): ComponentDef {
  const config: ShooterComponentConfig = {
    fireRate: 4,       // shots per second
    bulletSpeed: 10,
    bulletColor: '#FF5252',
  };
  return { type: 'shooter', config: config as unknown as Record<string, unknown> };
}

function collectorComponent(): ComponentDef {
  const config: CollectorComponentConfig = {
    collectRadius: 48,
  };
  return { type: 'collector', config: config as unknown as Record<string, unknown> };
}

function dodgerComponent(): ComponentDef {
  const config: DodgerComponentConfig = {
    dashSpeed: 18,
    dashCooldown: 800,      // ms
    invincibilityMs: 300,
  };
  return { type: 'dodger', config: config as unknown as Record<string, unknown> };
}

function builderComponent(): ComponentDef {
  const config: BuilderComponentConfig = {
    buildCooldown: 1200,    // ms
    blockColor: '#FF9100',
    maxBlocks: 5,
  };
  return { type: 'builder', config: config as unknown as Record<string, unknown> };
}

// Generic component factory for new verbs that don't have specialized configs yet
function genericVerbComponent(verbType: string): () => ComponentDef {
  return () => ({ type: verbType, config: {} });
}

const VERB_COMPONENT_MAP: Record<CoreVerb, () => ComponentDef> = {
  jump:     jumpComponent,
  shoot:    shooterComponent,
  collect:  collectorComponent,
  dodge:    dodgerComponent,
  build:    builderComponent,
  explore:  genericVerbComponent('explorer'),
  push:     genericVerbComponent('pusher'),
  activate: genericVerbComponent('activator'),
  craft:    genericVerbComponent('crafter'),
  defend:   genericVerbComponent('defender'),
  dash:     () => {
    const config: DodgerComponentConfig = { dashSpeed: 20, dashCooldown: 600, invincibilityMs: 200 };
    return { type: 'dasher', config: config as unknown as Record<string, unknown> };
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CreatePlayerOptions {
  /** The core verbs the player has access to (order matters -- first = primary) */
  verbs: CoreVerb[];
  /** Spawn X coordinate */
  x?: number;
  /** Spawn Y coordinate */
  y?: number;
  /** Width of the player square */
  size?: number;
}

/**
 * Create a player EntityDef from the selected verbs.
 *
 * The player is always a square. Its color is determined by its primary verb
 * (the first verb in the array). Every selected verb adds a corresponding
 * component to the entity.
 */
export function createPlayer(options: CreatePlayerOptions): EntityDef {
  const {
    verbs,
    x = 100,
    y = 400,
    size = 32,
  } = options;

  const primaryVerb = verbs[0] as CoreVerb | undefined;
  const color = primaryVerb ? VERB_COLORS[primaryVerb] : DEFAULT_PLAYER_COLOR;

  // Always include base movement + health components
  const baseComponents: ComponentDef[] = [
    {
      type: 'transform',
      config: { x, y, velocityX: 0, velocityY: 0 },
    },
    {
      type: 'physics',
      config: { mass: 1, gravityScale: 1, friction: 0.8 },
    },
    {
      type: 'collider',
      config: { shape: 'rect', width: size, height: size },
    },
    {
      type: 'health',
      config: { current: 3, max: 3 },
    },
    {
      type: 'playerController',
      config: { moveSpeed: 5, isGrounded: false },
    },
  ];

  // Add verb-specific components
  const verbComponents: ComponentDef[] = verbs.map((verb) => {
    const factory = VERB_COMPONENT_MAP[verb];
    return factory();
  });

  return {
    id: 'player',
    type: 'player',
    x,
    y,
    width: size,
    height: size,
    color,
    components: [...baseComponents, ...verbComponents],
  };
}

export { VERB_COLORS };

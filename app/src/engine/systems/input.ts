// ============================================================================
// Input System Configuration Generator
// ============================================================================

import type { SystemDef, CoreVerb } from '@/engine/types';

/** Key-binding definition for an individual action */
interface KeyBinding {
  action: string;
  keys: string[];
  type: 'hold' | 'press' | 'auto';
}

/**
 * Create an input system configuration based on the verbs the player can use.
 *
 * Always includes basic left/right movement.
 * Additional bindings are added per verb:
 * - jump:    up arrow / W / space
 * - shoot:   mouse click / X key
 * - collect:  auto-collect on overlap (no extra key)
 * - dodge:   shift key for dash
 * - build:   right click / C key to place block
 */
export function createInputSystem(verbs: CoreVerb[]): SystemDef {
  const bindings: KeyBinding[] = [
    // Base movement -- always present
    {
      action: 'move_left',
      keys: ['ArrowLeft', 'KeyA'],
      type: 'hold',
    },
    {
      action: 'move_right',
      keys: ['ArrowRight', 'KeyD'],
      type: 'hold',
    },
  ];

  const verbSet = new Set(verbs);

  if (verbSet.has('jump')) {
    bindings.push({
      action: 'jump',
      keys: ['ArrowUp', 'KeyW', 'Space'],
      type: 'press',
    });
  }

  if (verbSet.has('shoot')) {
    bindings.push({
      action: 'shoot',
      keys: ['MouseLeft', 'KeyX'],
      type: 'press',
    });
  }

  if (verbSet.has('collect')) {
    // Auto-collect triggers on overlap -- no key binding needed
    bindings.push({
      action: 'collect',
      keys: [],
      type: 'auto',
    });
  }

  if (verbSet.has('dodge')) {
    bindings.push({
      action: 'dodge',
      keys: ['ShiftLeft', 'ShiftRight'],
      type: 'press',
    });
  }

  if (verbSet.has('build')) {
    bindings.push({
      action: 'build',
      keys: ['MouseRight', 'KeyC'],
      type: 'press',
    });
  }

  return {
    type: 'input',
    config: {
      bindings,
      mouseAim: verbSet.has('shoot'),
      touchEnabled: true,
      deadZone: 0.15,
    },
  };
}

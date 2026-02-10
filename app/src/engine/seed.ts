// ============================================================================
// Seed Encoding / Decoding
//
// Converts UserChoices + an internal numeric seed into a compact, human-
// readable "seed code" that can be shared as a URL.
//
// Format:  VERB-WORLD-NARR{chaos}-XXXX
// Example: JUMP-FLOT-COLR3-7X3K
// ============================================================================

import type {
  CoreVerb,
  GravityMode,
  UserChoices,
} from '@/engine/types';

// ---------------------------------------------------------------------------
// Lookup Tables -- Encoding
// ---------------------------------------------------------------------------

const VERB_CODES: Record<CoreVerb, string> = {
  jump: 'JUMP',
  shoot: 'SHOT',
  collect: 'GRAB',
  dodge: 'DODG',
  build: 'BILD',
  explore: 'XPLR',
  push: 'PUSH',
  activate: 'ACTV',
  craft: 'CRFT',
  defend: 'DFND',
  dash: 'DASH',
};

const GRAVITY_CODES: Record<GravityMode, string> = {
  normal: 'NORM',
  low: 'FLOT',
  shifting: 'SHFT',
  reverse: 'RVRS',
};

/** Known world-difference template keys. Custom text maps to "CSTM". */
const WORLD_CODES: Record<string, string> = {
  colors_alive: 'COLR',
  sound_solid: 'SOND',
  memory_touch: 'MMRY',
  time_uneven: 'TIME',
};

// ---------------------------------------------------------------------------
// Lookup Tables -- Decoding (reverse maps)
// ---------------------------------------------------------------------------

const CODE_TO_VERB: Record<string, CoreVerb> = Object.fromEntries(
  Object.entries(VERB_CODES).map(([k, v]) => [v, k as CoreVerb]),
) as Record<string, CoreVerb>;

const CODE_TO_GRAVITY: Record<string, GravityMode> = Object.fromEntries(
  Object.entries(GRAVITY_CODES).map(([k, v]) => [v, k as GravityMode]),
) as Record<string, GravityMode>;

const CODE_TO_WORLD: Record<string, string> = Object.fromEntries(
  Object.entries(WORLD_CODES).map(([k, v]) => [v, k]),
);

// ---------------------------------------------------------------------------
// Internal Seed <-> 4-char Alphanumeric
// ---------------------------------------------------------------------------

const ALPHANUM = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 33 chars (no I, O)

/**
 * Encode a positive integer into a 4-character alphanumeric string.
 * The value is taken modulo 33^4 (1,185,921) so it always fits.
 */
function encodeInternalSeed(seed: number): string {
  const base = ALPHANUM.length;
  let n = Math.abs(Math.round(seed)) % Math.pow(base, 4);
  let result = '';
  for (let i = 0; i < 4; i++) {
    result = ALPHANUM[n % base] + result;
    n = Math.floor(n / base);
  }
  return result;
}

/**
 * Decode a 4-character alphanumeric string back to a number.
 */
function decodeInternalSeed(code: string): number {
  const base = ALPHANUM.length;
  let n = 0;
  for (const ch of code.toUpperCase()) {
    const idx = ALPHANUM.indexOf(ch);
    if (idx === -1) return 0; // invalid char
    n = n * base + idx;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode user choices and an internal seed into a shareable seed code.
 *
 * Format: `VERB-GRAV-NARR{chaos}-XXXX`
 *   - VERB  : 4-char verb code (first verb if multiple)
 *   - GRAV  : 4-char gravity code
 *   - NARR  : 4-char world-difference code
 *   - {chaos}: single digit 0-9 (chaos level mapped from 0-100)
 *   - XXXX  : 4-char encoded internal seed
 */
export function encodeSeedCode(choices: UserChoices, internalSeed: number): string {
  const verb = VERB_CODES[choices.verbs[0]] ?? 'JUMP';
  const grav = GRAVITY_CODES[choices.gravity] ?? 'NORM';
  const world = WORLD_CODES[choices.worldDifference] ?? 'CSTM';
  const chaosDigit = Math.min(9, Math.max(0, Math.round(choices.chaosLevel / 11)));
  const seedStr = encodeInternalSeed(internalSeed);

  return `${verb}-${grav}-${world}${chaosDigit}-${seedStr}`;
}

/**
 * Decoded seed information. Contains partial UserChoices (only the fields
 * that can be recovered from the code) plus the internal seed.
 */
export interface DecodedSeed {
  verb: CoreVerb | null;
  gravity: GravityMode | null;
  worldDifference: string | null;
  chaosLevel: number;
  internalSeed: number;
}

/**
 * Decode a seed code string back into partial choices + internal seed.
 *
 * Returns `null` values for fields that cannot be decoded (e.g. unrecognised
 * codes). The caller should fall back to defaults for those fields.
 */
export function decodeSeedCode(code: string): DecodedSeed {
  const parts = code.split('-');
  if (parts.length !== 4) {
    return {
      verb: null,
      gravity: null,
      worldDifference: null,
      chaosLevel: 0,
      internalSeed: 0,
    };
  }

  const [verbCode, gravCode, narrChaosPart, seedPart] = parts;

  // Narrative code is all but the last char; chaos digit is the last char
  const narrCode = narrChaosPart.slice(0, -1);
  const chaosDigit = parseInt(narrChaosPart.slice(-1), 10);

  return {
    verb: CODE_TO_VERB[verbCode] ?? null,
    gravity: CODE_TO_GRAVITY[gravCode] ?? null,
    worldDifference: CODE_TO_WORLD[narrCode] ?? (narrCode === 'CSTM' ? 'custom' : null),
    chaosLevel: Number.isNaN(chaosDigit) ? 0 : chaosDigit * 11,
    internalSeed: decodeInternalSeed(seedPart),
  };
}

/**
 * Generate a shareable play URL for a given seed code.
 */
export function generateShareUrl(seedCode: string): string {
  return `/play/${encodeURIComponent(seedCode)}`;
}

export {
  VERB_CODES,
  GRAVITY_CODES,
  WORLD_CODES,
  CODE_TO_VERB,
  CODE_TO_GRAVITY,
  CODE_TO_WORLD,
};

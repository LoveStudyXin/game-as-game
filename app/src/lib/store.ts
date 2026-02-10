'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserChoices, GameConfig, GameGenre } from '@/engine/types';
import type { GameDNA } from '@/engine/dna-types';

// ========== Auth Store ==========

interface AuthState {
  token: string | null;
  user: {
    userId: string;
    email: string;
    username: string;
  } | null;
  setAuth: (token: string, user: { userId: string; email: string; username: string }) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isLoggedIn: () => get().token !== null,
    }),
    {
      name: 'game-engine-auth',
    }
  )
);

// ========== Creation Wizard Store ==========

const defaultChoices: UserChoices = {
  genre: 'action',
  visualStyle: 'pixel',
  verbs: [],
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
};

const defaultDNA: GameDNA = {
  genre: 'action',
  answers: {},
  sceneDescription: '',
  gameName: '',
  chaosLevel: 20,
};

interface CreationState {
  // New 3-step flow: 0=ChooseWorld, 1=DiscoverDNA, 2=DNACard
  step: number;
  choices: UserChoices;
  generatedConfig: GameConfig | null;

  // DNA state
  dna: GameDNA;
  /** Whether the user picked a classic preset (skips DNA questions) */
  isPreset: boolean;

  // Step navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Direct choices manipulation (for lab mode & presets)
  updateChoices: (partial: Partial<UserChoices>) => void;

  // DNA actions
  setDNAGenre: (genre: GameGenre) => void;
  setDNAAnswer: (questionId: string, optionId: string) => void;
  updateDNA: (partial: Partial<GameDNA>) => void;
  applyPreset: (choices: UserChoices) => void;

  // Generation
  setGeneratedConfig: (config: GameConfig | null) => void;
  reset: () => void;
}

export const useCreationStore = create<CreationState>((set, get) => ({
  step: 0,
  choices: { ...defaultChoices },
  generatedConfig: null,
  dna: { ...defaultDNA },
  isPreset: false,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 2) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),

  updateChoices: (partial) =>
    set((s) => ({ choices: { ...s.choices, ...partial } })),

  setDNAGenre: (genre) =>
    set((s) => ({
      dna: { ...s.dna, genre, answers: {} },
      choices: { ...s.choices, genre },
      isPreset: false,
    })),

  setDNAAnswer: (questionId, optionId) =>
    set((s) => ({
      dna: {
        ...s.dna,
        answers: { ...s.dna.answers, [questionId]: optionId },
      },
    })),

  updateDNA: (partial) =>
    set((s) => ({ dna: { ...s.dna, ...partial } })),

  applyPreset: (choices) =>
    set({
      choices: { ...choices },
      isPreset: true,
      step: 2, // Jump directly to DNA card / preview
    }),

  setGeneratedConfig: (config) => set({ generatedConfig: config }),

  reset: () =>
    set({
      step: 0,
      choices: { ...defaultChoices },
      generatedConfig: null,
      dna: { ...defaultDNA },
      isPreset: false,
    }),
}));

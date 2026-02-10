'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserChoices, GameConfig } from '@/engine/types';

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

interface CreationState {
  step: number;
  choices: UserChoices;
  generatedConfig: GameConfig | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateChoices: (partial: Partial<UserChoices>) => void;
  setGeneratedConfig: (config: GameConfig | null) => void;
  reset: () => void;
}

export const useCreationStore = create<CreationState>((set, get) => ({
  step: 0,
  choices: { ...defaultChoices },
  generatedConfig: null,
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  updateChoices: (partial) =>
    set((s) => ({ choices: { ...s.choices, ...partial } })),
  setGeneratedConfig: (config) => set({ generatedConfig: config }),
  reset: () =>
    set({
      step: 0,
      choices: { ...defaultChoices },
      generatedConfig: null,
    }),
}));

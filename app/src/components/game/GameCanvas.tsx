'use client';

import React from 'react';
import type { GameConfig } from '@/engine/types';

// ---------------------------------------------------------------------------
// Shared Types (exported so renderers can import them)
// ---------------------------------------------------------------------------

/** Callbacks the runtime fires to communicate state changes to React */
export interface GameRuntimeCallbacks {
  onScoreChange: (score: number) => void;
  onHealthChange: (health: number, maxHealth: number) => void;
  onNarrativeEvent: (text: string) => void;
  onMutationActivated: (name: string) => void;
  onMutationDeactivated: (name: string) => void;
  onGameOver: (score: number) => void;
  onLevelComplete: (score: number) => void;
}

export interface GameCanvasProps {
  config: GameConfig;
  onScoreChange?: (score: number) => void;
  onHealthChange?: (health: number, maxHealth: number) => void;
  onNarrativeEvent?: (text: string) => void;
  onMutationActivated?: (name: string) => void;
  onMutationDeactivated?: (name: string) => void;
  onGameOver?: (score: number) => void;
  onLevelComplete?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Lazy-loaded renderers (code-split by genre)
// ---------------------------------------------------------------------------

const PhaserCanvas = React.lazy(() => import('./PhaserCanvas'));
const NarrativeCanvas = React.lazy(() => import('./NarrativeCanvas'));
const CardCanvas = React.lazy(() => import('./CardCanvas'));
const BoardCanvas = React.lazy(() => import('./BoardCanvas'));
const PuzzleCanvas = React.lazy(() => import('./PuzzleCanvas'));
const RhythmCanvas = React.lazy(() => import('./RhythmCanvas'));

// ---------------------------------------------------------------------------
// Loading Fallback
// ---------------------------------------------------------------------------

function LoadingFallback() {
  return (
    <div className="relative w-full bg-pixel-black flex flex-col items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
      <div className="flex gap-1 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-pixel-blue"
            style={{
              animation: 'pixel-bounce 0.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <p className="font-pixel text-[8px] text-[#9090b0]">
        Loading game...
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Genre Dispatcher
// ---------------------------------------------------------------------------

export default function GameCanvas(props: GameCanvasProps) {
  const { config } = props;

  const renderGame = () => {
    switch (config.genre) {
      case 'action':
        return <PhaserCanvas {...props} />;
      case 'narrative':
        return <NarrativeCanvas {...props} />;
      case 'card':
        return <CardCanvas {...props} />;
      case 'board':
        return <BoardCanvas {...props} />;
      case 'puzzle_logic':
        return <PuzzleCanvas {...props} />;
      case 'rhythm':
        return <RhythmCanvas {...props} />;
      default:
        // Fallback to Phaser for unknown genres
        return <PhaserCanvas {...props} />;
    }
  };

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      {renderGame()}
    </React.Suspense>
  );
}

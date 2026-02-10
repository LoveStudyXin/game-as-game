'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GameConfig } from '@/engine/types';
import type { GameCanvasProps, GameRuntimeCallbacks } from './GameCanvas';

// ---------------------------------------------------------------------------
// PhaserCanvas: Renders action games using the Phaser 3 runtime
// ---------------------------------------------------------------------------

const CONTAINER_ID = 'game-canvas-container';

export default function PhaserCanvas({
  config,
  onScoreChange,
  onHealthChange,
  onNarrativeEvent,
  onMutationActivated,
  onMutationDeactivated,
  onGameOver,
  onLevelComplete,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<{ destroy: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize callbacks so the effect doesn't re-trigger on every render
  const callbacksRef = useRef<GameRuntimeCallbacks>({
    onScoreChange: onScoreChange ?? (() => {}),
    onHealthChange: onHealthChange ?? (() => {}),
    onNarrativeEvent: onNarrativeEvent ?? (() => {}),
    onMutationActivated: onMutationActivated ?? (() => {}),
    onMutationDeactivated: onMutationDeactivated ?? (() => {}),
    onGameOver: onGameOver ?? (() => {}),
    onLevelComplete: onLevelComplete ?? (() => {}),
  });

  // Keep callback refs in sync without re-running the mount effect
  useEffect(() => {
    callbacksRef.current = {
      onScoreChange: onScoreChange ?? (() => {}),
      onHealthChange: onHealthChange ?? (() => {}),
      onNarrativeEvent: onNarrativeEvent ?? (() => {}),
      onMutationActivated: onMutationActivated ?? (() => {}),
      onMutationDeactivated: onMutationDeactivated ?? (() => {}),
      onGameOver: onGameOver ?? (() => {}),
      onLevelComplete: onLevelComplete ?? (() => {}),
    };
  }, [
    onScoreChange,
    onHealthChange,
    onNarrativeEvent,
    onMutationActivated,
    onMutationDeactivated,
    onGameOver,
    onLevelComplete,
  ]);

  // Stable proxy callbacks that always call the latest refs
  const proxyCallbacks = useCallback((): GameRuntimeCallbacks => ({
    onScoreChange: (s) => callbacksRef.current.onScoreChange(s),
    onHealthChange: (h, m) => callbacksRef.current.onHealthChange(h, m),
    onNarrativeEvent: (t) => callbacksRef.current.onNarrativeEvent(t),
    onMutationActivated: (n) => callbacksRef.current.onMutationActivated(n),
    onMutationDeactivated: (n) => callbacksRef.current.onMutationDeactivated(n),
    onGameOver: (s) => callbacksRef.current.onGameOver(s),
    onLevelComplete: (s) => callbacksRef.current.onLevelComplete(s),
  }), []);

  // Mount / unmount the Phaser runtime
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import the runtime to avoid SSR issues with Phaser
        const { GameRuntime } = await import('@/engine/runtime');

        if (cancelled) return;

        const runtime = await GameRuntime.create(
          CONTAINER_ID,
          config,
          proxyCallbacks(),
        );

        if (cancelled) {
          runtime.destroy();
          return;
        }

        runtimeRef.current = runtime;
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('[PhaserCanvas] Failed to boot runtime:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to initialize game.',
          );
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      if (runtimeRef.current) {
        runtimeRef.current.destroy();
        runtimeRef.current = null;
      }
    };
    // Re-mount only when the game config identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  return (
    <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
      {/* Phaser renders into this div */}
      <div
        id={CONTAINER_ID}
        ref={containerRef}
        className="absolute inset-0 w-full h-full bg-pixel-black"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pixel-black/90 z-10">
          {/* Pixel spinner */}
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
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pixel-black/90 z-10 p-6">
          <div className="w-4 h-4 bg-pixel-accent mb-3" />
          <p className="font-pixel text-[9px] text-pixel-accent mb-2">
            ERROR
          </p>
          <p className="font-pixel text-[7px] text-pixel-light text-center max-w-xs leading-relaxed">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

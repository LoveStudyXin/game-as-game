'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { GameConfig } from '@/engine/types';
import { decodeSeedCode } from '@/engine/seed';
import GameCanvas from '@/components/game/GameCanvas';
import GameHUD from '@/components/game/GameHUD';
import GameInstructions from '@/components/game/GameInstructions';
import SharePanel from '@/components/game/SharePanel';
import PixelButton from '@/components/pixel/PixelButton';

// ---------------------------------------------------------------------------
// Loading & Error states
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center">
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-pixel-blue"
            style={{
              animation: 'pixel-bounce 0.6s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <p className="font-pixel text-[9px] text-[#9090b0]">
        Loading game...
      </p>
    </div>
  );
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center px-4">
      <div className="w-5 h-5 bg-pixel-accent mb-4" />
      <h2 className="font-pixel text-[12px] text-pixel-accent mb-2">
        ERROR
      </h2>
      <p className="font-pixel text-[8px] text-pixel-light text-center max-w-sm leading-relaxed mb-6">
        {message}
      </p>
      <PixelButton variant="secondary" size="md" onClick={onBack}>
        Back to Home
      </PixelButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Play Page
// ---------------------------------------------------------------------------

export default function PlayPage() {
  const params = useParams<{ seed: string }>();
  const router = useRouter();
  const seedCode = decodeURIComponent(params.seed ?? '');

  // Game config (loaded from API or decoded locally)
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // HUD state
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(0);
  const [maxHealth, setMaxHealth] = useState(0);
  const [narrativeText, setNarrativeText] = useState('');
  const [activeMutations, setActiveMutations] = useState<string[]>([]);

  // Game lifecycle
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // Timer to auto-clear narrative text
  const narrativeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Fetch game config
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!seedCode) {
      setLoadError('No seed code provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGame() {
      try {
        // Try the API first
        const res = await fetch(`/api/seed/${encodeURIComponent(seedCode)}`);

        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.game?.config) {
            setConfig(data.game.config as GameConfig);
            setHealth(100);
            setMaxHealth(100);
            setLoading(false);
            return;
          }
        }

        // Fallback: decode the seed code locally and build a minimal config
        const decoded = decodeSeedCode(seedCode);
        if (decoded.internalSeed === 0 && !decoded.verb) {
          if (!cancelled) {
            setLoadError('Invalid seed code. Could not load or decode the game.');
            setLoading(false);
          }
          return;
        }

        // Build a minimal GameConfig from decoded seed info.
        // In production the generator module would flesh this out; for now
        // we construct a valid shape so GameCanvas can boot.
        const fallbackConfig: GameConfig = {
          id: `local-${seedCode}`,
          seedCode,
          name: `Game ${seedCode}`,
          description: 'Locally decoded game from seed code.',
          genre: 'action',
          visualStyle: 'pixel',
          verbs: decoded.verb ? [decoded.verb] : ['jump'],
          world: {
            gravity: decoded.gravity ?? 'normal',
            boundary: 'walled',
            specialPhysics: 'elastic',
            width: 800,
            height: 450,
            backgroundColor: '#0a0a1a',
          },
          entities: [],
          systems: [],
          rules: [],
          feedbackLoops: [],
          narrative: {
            worldDifference: decoded.worldDifference ?? 'colors_alive',
            characterArchetype: 'explorer',
            events: [],
          },
          difficulty: {
            style: 'steady',
            pace: 'medium',
            skillLuckRatio: 'balanced',
            curve: [0.3, 0.5, 0.7, 0.9],
          },
          chaos: {
            level: decoded.chaosLevel,
            mutations: [],
            mutationFrequencyMs: 30_000,
            maxActiveMutations: 2,
          },
          internalSeed: decoded.internalSeed,
        };

        if (!cancelled) {
          setConfig(fallbackConfig);
          setHealth(100);
          setMaxHealth(100);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[PlayPage] Failed to load game:', err);
          setLoadError('An error occurred while loading the game.');
          setLoading(false);
        }
      }
    }

    loadGame();

    return () => {
      cancelled = true;
    };
  }, [seedCode]);

  // -----------------------------------------------------------------------
  // Callbacks from GameCanvas
  // -----------------------------------------------------------------------

  const handleScoreChange = useCallback((s: number) => {
    setScore(s);
  }, []);

  const handleHealthChange = useCallback((h: number, m: number) => {
    setHealth(h);
    setMaxHealth(m);
  }, []);

  const handleNarrativeEvent = useCallback((text: string) => {
    setNarrativeText(text);

    // Auto-clear after 5 seconds
    if (narrativeTimer.current) clearTimeout(narrativeTimer.current);
    narrativeTimer.current = setTimeout(() => {
      setNarrativeText('');
    }, 5000);
  }, []);

  const handleMutationActivated = useCallback((name: string) => {
    setActiveMutations((prev) =>
      prev.includes(name) ? prev : [...prev, name],
    );
  }, []);

  const handleMutationDeactivated = useCallback((name: string) => {
    setActiveMutations((prev) => prev.filter((m) => m !== name));
  }, []);

  const handleGameOver = useCallback((s: number) => {
    setFinalScore(s);
    setGameOver(true);
  }, []);

  const handleLevelComplete = useCallback((s: number) => {
    setFinalScore(s);
    // Could show a level-complete screen; for now treat as game over
    setGameOver(true);
  }, []);

  // -----------------------------------------------------------------------
  // Play-again restarts by resetting state & forcing a remount of GameCanvas
  // -----------------------------------------------------------------------

  const [gameKey, setGameKey] = useState(0);

  const handlePlayAgain = useCallback(() => {
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setHealth(maxHealth || 100);
    setNarrativeText('');
    setActiveMutations([]);
    setFinalScore(0);
    setShowInstructions(false); // Don't show instructions again on replay
    setGameKey((k) => k + 1);
  }, [maxHealth]);

  // -----------------------------------------------------------------------
  // Keyboard shortcuts
  // -----------------------------------------------------------------------

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (gameOver) return;
        setPaused((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) return <LoadingScreen />;
  if (loadError || !config) {
    return (
      <ErrorScreen
        message={loadError ?? 'Unknown error.'}
        onBack={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center px-1 sm:px-2 py-2 sm:py-4">
      {/* Game container */}
      <div className="relative w-full max-w-4xl">
        {/* Top bar: back + rules + pause */}
        <div className="flex justify-between items-center mb-2 sm:mb-0 sm:absolute sm:-top-8 sm:left-0 sm:right-0 z-40 px-1 sm:px-0">
          <button
            onClick={() => router.push('/')}
            className="font-pixel text-[7px] sm:text-[8px] text-[#9090b0] hover:text-pixel-light transition-colors cursor-pointer"
          >
            &lt; 返回
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setShowInstructions(true)}
              className="font-pixel text-[7px] sm:text-[8px] text-[#9090b0] hover:text-pixel-gold transition-colors cursor-pointer"
            >
              [ 规则 ]
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className="font-pixel text-[7px] sm:text-[8px] text-[#9090b0] hover:text-pixel-light transition-colors cursor-pointer"
            >
              {paused ? '[ 继续 ]' : '[ 暂停 ]'}
            </button>
          </div>
        </div>

        {/* Canvas + HUD wrapper */}
        <div className="relative border-2 sm:border-3 border-pixel-border overflow-hidden">
          <GameCanvas
            key={gameKey}
            config={config}
            onScoreChange={handleScoreChange}
            onHealthChange={handleHealthChange}
            onNarrativeEvent={handleNarrativeEvent}
            onMutationActivated={handleMutationActivated}
            onMutationDeactivated={handleMutationDeactivated}
            onGameOver={handleGameOver}
            onLevelComplete={handleLevelComplete}
          />

          {/* HUD overlay — only for action genre; other genres have their own built-in HUD */}
          {config.genre === 'action' && (
            <GameHUD
              gameName={config.name}
              score={score}
              health={health}
              maxHealth={maxHealth}
              narrativeText={narrativeText}
              activeMutations={activeMutations}
            />
          )}

          {/* Instructions overlay */}
          {showInstructions && !gameOver && (
            <GameInstructions
              genre={config.genre}
              gameName={config.name}
              isReopen={gameStarted}
              onStart={() => {
                setShowInstructions(false);
                setGameStarted(true);
              }}
            />
          )}

          {/* Pause overlay */}
          {paused && !gameOver && (
            <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-pixel-black/80">
              <h2 className="font-pixel text-[14px] sm:text-[16px] text-pixel-gold mb-4 sm:mb-6">
                暂停
              </h2>
              <div className="flex flex-col gap-2 sm:gap-3">
                <PixelButton
                  variant="primary"
                  size="md"
                  onClick={() => setPaused(false)}
                >
                  继续游戏
                </PixelButton>
                <PixelButton
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                >
                  退出游戏
                </PixelButton>
              </div>
            </div>
          )}

          {/* Game Over / Share panel */}
          {gameOver && (
            <SharePanel
              seedCode={config.seedCode}
              score={finalScore}
              onPlayAgain={handlePlayAgain}
              onClose={() => setGameOver(false)}
            />
          )}
        </div>

        {/* Seed code footer */}
        <div className="mt-2 sm:mt-3 text-center">
          <span className="font-pixel text-[5px] sm:text-[6px] text-[#9090b0] break-all">
            种子码: {config.seedCode}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameHUDProps {
  gameName: string;
  score: number;
  health: number;
  maxHealth: number;
  narrativeText: string;
  activeMutations: string[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated score counter with bounce-up on change */
function ScoreDisplay({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(score);
  const [bounce, setBounce] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      setBounce(true);
      prevScore.current = score;

      // Animate the counter towards the new value
      const diff = score - displayScore;
      const steps = Math.min(Math.abs(diff), 20);
      const stepSize = diff / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        if (step >= steps) {
          setDisplayScore(score);
          clearInterval(timer);
        } else {
          setDisplayScore((prev) => Math.round(prev + stepSize));
        }
      }, 30);

      // Remove bounce class after animation
      const bounceTimer = setTimeout(() => setBounce(false), 300);

      return () => {
        clearInterval(timer);
        clearTimeout(bounceTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div
      className={`
        font-pixel text-[12px] text-pixel-gold
        transition-transform duration-300
        ${bounce ? '-translate-y-1 scale-110' : ''}
      `}
    >
      <span className="text-[8px] text-[#9090b0] mr-1">SCORE</span>
      <span>{String(displayScore).padStart(6, '0')}</span>
    </div>
  );
}

/** Pixel-art segmented health bar */
function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const segments = Math.max(maxHealth, 1);
  const filledSegments = Math.max(0, Math.min(health, maxHealth));
  // Show up to 10 blocks; if maxHealth > 10 we scale proportionally
  const displayBlocks = Math.min(segments, 10);
  const filledBlocks = Math.round((filledSegments / segments) * displayBlocks);

  const getBlockColor = (index: number, filled: number, total: number) => {
    if (index >= filled) return 'bg-pixel-border/40';
    const ratio = filled / total;
    if (ratio > 0.6) return 'bg-pixel-green';
    if (ratio > 0.3) return 'bg-pixel-orange';
    return 'bg-pixel-accent';
  };

  return (
    <div className="flex items-center gap-0.5">
      <span className="font-pixel text-[7px] text-[#9090b0] mr-1">HP</span>
      <div className="flex gap-[2px]">
        {Array.from({ length: displayBlocks }, (_, i) => (
          <div
            key={i}
            className={`
              w-[8px] h-[10px]
              border border-pixel-border/60
              transition-colors duration-200
              ${getBlockColor(i, filledBlocks, displayBlocks)}
            `}
          />
        ))}
      </div>
      <span className="font-pixel text-[6px] text-[#9090b0] ml-1">
        {filledSegments}/{segments}
      </span>
    </div>
  );
}

/** Active mutation badge with pulsing animation */
function MutationBadge({ name, index }: { name: string; index: number }) {
  // Generate a deterministic icon/color from the mutation name
  const colors = [
    'bg-pixel-purple',
    'bg-pixel-blue',
    'bg-pixel-orange',
    'bg-pixel-green',
    'bg-pixel-accent',
    'bg-pixel-gold',
  ];
  const colorClass = colors[index % colors.length];

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1
        bg-pixel-surface/80 border border-pixel-border/60
      `}
    >
      <div
        className={`w-2 h-2 ${colorClass}`}
        style={{
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${index * 0.3}s`,
        }}
      />
      <span className="font-pixel text-[6px] text-pixel-light uppercase truncate max-w-[80px]">
        {name}
      </span>
    </div>
  );
}

/** Narrative text with typewriter reveal and fade-out */
function NarrativeOverlay({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!text) {
      setVisible(false);
      setDisplayed('');
      return;
    }

    setVisible(true);
    setDisplayed('');

    let charIndex = 0;
    const timer = setInterval(() => {
      charIndex++;
      setDisplayed(text.slice(0, charIndex));
      if (charIndex >= text.length) {
        clearInterval(timer);
      }
    }, 35);

    return () => clearInterval(timer);
  }, [text]);

  if (!visible && !text) return null;

  return (
    <div
      className={`
        absolute bottom-4 left-1/2 -translate-x-1/2
        max-w-[80%] px-4 py-3
        bg-pixel-black/85 border-2 border-pixel-border
        transition-opacity duration-500
        ${text ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="font-pixel text-[8px] text-pixel-light text-center leading-relaxed">
        {displayed}
        {displayed.length < text.length && (
          <span
            className="inline-block w-[6px] h-[10px] bg-pixel-light ml-[2px] align-middle"
            style={{ animation: 'blink 0.8s step-end infinite' }}
          />
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main HUD Component
// ---------------------------------------------------------------------------

export default function GameHUD({
  gameName,
  score,
  health,
  maxHealth,
  narrativeText,
  activeMutations,
}: GameHUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Top bar background strip */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-pixel-black/70 to-transparent" />

      {/* Game name -- top center */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        <span className="font-pixel text-[7px] text-[#9090b0]/70 uppercase tracking-widest">
          {gameName}
        </span>
      </div>

      {/* Score & Health -- top left */}
      <div className="absolute top-2 left-3 flex flex-col gap-1.5">
        <ScoreDisplay score={score} />
        <HealthBar health={health} maxHealth={maxHealth} />
      </div>

      {/* Active mutations -- top right */}
      {activeMutations.length > 0 && (
        <div className="absolute top-2 right-3 flex flex-col items-end gap-1">
          <span className="font-pixel text-[6px] text-pixel-purple/80 mb-0.5">
            MUTATIONS
          </span>
          {activeMutations.map((mutation, i) => (
            <MutationBadge key={mutation} name={mutation} index={i} />
          ))}
        </div>
      )}

      {/* Narrative text -- bottom center */}
      <NarrativeOverlay text={narrativeText} />

      {/* Inline styles for pulse keyframe (avoids needing a global CSS addition) */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

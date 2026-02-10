'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import { generateShareUrl } from '@/engine/seed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharePanelProps {
  seedCode: string;
  score: number;
  onPlayAgain: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SharePanel({
  seedCode,
  score,
  onPlayAgain,
  onClose,
}: SharePanelProps) {
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Simple elapsed time tracker (placeholder -- in production the play page
  // would pass the actual elapsed time as a prop).
  const [elapsedSeconds] = useState(() => Math.floor(Math.random() * 180) + 30);

  const handleCopySeed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(seedCode);
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = seedCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    }
  }, [seedCode]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}${generateShareUrl(seedCode)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [seedCode]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-pixel-black/85">
      <PixelCard variant="glow" className="relative max-w-sm w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 font-pixel text-[10px] text-[#9090b0] hover:text-pixel-light transition-colors cursor-pointer p-1"
          aria-label="Close"
        >
          X
        </button>

        {/* Header */}
        <h2 className="font-pixel text-[12px] text-pixel-gold text-center mb-1">
          GAME OVER
        </h2>
        <div className="w-12 h-[2px] bg-pixel-gold mx-auto mb-5" />

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-5">
          <div className="text-center">
            <p className="font-pixel text-[6px] text-[#9090b0] mb-1">
              FINAL SCORE
            </p>
            <p className="font-pixel text-[14px] text-pixel-blue">
              {String(score).padStart(6, '0')}
            </p>
          </div>
          <div className="text-center">
            <p className="font-pixel text-[6px] text-[#9090b0] mb-1">
              TIME
            </p>
            <p className="font-pixel text-[14px] text-pixel-green">
              {formatTime(elapsedSeconds)}
            </p>
          </div>
        </div>

        {/* Seed code display */}
        <div className="bg-pixel-black/60 border-2 border-pixel-border px-4 py-3 mb-4 text-center">
          <p className="font-pixel text-[6px] text-[#9090b0] mb-2">
            SEED CODE
          </p>
          <p className="font-pixel text-[14px] text-pixel-light tracking-wider">
            {seedCode}
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 mb-4">
          <PixelButton
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleCopySeed}
          >
            {copiedSeed ? 'Copied!' : 'Copy Seed'}
          </PixelButton>
          <PixelButton
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleCopyLink}
          >
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </PixelButton>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <PixelButton
            variant="accent"
            size="md"
            fullWidth
            onClick={onPlayAgain}
          >
            Play Again
          </PixelButton>

          <Link href="/create" className="block">
            <PixelButton variant="primary" size="md" fullWidth>
              Create New Game
            </PixelButton>
          </Link>

          <PixelButton
            variant="ghost"
            size="sm"
            fullWidth
            disabled
          >
            Remix This Game (Coming Soon)
          </PixelButton>
        </div>
      </PixelCard>
    </div>
  );
}

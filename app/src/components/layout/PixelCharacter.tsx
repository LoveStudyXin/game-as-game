'use client';

import React from 'react';

interface PixelCharacterProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

/**
 * Pixel art character rendered purely with CSS/divs.
 * A small humanoid figure holding a hammer, made of colored blocks.
 */
export default function PixelCharacter({
  size = 4,
  animate = true,
  className = '',
}: PixelCharacterProps) {
  const px = size; // pixel unit size

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: px * 16,
        height: px * 20,
        animation: animate ? 'pixel-bounce 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {/* Head - 6x5 block */}
      <div
        className="absolute bg-pixel-blue"
        style={{
          left: px * 5,
          top: 0,
          width: px * 6,
          height: px * 5,
        }}
      />
      {/* Eyes */}
      <div
        className="absolute bg-pixel-black"
        style={{
          left: px * 6,
          top: px * 2,
          width: px * 1,
          height: px * 1,
          animation: 'blink 3s infinite',
        }}
      />
      <div
        className="absolute bg-pixel-black"
        style={{
          left: px * 9,
          top: px * 2,
          width: px * 1,
          height: px * 1,
          animation: 'blink 3s infinite',
        }}
      />

      {/* Body - 6x6 block */}
      <div
        className="absolute bg-pixel-accent"
        style={{
          left: px * 5,
          top: px * 5,
          width: px * 6,
          height: px * 6,
        }}
      />

      {/* Left Arm */}
      <div
        className="absolute bg-pixel-blue"
        style={{
          left: px * 3,
          top: px * 5,
          width: px * 2,
          height: px * 5,
        }}
      />

      {/* Right Arm (holding hammer) */}
      <div
        className="absolute bg-pixel-blue"
        style={{
          left: px * 11,
          top: px * 5,
          width: px * 2,
          height: px * 3,
        }}
      />

      {/* Hammer handle */}
      <div
        className="absolute bg-pixel-orange"
        style={{
          left: px * 12,
          top: px * 2,
          width: px * 1,
          height: px * 6,
          transformOrigin: 'bottom center',
          animation: animate ? 'pixel-hammer 1s ease-in-out infinite' : 'none',
        }}
      />
      {/* Hammer head */}
      <div
        className="absolute bg-pixel-gold"
        style={{
          left: px * 11,
          top: px * 1,
          width: px * 3,
          height: px * 2,
          transformOrigin: 'bottom center',
          animation: animate ? 'pixel-hammer 1s ease-in-out infinite' : 'none',
        }}
      />

      {/* Left Leg */}
      <div
        className="absolute bg-pixel-dark"
        style={{
          left: px * 5,
          top: px * 11,
          width: px * 2,
          height: px * 5,
        }}
      />

      {/* Right Leg */}
      <div
        className="absolute bg-pixel-dark"
        style={{
          left: px * 9,
          top: px * 11,
          width: px * 2,
          height: px * 5,
        }}
      />

      {/* Feet */}
      <div
        className="absolute bg-pixel-border"
        style={{
          left: px * 4,
          top: px * 16,
          width: px * 3,
          height: px * 2,
        }}
      />
      <div
        className="absolute bg-pixel-border"
        style={{
          left: px * 9,
          top: px * 16,
          width: px * 3,
          height: px * 2,
        }}
      />
    </div>
  );
}

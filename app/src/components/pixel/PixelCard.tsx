'use client';

import React from 'react';

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'glow';
  hoverable?: boolean;
  onClick?: () => void;
}

export default function PixelCard({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  onClick,
}: PixelCardProps) {
  const variantStyles = {
    default: `
      bg-pixel-surface
      border-3 border-pixel-border
      shadow-[inset_-2px_-2px_0_0_#0a0a2e,inset_2px_2px_0_0_#2a2a4c]
    `,
    accent: `
      bg-pixel-surface
      border-3 border-pixel-accent
      shadow-[inset_-2px_-2px_0_0_#0a0a2e,inset_2px_2px_0_0_#ff6b80]
    `,
    glow: `
      bg-pixel-surface
      border-3 border-pixel-blue
      shadow-[inset_-2px_-2px_0_0_#0a0a2e,inset_2px_2px_0_0_#40e4ff,0_0_20px_rgba(0,212,255,0.2)]
    `,
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 font-pixel
        ${variantStyles[variant]}
        ${hoverable ? 'cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_6px_0_0_#0a0a1a] transition-all duration-150' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

'use client';

import React from 'react';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: `
    bg-pixel-mid text-pixel-light
    border-3 border-pixel-border
    shadow-[inset_-2px_-2px_0_0_#0a0a2e,inset_2px_2px_0_0_#1a5a9e,4px_4px_0_0_#0a0a1a]
    hover:bg-pixel-blue hover:text-pixel-black
  `,
  secondary: `
    bg-pixel-surface text-pixel-light
    border-3 border-pixel-border
    shadow-[inset_-2px_-2px_0_0_#0a0a2e,inset_2px_2px_0_0_#2a2a4c,4px_4px_0_0_#0a0a1a]
    hover:bg-pixel-border
  `,
  accent: `
    bg-pixel-accent text-white
    border-3 border-[#ff6b80]
    shadow-[inset_-2px_-2px_0_0_#a0304a,inset_2px_2px_0_0_#ff8a9a,4px_4px_0_0_#0a0a1a]
    hover:bg-[#ff6b80]
  `,
  ghost: `
    bg-transparent text-pixel-light
    border-3 border-transparent
    hover:border-pixel-border hover:bg-pixel-surface
  `,
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-[8px]',
  md: 'px-5 py-2.5 text-[10px]',
  lg: 'px-8 py-4 text-[12px]',
};

export default function PixelButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
}: PixelButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-pixel cursor-pointer select-none
        transition-all duration-100
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

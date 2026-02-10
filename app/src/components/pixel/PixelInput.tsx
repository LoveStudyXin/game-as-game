'use client';

import React from 'react';

interface PixelInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  type?: 'text' | 'email' | 'password';
  className?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
}

export default function PixelInput({
  value,
  onChange,
  placeholder = '',
  label,
  type = 'text',
  className = '',
  maxLength,
  disabled = false,
  error,
}: PixelInputProps) {
  return (
    <div className={`font-pixel ${className}`}>
      {label && (
        <label className="block text-[9px] text-pixel-light mb-1.5">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5
          bg-pixel-black text-pixel-light
          border-3 font-pixel text-[10px]
          placeholder:text-[#7070a0]
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-pixel-accent shadow-[inset_-2px_-2px_0_0_#a0304a,inset_2px_2px_0_0_#ff6b80]'
            : 'border-pixel-border shadow-[inset_-2px_-2px_0_0_#0a0a1a,inset_2px_2px_0_0_#2a2a4c] focus:border-pixel-blue'
          }
        `}
      />
      {error && (
        <p className="mt-1 text-[8px] text-pixel-accent">{error}</p>
      )}
    </div>
  );
}

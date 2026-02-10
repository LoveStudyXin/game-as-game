'use client';

import React, { useState } from 'react';

interface PixelSelectOption {
  value: string;
  label: string;
  icon?: string; // Emoji or text icon
  description?: string;
}

interface PixelSelectProps {
  options: PixelSelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  label?: string;
  multiple?: boolean;
  maxSelect?: number;
  layout?: 'grid' | 'list';
  className?: string;
}

export default function PixelSelect({
  options,
  value,
  onChange,
  label,
  multiple = false,
  maxSelect = 3,
  layout = 'grid',
  className = '',
}: PixelSelectProps) {
  const selectedValues = Array.isArray(value) ? value : [value];

  const isSelected = (optValue: string) => selectedValues.includes(optValue);

  const handleSelect = (optValue: string) => {
    if (multiple) {
      if (isSelected(optValue)) {
        const next = selectedValues.filter((v) => v !== optValue);
        onChange(next);
      } else {
        if (selectedValues.length < maxSelect) {
          onChange([...selectedValues, optValue]);
        }
      }
    } else {
      onChange(optValue);
    }
  };

  return (
    <div className={`font-pixel ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] text-pixel-light">{label}</span>
          {multiple && (
            <span className="text-[7px] text-[#9090b0]">
              {selectedValues.length}/{maxSelect}
            </span>
          )}
        </div>
      )}

      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 gap-2'
            : 'flex flex-col gap-2'
        }
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`
              px-3 py-2.5 text-left cursor-pointer
              transition-all duration-100
              active:translate-x-[1px] active:translate-y-[1px]
              ${
                isSelected(opt.value)
                  ? `
                    bg-pixel-mid border-3 border-pixel-blue text-pixel-light
                    shadow-[inset_-2px_-2px_0_0_#0060a0,inset_2px_2px_0_0_#40e4ff,0_0_12px_rgba(0,212,255,0.15)]
                  `
                  : `
                    bg-pixel-black border-3 border-pixel-border text-[#9a9abc]
                    shadow-[inset_-2px_-2px_0_0_#0a0a1a,inset_2px_2px_0_0_#2a2a4c]
                    hover:border-pixel-light hover:text-pixel-light
                  `
              }
            `}
          >
            <div className="flex items-center gap-2">
              {opt.icon && <span className="text-[14px]">{opt.icon}</span>}
              <span className="text-[9px]">{opt.label}</span>
            </div>
            {opt.description && (
              <p className="text-[7px] mt-1 opacity-80">{opt.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

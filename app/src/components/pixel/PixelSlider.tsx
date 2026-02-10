'use client';

import React, { useState, useCallback } from 'react';

interface PixelSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  marks?: { value: number; label: string }[];
  colorStops?: { at: number; color: string }[];
  className?: string;
}

export default function PixelSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  marks,
  colorStops,
  className = '',
}: PixelSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const getTrackColor = useCallback(() => {
    if (!colorStops || colorStops.length === 0) {
      return '#00d4ff';
    }
    // Find the appropriate color based on current value
    const sorted = [...colorStops].sort((a, b) => a.at - b.at);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (percentage >= sorted[i].at) {
        return sorted[i].color;
      }
    }
    return sorted[0].color;
  }, [percentage, colorStops]);

  return (
    <div className={`font-pixel ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-pixel-light">{label}</span>
          {showValue && (
            <span className="text-[10px]" style={{ color: getTrackColor() }}>
              {value}%
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Track background */}
        <div className="h-4 bg-pixel-black border-2 border-pixel-border relative">
          {/* Filled portion */}
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${percentage}%`,
              backgroundColor: getTrackColor(),
            }}
          />
          {/* Pixel grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px, transparent 4px)
              `,
              backgroundSize: '4px 100%',
            }}
          />
        </div>

        {/* Invisible range input on top */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Marks */}
      {marks && (
        <div className="relative mt-1 h-6">
          {marks.map((mark) => (
            <span
              key={mark.value}
              className="absolute text-[7px] text-[#9090b0] transform -translate-x-1/2 whitespace-nowrap"
              style={{
                left: `${((mark.value - min) / (max - min)) * 100}%`,
              }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

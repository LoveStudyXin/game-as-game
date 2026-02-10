'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameCanvasProps } from './GameCanvas';
import type { RhythmGameData, RhythmNote } from '@/engine/types';

// ---------------------------------------------------------------------------
// RhythmCanvas: Lightweight Canvas-based rhythm game renderer
// Uses requestAnimationFrame, NOT Phaser
// ---------------------------------------------------------------------------

const LANE_KEYS = ['d', 'f', 'j', 'k'];
const LANE_COLORS = ['#ff4488', '#44ff88', '#4488ff', '#ffaa44'];
const LANE_LABELS = ['D', 'F', 'J', 'K'];

// Hit windows (in ms)
const PERFECT_WINDOW = 50;
const GREAT_WINDOW = 100;
const GOOD_WINDOW = 150;

type HitJudgment = 'perfect' | 'great' | 'good' | 'miss';

const JUDGMENT_SCORES: Record<HitJudgment, number> = {
  perfect: 100,
  great: 50,
  good: 25,
  miss: 0,
};

const JUDGMENT_COLORS: Record<HitJudgment, string> = {
  perfect: '#ffd700',
  great: '#44ff88',
  good: '#4488ff',
  miss: '#ff4444',
};

interface NoteState {
  note: RhythmNote;
  hit: boolean;
  judgment?: HitJudgment;
}

export default function RhythmCanvas({
  config,
  onScoreChange,
  onNarrativeEvent,
  onGameOver,
}: GameCanvasProps) {
  const data = config.genreData?.rhythm;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    startTime: 0,
    running: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    judgments: { perfect: 0, great: 0, good: 0, miss: 0 } as Record<HitJudgment, number>,
  });
  const notesRef = useRef<NoteState[]>([]);
  const lastJudgmentRef = useRef<{ text: HitJudgment; time: number } | null>(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastJudgment, setLastJudgment] = useState<HitJudgment | null>(null);
  const [progress, setProgress] = useState(0);
  const animFrameRef = useRef<number>(0);

  const laneCount = data?.laneCount || 4;
  const scrollSpeed = data?.scrollSpeed || 400;
  const songDuration = data?.songDuration || 60000;

  // Initialize notes
  useEffect(() => {
    if (!data) return;
    notesRef.current = data.notes.map(note => ({ note, hit: false }));
    gameStateRef.current = {
      startTime: 0,
      running: false,
      score: 0,
      combo: 0,
      maxCombo: 0,
      judgments: { perfect: 0, great: 0, good: 0, miss: 0 },
    };
    setScore(0);
    setCombo(0);
    setStarted(false);
    setGameOver(false);
    setProgress(0);
  }, [data]);

  // Canvas rendering loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    if (!state.running) return;

    const now = performance.now();
    const elapsed = now - state.startTime;
    const W = canvas.width;
    const H = canvas.height;
    const laneW = W / laneCount;
    const hitLineX = 120;

    // Clear
    ctx.fillStyle = '#0a0a16';
    ctx.fillRect(0, 0, W, H);

    // Draw lanes
    for (let i = 0; i <= laneCount; i++) {
      ctx.strokeStyle = '#1a1a3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i * (H / laneCount));
      ctx.lineTo(W, i * (H / laneCount));
      ctx.stroke();
    }

    // Draw hit line
    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hitLineX, 0);
    ctx.lineTo(hitLineX, H);
    ctx.stroke();

    // Draw hit zone glow
    ctx.fillStyle = '#ffffff08';
    ctx.fillRect(hitLineX - 20, 0, 40, H);

    // Draw lane labels
    for (let i = 0; i < laneCount; i++) {
      const ly = i * (H / laneCount) + (H / laneCount) / 2;
      ctx.fillStyle = LANE_COLORS[i % LANE_COLORS.length] + '40';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(LANE_LABELS[i] || '', 40, ly + 5);
    }

    // Draw and update notes
    const notes = notesRef.current;
    let missedNew = false;

    for (const ns of notes) {
      if (ns.hit) continue;

      const noteTime = ns.note.time;
      const noteX = hitLineX + ((noteTime - elapsed) / 1000) * scrollSpeed;
      const laneY = ns.note.lane * (H / laneCount);
      const noteH = H / laneCount;

      // Off screen left = missed
      if (noteX < -50) {
        ns.hit = true;
        ns.judgment = 'miss';
        state.judgments.miss++;
        state.combo = 0;
        missedNew = true;
        continue;
      }

      // Off screen right = not visible yet
      if (noteX > W + 50) continue;

      // Draw note
      const color = LANE_COLORS[ns.note.lane % LANE_COLORS.length];
      const noteW = ns.note.type === 'hold' ? Math.max(20, ((ns.note.duration || 200) / 1000) * scrollSpeed) : 30;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(noteX - noteW / 2, laneY + 4, noteW, noteH - 8);
      ctx.globalAlpha = 1;

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(noteX - noteW / 2, laneY + 4, noteW, noteH - 8);
    }

    if (missedNew) {
      setCombo(0);
      setLastJudgment('miss');
    }

    // Draw judgment text
    const lj = lastJudgmentRef.current;
    if (lj && now - lj.time < 500) {
      const alpha = 1 - (now - lj.time) / 500;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = JUDGMENT_COLORS[lj.text];
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(lj.text.toUpperCase(), hitLineX, H / 2);
      ctx.globalAlpha = 1;
    }

    // Update progress
    const prog = Math.min(1, elapsed / songDuration);
    setProgress(prog);

    // Check song end
    if (elapsed >= songDuration) {
      state.running = false;
      setGameOver(true);
      onScoreChange?.(state.score);
      setTimeout(() => onGameOver?.(state.score), 1000);
      return;
    }

    // Check if all notes are done
    if (notes.every(n => n.hit)) {
      state.running = false;
      setGameOver(true);
      const finalScore = state.score + 500; // Completion bonus
      state.score = finalScore;
      setScore(finalScore);
      onScoreChange?.(finalScore);
      setTimeout(() => onGameOver?.(finalScore), 1000);
      return;
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [laneCount, scrollSpeed, songDuration, onScoreChange, onGameOver]);

  // Start game
  const startGame = useCallback(() => {
    setStarted(true);
    gameStateRef.current.startTime = performance.now();
    gameStateRef.current.running = true;
    animFrameRef.current = requestAnimationFrame(render);
  }, [render]);

  // Handle key press
  useEffect(() => {
    if (!started || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const laneIdx = LANE_KEYS.indexOf(e.key.toLowerCase());
      if (laneIdx === -1) return;

      const state = gameStateRef.current;
      if (!state.running) return;

      const now = performance.now();
      const elapsed = now - state.startTime;

      // Find closest unhit note in this lane
      let closestNote: NoteState | null = null;
      let closestDiff = Infinity;

      for (const ns of notesRef.current) {
        if (ns.hit || ns.note.lane !== laneIdx) continue;
        const diff = Math.abs(ns.note.time - elapsed);
        if (diff < closestDiff && diff < GOOD_WINDOW) {
          closestDiff = diff;
          closestNote = ns;
        }
      }

      if (!closestNote) return;

      // Judge the hit
      let judgment: HitJudgment;
      if (closestDiff <= PERFECT_WINDOW) {
        judgment = 'perfect';
      } else if (closestDiff <= GREAT_WINDOW) {
        judgment = 'great';
      } else {
        judgment = 'good';
      }

      closestNote.hit = true;
      closestNote.judgment = judgment;
      state.judgments[judgment]++;
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;

      const points = JUDGMENT_SCORES[judgment] * (1 + Math.floor(state.combo / 10) * 0.1);
      state.score += Math.round(points);

      setScore(state.score);
      setCombo(state.combo);
      setLastJudgment(judgment);
      lastJudgmentRef.current = { text: judgment, time: now };
      onScoreChange?.(state.score);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, gameOver, onScoreChange]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!data) {
    return (
      <div className="relative w-full bg-[#0a0a1a] flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <p className="font-pixel text-[10px] text-[#666]">No rhythm data available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0a0a16] overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* HUD overlay */}
      <div className="absolute top-2 left-3 right-3 flex justify-between items-start z-10">
        <div className="flex flex-col gap-1">
          <span className="font-pixel text-[8px] text-[#ffd700]">SCORE: {score}</span>
          <span className="font-pixel text-[7px]" style={{ color: combo > 10 ? '#ffd700' : combo > 5 ? '#44ff88' : '#aaaacc' }}>
            COMBO: {combo}x
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-pixel text-[7px] text-[#8888cc]">{data.bpm} BPM</span>
          {/* Progress bar */}
          <div className="w-24 h-1 bg-[#1a1a2a]">
            <div className="h-full bg-[#4488ff] transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Judgment display */}
      {lastJudgment && (
        <div className="absolute left-[120px] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <span
            className="font-pixel text-[12px] animate-pulse"
            style={{ color: JUDGMENT_COLORS[lastJudgment] }}
          >
            {lastJudgment.toUpperCase()}
          </span>
        </div>
      )}

      {/* Key hints */}
      <div className="absolute bottom-2 left-1 flex flex-col gap-[2px] z-10">
        {LANE_KEYS.slice(0, laneCount).map((key, i) => (
          <span key={key} className="font-pixel text-[6px] px-1" style={{ color: LANE_COLORS[i] + '80' }}>
            [{key.toUpperCase()}]
          </span>
        ))}
      </div>

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 bg-[#000000cc] flex flex-col items-center justify-center z-20">
          <p className="font-pixel text-[14px] text-[#ffd700] mb-4">RHYTHM GAME</p>
          <p className="font-pixel text-[8px] text-[#aaaacc] mb-2">Use D F J K keys to hit notes</p>
          <p className="font-pixel text-[7px] text-[#666] mb-6">{data.notes.length} notes | {data.bpm} BPM</p>
          <button
            onClick={startGame}
            className="font-pixel text-[10px] px-6 py-2 border-2 border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-[#000] transition-colors cursor-pointer"
          >
            START
          </button>
        </div>
      )}

      {/* Results screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-[#000000dd] flex flex-col items-center justify-center z-20">
          <p className="font-pixel text-[14px] text-[#ffd700] mb-4">SONG COMPLETE</p>
          <div className="space-y-1 text-center mb-4">
            <p className="font-pixel text-[8px] text-[#ffd700]">Perfect: {gameStateRef.current.judgments.perfect}</p>
            <p className="font-pixel text-[8px] text-[#44ff88]">Great: {gameStateRef.current.judgments.great}</p>
            <p className="font-pixel text-[8px] text-[#4488ff]">Good: {gameStateRef.current.judgments.good}</p>
            <p className="font-pixel text-[8px] text-[#ff4444]">Miss: {gameStateRef.current.judgments.miss}</p>
          </div>
          <p className="font-pixel text-[7px] text-[#aaaacc]">Max Combo: {gameStateRef.current.maxCombo}x</p>
          <p className="font-pixel text-[12px] text-[#ffd700] mt-2">SCORE: {score}</p>
        </div>
      )}
    </div>
  );
}

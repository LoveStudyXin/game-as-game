'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameCanvasProps } from './GameCanvas';
import type { LogicPuzzleDef, PuzzleGameData } from '@/engine/types';

// ---------------------------------------------------------------------------
// PuzzleCanvas: React logic puzzle renderer
// Supports: sudoku, nonogram, logic_grid, connection, sequence
// ---------------------------------------------------------------------------

// Sudoku sub-renderer
function SudokuGrid({
  puzzle,
  onComplete,
}: {
  puzzle: LogicPuzzleDef;
  onComplete: (score: number) => void;
}) {
  const size = puzzle.size; // e.g., 9
  const [grid, setGrid] = useState<(number | string | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Initialize with puzzle grid (null = editable, number = given)
    setGrid(puzzle.grid.map(row => [...row]));
    setErrors(new Set());
    setCompleted(false);
  }, [puzzle]);

  const isGiven = useCallback((r: number, c: number) => {
    return puzzle.grid[r]?.[c] !== null;
  }, [puzzle]);

  const handleInput = useCallback((value: number | null) => {
    if (!selectedCell || completed) return;
    const [r, c] = selectedCell;
    if (isGiven(r, c)) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = value;
    setGrid(newGrid);

    // Check for errors
    const newErrors = new Set<string>();
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const val = newGrid[row][col];
        if (val === null) continue;
        if (val !== puzzle.solution[row]?.[col]) {
          newErrors.add(`${row},${col}`);
        }
      }
    }
    setErrors(newErrors);

    // Check completion
    const allFilled = newGrid.every(row => row.every(cell => cell !== null));
    if (allFilled && newErrors.size === 0) {
      setCompleted(true);
      onComplete(500);
    }
  }, [selectedCell, grid, size, puzzle, completed, isGiven, onComplete]);

  const sqrtSize = Math.floor(Math.sqrt(size));
  const cellPx = Math.min(36, Math.floor(280 / size));

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
        border: '2px solid #5a5a8a',
      }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isError = errors.has(`${r},${c}`);
            const given = isGiven(r, c);
            const borderRight = (c + 1) % sqrtSize === 0 && c < size - 1 ? '2px solid #5a5a8a' : '1px solid #2a2a4a';
            const borderBottom = (r + 1) % sqrtSize === 0 && r < size - 1 ? '2px solid #5a5a8a' : '1px solid #2a2a4a';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelectedCell([r, c])}
                className="flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  width: cellPx,
                  height: cellPx,
                  backgroundColor: isSelected ? '#2a3a5a' : isError ? '#3a1a1a' : '#12121e',
                  borderRight,
                  borderBottom,
                }}
              >
                <span
                  className="font-pixel text-[9px]"
                  style={{
                    color: given ? '#8888cc' : isError ? '#ff4444' : '#e0e0f0',
                  }}
                >
                  {cell !== null ? String(cell) : ''}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Number input buttons */}
      <div className="flex gap-1">
        {Array.from({ length: size }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => handleInput(n)}
            className="w-6 h-6 border border-[#3a3a5a] font-pixel text-[7px] text-[#aaaacc] hover:bg-[#2a2a4a] cursor-pointer"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleInput(null)}
          className="w-6 h-6 border border-[#3a3a5a] font-pixel text-[7px] text-[#aa4444] hover:bg-[#2a1a1a] cursor-pointer"
        >
          X
        </button>
      </div>

      {completed && (
        <p className="font-pixel text-[10px] text-[#ffd700]">Puzzle Solved!</p>
      )}
    </div>
  );
}

// Connection puzzle sub-renderer
function ConnectionGrid({
  puzzle,
  onComplete,
}: {
  puzzle: LogicPuzzleDef;
  onComplete: (score: number) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<string[][]>([]);
  const [completed, setCompleted] = useState(false);

  // Flatten grid to get all words
  const words = useMemo(() => {
    const flat: { word: string; r: number; c: number }[] = [];
    puzzle.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null) flat.push({ word: String(cell), r, c });
      });
    });
    return flat;
  }, [puzzle]);

  // Solution groups (rows in solution)
  const solutionGroups = useMemo(() => {
    return puzzle.solution.map(row => row.map(String));
  }, [puzzle]);

  const handleWordClick = useCallback((word: string) => {
    if (completed) return;
    if (found.some(g => g.includes(word))) return; // Already found

    const newSelected = new Set(selected);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }

    // Check if selected matches a group (when 4 selected)
    if (newSelected.size === 4) {
      const selectedArr = Array.from(newSelected);
      const matchedGroup = solutionGroups.find(group =>
        selectedArr.every(w => group.includes(w)) && group.every(w => selectedArr.includes(w))
      );

      if (matchedGroup) {
        setFound(prev => [...prev, selectedArr]);
        setSelected(new Set());

        if (found.length + 1 >= solutionGroups.length) {
          setCompleted(true);
          onComplete(800);
        }
      } else {
        // Wrong group - flash red then clear
        setTimeout(() => setSelected(new Set()), 500);
      }
    } else {
      setSelected(newSelected);
    }
  }, [selected, found, solutionGroups, completed, onComplete]);

  const groupColors = ['#4a6aaa', '#6a4aaa', '#aa6a4a', '#4aaa6a'];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-pixel text-[7px] text-[#8888cc]">Find groups of 4 connected words</p>

      {/* Found groups */}
      {found.map((group, gi) => (
        <div key={gi} className="flex gap-1 px-2 py-1" style={{ backgroundColor: groupColors[gi % groupColors.length] + '30', borderLeft: `3px solid ${groupColors[gi % groupColors.length]}` }}>
          {group.map(w => (
            <span key={w} className="font-pixel text-[7px] text-[#e0e0f0]">{w}</span>
          ))}
        </div>
      ))}

      {/* Clue */}
      {puzzle.clues.length > 0 && (
        <p className="font-pixel text-[6px] text-[#aaaa88]">{puzzle.clues[found.length] || ''}</p>
      )}

      {/* Word grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {words.filter(w => !found.some(g => g.includes(w.word))).map(({ word }) => {
          const isSelected = selected.has(word);
          return (
            <button
              key={word}
              onClick={() => handleWordClick(word)}
              className={`px-2 py-1.5 border font-pixel text-[7px] cursor-pointer transition-all ${
                isSelected ? 'border-[#ffd700] bg-[#2a2a1a] text-[#ffd700]' : 'border-[#3a3a5a] text-[#aaaacc] hover:border-[#5a5a8a]'
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {completed && (
        <p className="font-pixel text-[10px] text-[#ffd700]">All Groups Found!</p>
      )}
    </div>
  );
}

// Sequence puzzle sub-renderer
function SequenceGrid({
  puzzle,
  onComplete,
}: {
  puzzle: LogicPuzzleDef;
  onComplete: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<(string | number | null)[]>(
    puzzle.grid[0]?.map(() => null) || []
  );
  const [completed, setCompleted] = useState(false);

  const handleInput = useCallback((idx: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = value || null;
    setAnswers(newAnswers);

    // Check if all correct
    const allCorrect = puzzle.solution[0]?.every((sol, i) =>
      String(newAnswers[i]).toLowerCase() === String(sol).toLowerCase()
    );
    if (allCorrect && newAnswers.every(a => a !== null)) {
      setCompleted(true);
      onComplete(600);
    }
  }, [answers, puzzle, onComplete]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-pixel text-[7px] text-[#8888cc]">Complete the sequence</p>

      {/* Clues */}
      {puzzle.clues.map((clue, i) => (
        <p key={i} className="font-pixel text-[6px] text-[#aaaa88]">{clue}</p>
      ))}

      {/* Sequence display */}
      <div className="flex items-center gap-2">
        {puzzle.grid[0]?.map((cell, i) => {
          const isBlank = cell === null;
          return (
            <div key={i} className="flex items-center gap-1">
              {isBlank ? (
                <input
                  type="text"
                  maxLength={4}
                  value={answers[i] || ''}
                  onChange={(e) => handleInput(i, e.target.value)}
                  className="w-10 h-8 bg-[#1a1a2e] border border-[#4a4a8a] text-center font-pixel text-[8px] text-[#e0e0f0] outline-none focus:border-[#ffd700]"
                />
              ) : (
                <div className="w-10 h-8 bg-[#12121e] border border-[#2a2a4a] flex items-center justify-center">
                  <span className="font-pixel text-[8px] text-[#8888cc]">{String(cell)}</span>
                </div>
              )}
              {i < (puzzle.grid[0]?.length || 0) - 1 && (
                <span className="font-pixel text-[8px] text-[#3a3a5a]">,</span>
              )}
            </div>
          );
        })}
      </div>

      {completed && (
        <p className="font-pixel text-[10px] text-[#ffd700]">Sequence Complete!</p>
      )}
    </div>
  );
}

export default function PuzzleCanvas({
  config,
  onScoreChange,
  onNarrativeEvent,
  onGameOver,
  onLevelComplete,
}: GameCanvasProps) {
  const data = config.genreData?.puzzle;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [allComplete, setAllComplete] = useState(false);

  const currentPuzzle = data?.puzzles[currentIndex] || null;

  // Timer
  useEffect(() => {
    if (!currentPuzzle || currentPuzzle.timeLimit <= 0 || allComplete) return;
    setTimeLeft(currentPuzzle.timeLimit);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onNarrativeEvent?.('Time up!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, currentPuzzle, allComplete, onNarrativeEvent]);

  const handlePuzzleComplete = useCallback((puzzleScore: number) => {
    const bonus = timeLeft > 0 ? Math.floor(timeLeft * 2) : 0;
    const newTotal = totalScore + puzzleScore + bonus;
    setTotalScore(newTotal);
    onScoreChange?.(newTotal);
    onNarrativeEvent?.(`Puzzle ${currentIndex + 1} complete! +${puzzleScore + bonus} pts`);

    // Move to next puzzle
    setTimeout(() => {
      if (data && currentIndex < data.puzzles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setAllComplete(true);
        const finalScore = newTotal + 500;
        setTotalScore(finalScore);
        onScoreChange?.(finalScore);
        setTimeout(() => onLevelComplete?.(finalScore), 2000);
      }
    }, 1500);
  }, [totalScore, timeLeft, currentIndex, data, onScoreChange, onNarrativeEvent, onLevelComplete]);

  if (!data || !currentPuzzle) {
    return (
      <div className="relative w-full bg-[#0a0a1a] flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <p className="font-pixel text-[10px] text-[#666]">No puzzle data available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0e0e1a] overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-lg mb-3">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[7px] text-[#8888cc]">
              Puzzle {currentIndex + 1}/{data.puzzles.length}
            </span>
            <span className="font-pixel text-[7px] px-2 py-0.5 border border-[#3a3a5a] text-[#aaaa88]">
              {currentPuzzle.type.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentPuzzle.timeLimit > 0 && (
              <span className={`font-pixel text-[8px] ${timeLeft < 30 ? 'text-[#ff4444]' : 'text-[#aaaacc]'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            )}
            <span className="font-pixel text-[8px] text-[#ffd700]">{totalScore} pts</span>
          </div>
        </div>

        {/* Puzzle area */}
        <div className="flex-1 flex items-center justify-center">
          {currentPuzzle.type === 'sudoku' && (
            <SudokuGrid puzzle={currentPuzzle} onComplete={handlePuzzleComplete} />
          )}
          {currentPuzzle.type === 'connection' && (
            <ConnectionGrid puzzle={currentPuzzle} onComplete={handlePuzzleComplete} />
          )}
          {(currentPuzzle.type === 'sequence' || currentPuzzle.type === 'logic_grid') && (
            <SequenceGrid puzzle={currentPuzzle} onComplete={handlePuzzleComplete} />
          )}
          {currentPuzzle.type === 'nonogram' && (
            <SudokuGrid puzzle={currentPuzzle} onComplete={handlePuzzleComplete} />
          )}
        </div>

        {/* All complete */}
        {allComplete && (
          <div className="absolute inset-0 bg-[#000000cc] flex flex-col items-center justify-center z-20">
            <p className="font-pixel text-[16px] text-[#ffd700] mb-3">ALL PUZZLES SOLVED!</p>
            <p className="font-pixel text-[9px] text-[#aaaacc]">Final Score: {totalScore}</p>
          </div>
        )}
      </div>
    </div>
  );
}

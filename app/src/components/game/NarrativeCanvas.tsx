'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameCanvasProps } from './GameCanvas';
import type { NarrativeNode, NarrativeGameData } from '@/engine/types';

// ---------------------------------------------------------------------------
// NarrativeCanvas: Pure React text adventure / detective game renderer
// ---------------------------------------------------------------------------

// Background mood colors
const MOOD_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  dark:      { bg: '#0a0a1a', text: '#e0e0ec', accent: '#8a6acc' },
  tense:     { bg: '#1a0a0a', text: '#f0d8d8', accent: '#cc6a6a' },
  mystery:   { bg: '#0a0a2a', text: '#d8d8f8', accent: '#6a8acc' },
  warm:      { bg: '#1a1408', text: '#f0e8d0', accent: '#ccaa6a' },
  eerie:     { bg: '#081a0a', text: '#d8f0e0', accent: '#6acc8a' },
  neutral:   { bg: '#12121e', text: '#dcdce8', accent: '#9090b8' },
  bright:    { bg: '#1a1a2e', text: '#f0f0ff', accent: '#aaaadd' },
  ending:    { bg: '#0f0f2a', text: '#ffd700', accent: '#ffa500' },
};

function getMood(node: NarrativeNode): { bg: string; text: string; accent: string } {
  const bg = node.background || 'neutral';
  return MOOD_COLORS[bg] || MOOD_COLORS.neutral;
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 30) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

export default function NarrativeCanvas({
  config,
  onScoreChange,
  onNarrativeEvent,
  onGameOver,
  onLevelComplete,
}: GameCanvasProps) {
  const data = config.genreData?.narrative;

  // Game state
  const [currentNodeId, setCurrentNodeId] = useState(data?.startNodeId || '');
  const [collectedClues, setCollectedClues] = useState<string[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [showClues, setShowClues] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [trustLevel, setTrustLevel] = useState(50); // 0-100
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current node
  const currentNode = data?.nodes.find(n => n.id === currentNodeId) || null;
  const mood = currentNode ? getMood(currentNode) : MOOD_COLORS.neutral;

  // Typewriter for scene text
  const { displayed: sceneText, done: textDone, skip: skipText } = useTypewriter(
    currentNode?.text || '', 25
  );

  // Initialize
  useEffect(() => {
    if (data) {
      setCurrentNodeId(data.startNodeId);
      setCollectedClues([]);
      setVisitedNodes(new Set());
      setScore(0);
      setTrustLevel(50);
    }
  }, [data]);

  // Collect clue on node visit
  useEffect(() => {
    if (!currentNode) return;

    // Mark visited
    setVisitedNodes(prev => new Set([...prev, currentNode.id]));

    // Collect clue if available
    if (currentNode.clue && !collectedClues.includes(currentNode.clue)) {
      setCollectedClues(prev => [...prev, currentNode.clue!]);
      const newScore = score + 100;
      setScore(newScore);
      onScoreChange?.(newScore);
      onNarrativeEvent?.(`Found clue: ${currentNode.clue}`);
    }

    // Check if this is an ending
    if (currentNode.flags?.includes('ending')) {
      const finalScore = score + 500;
      setScore(finalScore);
      onScoreChange?.(finalScore);
      setTimeout(() => {
        onGameOver?.(finalScore);
      }, 3000);
    }

    // Fade in transition
    setFadeIn(true);
    const timer = setTimeout(() => setFadeIn(false), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId]);

  // Handle choice
  const handleChoice = useCallback((choice: { nextNodeId: string; effect?: string }) => {
    // Process effect
    if (choice.effect) {
      if (choice.effect.startsWith('change_trust:')) {
        const delta = parseInt(choice.effect.split(':')[1], 10);
        setTrustLevel(prev => Math.max(0, Math.min(100, prev + delta)));
      }
      if (choice.effect.startsWith('add_clue:')) {
        const clue = choice.effect.split(':')[1];
        if (!collectedClues.includes(clue)) {
          setCollectedClues(prev => [...prev, clue]);
        }
      }
    }

    const newScore = score + 10;
    setScore(newScore);
    onScoreChange?.(newScore);
    setCurrentNodeId(choice.nextNodeId);
  }, [score, collectedClues, onScoreChange]);

  // Check if choice condition is met
  const isChoiceAvailable = useCallback((condition?: string) => {
    if (!condition) return true;
    if (condition.startsWith('has_clue:')) {
      return collectedClues.includes(condition.split(':')[1]);
    }
    if (condition.startsWith('trust>')) {
      return trustLevel > parseInt(condition.split('>')[1], 10);
    }
    if (condition.startsWith('visited:')) {
      return visitedNodes.has(condition.split(':')[1]);
    }
    return true;
  }, [collectedClues, trustLevel, visitedNodes]);

  // No data fallback
  if (!data || !currentNode) {
    return (
      <div className="relative w-full bg-[#0a0a1a] flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <p className="font-pixel text-[10px] text-[#666]">No narrative data available.</p>
      </div>
    );
  }

  const availableChoices = currentNode.choices.filter(c => isChoiceAvailable(c.condition));
  const isEnding = currentNode.flags?.includes('ending');
  const progress = Math.round((visitedNodes.size / data.nodes.length) * 100);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden transition-colors duration-700"
      style={{
        minHeight: '60vh',
        backgroundColor: mood.bg,
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Main content area — stack on mobile, side-by-side on desktop */}
      <div className="relative flex flex-col sm:flex-row min-h-[60vh]">
        {/* Compact top bar on mobile: template + stats in one row */}
        <div className="flex items-center justify-between px-3 py-2 border-b sm:hidden" style={{ borderColor: mood.accent + '20' }}>
          <span className="font-pixel text-[7px] px-2 py-0.5 border" style={{ color: mood.accent, borderColor: mood.accent + '50' }}>
            {data.template === 'detective' ? '🔍 侦探' :
             data.template === 'escape_room' ? '🚪 密室' :
             data.template === 'time_paradox' ? '⏰ 时间' :
             data.template === 'identity' ? '🎭 身份' : '📖 故事'}
            {isEnding && ' · 结局'}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[6px]" style={{ color: mood.text }}>进度 {progress}%</span>
            <span className="font-pixel text-[6px]" style={{ color: '#ffd700' }}>★ {score}</span>
            <button
              onClick={() => setShowClues(!showClues)}
              className="font-pixel text-[6px] cursor-pointer"
              style={{ color: mood.accent }}
            >
              线索({collectedClues.length})
            </button>
          </div>
        </div>

        {/* Mobile clues dropdown */}
        {showClues && (
          <div className="px-3 py-2 border-b sm:hidden" style={{ borderColor: mood.accent + '20', backgroundColor: mood.bg }}>
            {collectedClues.length === 0 ? (
              <p className="font-pixel text-[7px]" style={{ color: mood.text }}>暂无线索...</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {collectedClues.map((clue, idx) => (
                  <span key={idx} className="font-pixel text-[6px] px-1.5 py-0.5 border" style={{ borderColor: mood.accent + '30', color: mood.text }}>
                    <span style={{ color: '#ffd700' }}>#{idx + 1}</span> {clue}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scene text area */}
        <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-hidden">
          {/* Template badge — desktop only */}
          <div className="mb-2 sm:mb-3 hidden sm:flex items-center gap-2">
            <span className="font-pixel text-[8px] px-2.5 py-1 border" style={{ color: mood.accent, borderColor: mood.accent + '50' }}>
              {data.template === 'detective' ? '🔍 侦探模式' :
               data.template === 'escape_room' ? '🚪 密室逃脱' :
               data.template === 'time_paradox' ? '⏰ 时间悖论' :
               data.template === 'identity' ? '🎭 身份之谜' : '📖 故事'}
            </span>
            {isEnding && (
              <span className="font-pixel text-[8px] px-2.5 py-1 bg-[#ffd700] text-[#000]">
                结局
              </span>
            )}
          </div>

          {/* Scene description */}
          <div
            className="flex-1 overflow-y-auto mb-3 sm:mb-4 cursor-pointer"
            onClick={() => { if (!textDone) skipText(); }}
            style={{
              opacity: fadeIn ? 0.3 : 1,
              transition: 'opacity 0.5s ease-in',
            }}
          >
            <p className="font-pixel text-[9px] sm:text-[11px] leading-[2] sm:leading-[2.2] whitespace-pre-wrap" style={{ color: mood.text }}>
              {sceneText}
              {!textDone && <span className="animate-pulse ml-0.5" style={{ color: mood.accent }}>|</span>}
            </p>
          </div>

          {/* Choices */}
          {textDone && !isEnding && (
            <div className="space-y-1.5 sm:space-y-2">
              {availableChoices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(choice)}
                  className="w-full text-left p-2 sm:p-2.5 border transition-all duration-200 cursor-pointer group"
                  style={{
                    borderColor: mood.accent + '30',
                    backgroundColor: mood.bg,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = mood.accent;
                    e.currentTarget.style.backgroundColor = mood.accent + '15';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = mood.accent + '30';
                    e.currentTarget.style.backgroundColor = mood.bg;
                  }}
                >
                  <span className="font-pixel text-[8px] sm:text-[9px] mr-1.5 sm:mr-2" style={{ color: mood.accent }}>
                    [{idx + 1}]
                  </span>
                  <span className="font-pixel text-[8px] sm:text-[10px]" style={{ color: mood.text }}>
                    {choice.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Ending message */}
          {isEnding && textDone && (
            <div className="text-center py-3 sm:py-4">
              <p className="font-pixel text-[10px] sm:text-[12px] text-[#ffd700] mb-2">
                CASE CLOSED
              </p>
              <p className="font-pixel text-[7px] sm:text-[8px]" style={{ color: mood.text }}>
                分数: {score} | 线索: {collectedClues.length}
              </p>
            </div>
          )}
        </div>

        {/* Side panel — desktop only */}
        <div className="hidden sm:flex w-[30%] border-l p-4 flex-col gap-3 overflow-y-auto" style={{ borderColor: mood.accent + '20' }}>
          {/* Progress */}
          <div>
            <p className="font-pixel text-[8px] mb-1" style={{ color: mood.accent }}>进度</p>
            <div className="w-full h-2 bg-[#ffffff15] overflow-hidden">
              <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: mood.accent }} />
            </div>
            <p className="font-pixel text-[7px] mt-0.5" style={{ color: mood.text }}>{progress}%</p>
          </div>

          {/* Trust meter */}
          <div>
            <p className="font-pixel text-[8px] mb-1" style={{ color: mood.accent }}>信任度</p>
            <div className="w-full h-2 bg-[#ffffff15] overflow-hidden">
              <div className="h-full transition-all duration-500" style={{
                width: `${trustLevel}%`,
                backgroundColor: trustLevel > 60 ? '#4aaa6a' : trustLevel > 30 ? '#aaaa4a' : '#aa4a4a',
              }} />
            </div>
            <p className="font-pixel text-[7px] mt-0.5" style={{ color: mood.text }}>{trustLevel}%</p>
          </div>

          {/* Score */}
          <div>
            <p className="font-pixel text-[8px] mb-1" style={{ color: mood.accent }}>分数</p>
            <p className="font-pixel text-[12px]" style={{ color: '#ffd700' }}>{score}</p>
          </div>

          {/* Clues panel */}
          <div className="flex-1">
            <button
              onClick={() => setShowClues(!showClues)}
              className="font-pixel text-[8px] mb-1 cursor-pointer hover:opacity-80"
              style={{ color: mood.accent }}
            >
              线索 ({collectedClues.length}) {showClues ? '[-]' : '[+]'}
            </button>
            {showClues && (
              <div className="space-y-1.5">
                {collectedClues.length === 0 ? (
                  <p className="font-pixel text-[7px]" style={{ color: mood.text }}>暂无线索...</p>
                ) : (
                  collectedClues.map((clue, idx) => (
                    <div key={idx} className="p-2 border" style={{ borderColor: mood.accent + '30' }}>
                      <p className="font-pixel text-[7px]" style={{ color: mood.text }}>
                        <span style={{ color: '#ffd700' }}>#{idx + 1}</span> {clue}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

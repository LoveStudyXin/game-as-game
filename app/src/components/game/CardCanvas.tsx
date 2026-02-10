'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameCanvasProps } from './GameCanvas';
import type { CardDef, CardGameData } from '@/engine/types';

// ---------------------------------------------------------------------------
// CardCanvas: React card game renderer with turn-based strategy
// ---------------------------------------------------------------------------

const RARITY_COLORS: Record<string, string> = {
  common: '#8a8a9a',
  uncommon: '#4aaa6a',
  rare: '#4a6aee',
  legendary: '#ffa500',
};

// Simple AI opponent logic
function aiSelectCard(hand: CardDef[], mana: number): CardDef | null {
  const affordable = hand.filter(c => c.cost <= mana);
  if (affordable.length === 0) return null;
  affordable.sort((a, b) => b.cost - a.cost);
  return affordable[0];
}

function CardComponent({
  card,
  playable,
  onClick,
  faceDown = false,
  small = false,
}: {
  card: CardDef;
  playable?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
}) {
  const rarityColor = RARITY_COLORS[card.rarity] || '#8a8a9a';

  if (faceDown) {
    return (
      <div className={`${small ? 'w-[40px] h-[56px] sm:w-[52px] sm:h-[72px]' : 'w-[52px] h-[72px] sm:w-[72px] sm:h-[100px]'} border-2 border-[#3a3a5a] bg-[#1a1a3a] flex items-center justify-center shrink-0`}>
        <div className="w-[60%] h-[60%] border border-[#3a3a5a] flex items-center justify-center">
          <span className="text-[10px] sm:text-[14px]">🂠</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={playable ? onClick : undefined}
      className={`${small ? 'w-[40px] h-[56px] sm:w-[52px] sm:h-[72px]' : 'w-[60px] h-[84px] sm:w-[72px] sm:h-[100px]'} border-2 flex flex-col p-1 sm:p-1.5 transition-all duration-200 select-none shrink-0 ${
        playable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-lg' : ''
      } ${!playable ? 'opacity-60' : ''}`}
      style={{
        borderColor: rarityColor,
        backgroundColor: '#12121e',
        boxShadow: playable ? `0 0 8px ${rarityColor}30` : 'none',
      }}
    >
      {/* Cost badge */}
      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
        <span className="font-pixel text-[6px] sm:text-[7px] w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center bg-[#2a2a4a] text-[#4488ff]">
          {card.cost}
        </span>
        <span className="font-pixel text-[4px] sm:text-[5px]" style={{ color: rarityColor }}>
          {card.rarity[0].toUpperCase()}
        </span>
      </div>

      {/* Card icon / color */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 sm:w-6 sm:h-6" style={{ backgroundColor: card.color, opacity: 0.8 }} />
      </div>

      {/* Name */}
      <p className="font-pixel text-[4px] sm:text-[5px] text-center text-[#e0e0f0] truncate mt-0.5 sm:mt-1">
        {card.name}
      </p>

      {/* Effect */}
      {!small && (
        <p className="font-pixel text-[3px] sm:text-[4px] text-center text-[#aaaacc] mt-0.5 truncate">
          {card.description}
        </p>
      )}
    </div>
  );
}

export default function CardCanvas({
  config,
  onScoreChange,
  onNarrativeEvent,
  onGameOver,
}: GameCanvasProps) {
  const data = config.genreData?.card;

  // Game state
  const [playerHp, setPlayerHp] = useState(data?.playerHp || 30);
  const [enemyHp, setEnemyHp] = useState(data?.enemyHp || 30);
  const [playerMana, setPlayerMana] = useState(data?.startingMana || 3);
  const [maxMana, setMaxMana] = useState(data?.startingMana || 3);
  const [playerHand, setPlayerHand] = useState<CardDef[]>([]);
  const [playerDeck, setPlayerDeck] = useState<CardDef[]>([]);
  const [enemyHand, setEnemyHand] = useState<CardDef[]>([]);
  const [enemyDeck, setEnemyDeck] = useState<CardDef[]>([]);
  const [playerField, setPlayerField] = useState<CardDef[]>([]);
  const [enemyField, setEnemyField] = useState<CardDef[]>([]);
  const [turn, setTurn] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [animating, setAnimating] = useState(false);
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs for values needed in endTurn to avoid stale closures
  const playerDeckRef = useRef(playerDeck);
  const playerHandRef = useRef(playerHand);
  const enemyDeckRef = useRef(enemyDeck);
  const enemyHandRef = useRef(enemyHand);
  const enemyFieldRef = useRef(enemyField);
  const maxManaRef = useRef(maxMana);

  useEffect(() => { playerDeckRef.current = playerDeck; }, [playerDeck]);
  useEffect(() => { playerHandRef.current = playerHand; }, [playerHand]);
  useEffect(() => { enemyDeckRef.current = enemyDeck; }, [enemyDeck]);
  useEffect(() => { enemyHandRef.current = enemyHand; }, [enemyHand]);
  useEffect(() => { enemyFieldRef.current = enemyField; }, [enemyField]);
  useEffect(() => { maxManaRef.current = maxMana; }, [maxMana]);

  // Shuffle helper
  const shuffle = useCallback((arr: CardDef[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  // Draw cards (pure function)
  const drawCards = useCallback((deck: CardDef[], hand: CardDef[], count: number): { newDeck: CardDef[]; newHand: CardDef[] } => {
    const newDeck = [...deck];
    const newHand = [...hand];
    const toDraw = Math.min(count, newDeck.length);
    for (let i = 0; i < toDraw; i++) {
      newHand.push(newDeck.pop()!);
    }
    return { newDeck, newHand };
  }, []);

  // Initialize game
  useEffect(() => {
    if (!data) return;
    const shuffledPlayerDeck = shuffle(data.playerDeck);
    const shuffledEnemyDeck = shuffle(data.enemyDeck);

    const handSize = data.handSize || 4;
    const pDraw = drawCards(shuffledPlayerDeck, [], handSize);
    const eDraw = drawCards(shuffledEnemyDeck, [], handSize);

    setPlayerDeck(pDraw.newDeck);
    setPlayerHand(pDraw.newHand);
    setEnemyDeck(eDraw.newDeck);
    setEnemyHand(eDraw.newHand);
    setPlayerHp(data.playerHp);
    setEnemyHp(data.enemyHp);
    setPlayerMana(data.startingMana);
    setMaxMana(data.startingMana);
    setTurn(1);
    setIsPlayerTurn(true);
    setScore(0);
    setGameEnded(false);
    setPlayerField([]);
    setEnemyField([]);
    setLastAction('');
  }, [data, shuffle, drawCards]);

  // Play a card (player)
  const playCard = useCallback((cardIndex: number) => {
    if (!isPlayerTurn || animating || gameEnded) return;
    const card = playerHand[cardIndex];
    if (!card || card.cost > playerMana) return;

    setAnimating(true);
    setPlayerMana(prev => prev - card.cost);
    setPlayerHand(prev => prev.filter((_, i) => i !== cardIndex));
    setPlayerField(prev => [...prev, card]);

    // Apply effect
    switch (card.effect) {
      case 'damage':
        setEnemyHp(prev => Math.max(0, prev - card.value));
        setLastAction(`${card.name} 造成 ${card.value} 伤害！`);
        break;
      case 'heal':
        setPlayerHp(prev => Math.min(data?.playerHp || 30, prev + card.value));
        setLastAction(`${card.name} 回复 ${card.value} HP！`);
        break;
      case 'draw': {
        const { newDeck, newHand } = drawCards(playerDeckRef.current, [...playerHandRef.current.filter((_, i) => i !== cardIndex)], card.value);
        setPlayerDeck(newDeck);
        setPlayerHand(newHand);
        setLastAction(`${card.name}: 抽 ${card.value} 张牌！`);
        break;
      }
      case 'gain_mana':
        setPlayerMana(prev => Math.min((data?.maxMana || 10), prev + card.value));
        setLastAction(`${card.name}: +${card.value} 法力！`);
        break;
      case 'buff':
        setLastAction(`${card.name}: 增强！下次攻击 +${card.value}`);
        break;
      case 'debuff':
        setLastAction(`${card.name}: 削弱敌人！`);
        break;
      default:
        setEnemyHp(prev => Math.max(0, prev - card.value));
        setLastAction(`${card.name}: ${card.value} 伤害！`);
    }

    const newScore = score + card.value * 10;
    setScore(newScore);
    onScoreChange?.(newScore);

    setTimeout(() => setAnimating(false), 300);
  }, [isPlayerTurn, animating, gameEnded, playerHand, playerMana, score, data, drawCards, onScoreChange]);

  // End player turn → AI turn
  const endTurn = useCallback(() => {
    if (!isPlayerTurn || gameEnded) return;
    setIsPlayerTurn(false);
    setLastAction('对手回合...');

    // AI turn after a brief delay
    turnTimerRef.current = setTimeout(() => {
      let currentMana = Math.min((data?.maxMana || 10), maxManaRef.current + 1);
      const hand = [...enemyHandRef.current];
      const field = [...enemyFieldRef.current];
      const actions: string[] = [];

      // AI plays cards in sequence
      let card = aiSelectCard(hand, currentMana);
      while (card) {
        currentMana -= card.cost;
        const idx = hand.indexOf(card);
        hand.splice(idx, 1);
        field.push(card);

        // Apply AI card effects
        switch (card.effect) {
          case 'damage':
            setPlayerHp(prev => Math.max(0, prev - card!.value));
            actions.push(`${card.name} 造成 ${card.value} 伤害`);
            break;
          case 'heal':
            setEnemyHp(prev => Math.min(data?.enemyHp || 30, prev + card!.value));
            actions.push(`${card.name} 回复 ${card.value} HP`);
            break;
          case 'buff':
            actions.push(`${card.name} 增强`);
            break;
          default:
            setPlayerHp(prev => Math.max(0, prev - card!.value));
            actions.push(`${card.name} 造成 ${card.value} 伤害`);
        }

        card = aiSelectCard(hand, currentMana);
      }

      setEnemyHand(hand);
      setEnemyField(field);

      if (actions.length > 0) {
        setLastAction(`对手: ${actions.join('、')}`);
      } else {
        setLastAction('对手没有可出的牌');
      }

      // Enemy draws
      const { newDeck: eDeck, newHand: eHand } = drawCards(enemyDeckRef.current, hand, 1);
      setEnemyDeck(eDeck);
      setEnemyHand(eHand);

      // Next turn: player's turn
      setTimeout(() => {
        const newMaxMana = Math.min((data?.maxMana || 10), maxManaRef.current + 1);
        setMaxMana(newMaxMana);
        setPlayerMana(newMaxMana);
        setTurn(prev => prev + 1);
        setIsPlayerTurn(true);

        // Player draws
        const pDraw = drawCards(playerDeckRef.current, playerHandRef.current, 1);
        setPlayerDeck(pDraw.newDeck);
        setPlayerHand(pDraw.newHand);

        setLastAction('你的回合 — 抽了一张牌');
      }, 1200);
    }, 800);
  }, [isPlayerTurn, gameEnded, data, drawCards]);

  // Check win/loss
  useEffect(() => {
    if (gameEnded) return;
    if (enemyHp <= 0) {
      setGameEnded(true);
      const finalScore = score + 1000;
      setScore(finalScore);
      onScoreChange?.(finalScore);
      onNarrativeEvent?.('胜利！');
      setTimeout(() => onGameOver?.(finalScore), 2000);
    } else if (playerHp <= 0) {
      setGameEnded(true);
      onNarrativeEvent?.('战败...');
      setTimeout(() => onGameOver?.(score), 2000);
    }
  }, [playerHp, enemyHp, gameEnded, score, onScoreChange, onNarrativeEvent, onGameOver]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
    };
  }, []);

  if (!data) {
    return (
      <div className="relative w-full min-h-[400px] sm:min-h-[450px] bg-[#0a0a1a] flex items-center justify-center">
        <p className="font-pixel text-[10px] text-[#666]">No card game data.</p>
      </div>
    );
  }

  const maxPlayerHp = data.playerHp;
  const maxEnemyHp = data.enemyHp;

  return (
    <div className="relative w-full min-h-[420px] sm:min-h-[450px] bg-[#0e0e1a] overflow-hidden flex flex-col">
      {/* Background table texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(45deg, #1a1a3a 25%, transparent 25%, transparent 75%, #1a1a3a 75%)',
        backgroundSize: '8px 8px',
      }} />

      {/* Top: Enemy area */}
      <div className="relative flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
        {/* Enemy info */}
        <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0">
          <span className="font-pixel text-[6px] sm:text-[7px] text-[#ff6666]">{data.enemyName}</span>
          <div className="w-20 sm:w-24 h-1.5 bg-[#2a2a3a]">
            <div className="h-full bg-[#ff4444] transition-all duration-300" style={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }} />
          </div>
          <span className="font-pixel text-[5px] sm:text-[6px] text-[#aa6666]">{enemyHp}/{maxEnemyHp} HP</span>
        </div>

        {/* Enemy hand (face down) */}
        <div className="flex gap-0.5 sm:gap-1 overflow-hidden">
          {enemyHand.map((card, i) => (
            <CardComponent key={`eh-${i}`} card={card} faceDown small />
          ))}
        </div>

        {/* Enemy deck count */}
        <span className="font-pixel text-[5px] sm:text-[6px] text-[#666] shrink-0">牌组: {enemyDeck.length}</span>
      </div>

      {/* Middle: Battlefield */}
      <div className="relative flex-1 flex flex-col items-center justify-center border-y border-[#2a2a4a] py-2 sm:py-3 min-h-[100px]">
        {/* Enemy field */}
        <div className="flex gap-1 sm:gap-1.5 mb-1 sm:mb-2">
          {enemyField.slice(-5).map((card, i) => (
            <CardComponent key={`ef-${i}`} card={card} small />
          ))}
        </div>

        {/* Turn / action indicator */}
        <div className="px-2 sm:px-3 py-1 bg-[#1a1a2e] border border-[#3a3a5a] mb-1 sm:mb-2 max-w-[90%]">
          <span className="font-pixel text-[5px] sm:text-[6px] text-[#8888cc] block text-center truncate">
            回合 {turn} | {isPlayerTurn ? '你的回合' : '对手回合'} | {lastAction}
          </span>
        </div>

        {/* Player field */}
        <div className="flex gap-1 sm:gap-1.5">
          {playerField.slice(-5).map((card, i) => (
            <CardComponent key={`pf-${i}`} card={card} small />
          ))}
        </div>
      </div>

      {/* Bottom: Player area */}
      <div className="relative flex flex-col">
        {/* Player info bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 flex-wrap gap-y-1">
          <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0">
            <span className="font-pixel text-[6px] sm:text-[7px] text-[#44aaff]">你</span>
            <div className="w-20 sm:w-24 h-1.5 bg-[#2a2a3a]">
              <div className="h-full bg-[#44ff44] transition-all duration-300" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} />
            </div>
            <span className="font-pixel text-[5px] sm:text-[6px] text-[#66aa66]">{playerHp}/{maxPlayerHp} HP</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Mana */}
            <div className="flex items-center gap-1">
              <span className="font-pixel text-[6px] sm:text-[7px] text-[#4488ff]">{playerMana}/{maxMana}</span>
              <span className="font-pixel text-[5px] sm:text-[6px] text-[#4466aa]">法力</span>
            </div>

            {/* Score */}
            <div>
              <span className="font-pixel text-[6px] sm:text-[7px] text-[#ffd700]">{score}</span>
              <span className="font-pixel text-[5px] sm:text-[6px] text-[#aa8800] ml-1">分</span>
            </div>

            {/* End turn button */}
            <button
              onClick={endTurn}
              disabled={!isPlayerTurn || gameEnded}
              className={`font-pixel text-[6px] sm:text-[7px] px-2 sm:px-3 py-1 sm:py-1.5 border transition-colors ${
                isPlayerTurn && !gameEnded
                  ? 'border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-[#000] cursor-pointer'
                  : 'border-[#3a3a5a] text-[#3a3a5a]'
              }`}
            >
              结束回合
            </button>
          </div>

          <span className="font-pixel text-[5px] sm:text-[6px] text-[#666] shrink-0">牌组: {playerDeck.length}</span>
        </div>

        {/* Player hand */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 pb-2 sm:pb-3 flex-wrap">
          {playerHand.map((card, i) => (
            <CardComponent
              key={`ph-${i}`}
              card={card}
              playable={isPlayerTurn && card.cost <= playerMana && !gameEnded && !animating}
              onClick={() => playCard(i)}
            />
          ))}
        </div>
      </div>

      {/* Game over overlay */}
      {gameEnded && (
        <div className="absolute inset-0 bg-[#000000cc] flex flex-col items-center justify-center z-20">
          <p className="font-pixel text-[14px] sm:text-[16px] mb-3" style={{ color: enemyHp <= 0 ? '#ffd700' : '#ff4444' }}>
            {enemyHp <= 0 ? '胜利！' : '战败'}
          </p>
          <p className="font-pixel text-[8px] sm:text-[9px] text-[#aaaacc]">得分: {score}</p>
        </div>
      )}
    </div>
  );
}

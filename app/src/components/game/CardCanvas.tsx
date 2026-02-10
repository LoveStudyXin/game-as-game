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
  // Greedy: play the most expensive card that's affordable
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
  const w = small ? 'w-[52px]' : 'w-[72px]';
  const h = small ? 'h-[72px]' : 'h-[100px]';

  if (faceDown) {
    return (
      <div className={`${w} ${h} border-2 border-[#3a3a5a] bg-[#1a1a3a] flex items-center justify-center`}>
        <div className="w-[60%] h-[60%] border border-[#3a3a5a] flex items-center justify-center">
          <span className="text-[14px]">🂠</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={playable ? onClick : undefined}
      className={`${w} ${h} border-2 flex flex-col p-1.5 transition-all duration-200 select-none ${
        playable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-lg' : ''
      } ${!playable ? 'opacity-60' : ''}`}
      style={{
        borderColor: rarityColor,
        backgroundColor: '#12121e',
        boxShadow: playable ? `0 0 8px ${rarityColor}30` : 'none',
      }}
    >
      {/* Cost badge */}
      <div className="flex justify-between items-start mb-1">
        <span className="font-pixel text-[7px] w-4 h-4 flex items-center justify-center bg-[#2a2a4a] text-[#4488ff]">
          {card.cost}
        </span>
        <span className="font-pixel text-[5px]" style={{ color: rarityColor }}>
          {card.rarity[0].toUpperCase()}
        </span>
      </div>

      {/* Card icon / color */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6" style={{ backgroundColor: card.color, opacity: 0.8 }} />
      </div>

      {/* Name */}
      <p className="font-pixel text-[5px] text-center text-[#e0e0f0] truncate mt-1">
        {card.name}
      </p>

      {/* Effect */}
      {!small && (
        <p className="font-pixel text-[4px] text-center text-[#aaaacc] mt-0.5 truncate">
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

  // Shuffle helper
  const shuffle = useCallback((arr: CardDef[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  // Draw cards
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

    // Draw initial hands
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
  }, [data, shuffle, drawCards]);

  // Apply card effect
  const applyCardEffect = useCallback((card: CardDef, isPlayer: boolean) => {
    switch (card.effect) {
      case 'damage':
        if (isPlayer) {
          setEnemyHp(prev => Math.max(0, prev - card.value));
          setLastAction(`${card.name} deals ${card.value} damage!`);
        } else {
          setPlayerHp(prev => Math.max(0, prev - card.value));
          setLastAction(`Enemy's ${card.name} deals ${card.value} damage!`);
        }
        break;
      case 'heal':
        if (isPlayer) {
          setPlayerHp(prev => Math.min(data?.playerHp || 30, prev + card.value));
          setLastAction(`${card.name} heals ${card.value} HP!`);
        } else {
          setEnemyHp(prev => Math.min(data?.enemyHp || 30, prev + card.value));
          setLastAction(`Enemy heals ${card.value} HP!`);
        }
        break;
      case 'draw': {
        if (isPlayer) {
          const { newDeck, newHand } = drawCards(playerDeck, playerHand, card.value);
          setPlayerDeck(newDeck);
          setPlayerHand(newHand);
          setLastAction(`${card.name}: Draw ${card.value} cards!`);
        }
        break;
      }
      case 'gain_mana':
        if (isPlayer) {
          setPlayerMana(prev => Math.min((data?.maxMana || 10), prev + card.value));
          setLastAction(`${card.name}: +${card.value} mana!`);
        }
        break;
      case 'buff':
        setLastAction(`${card.name}: Buffed! +${card.value} to next attack`);
        break;
      case 'debuff':
        setLastAction(`${card.name}: Enemy weakened!`);
        break;
      default:
        if (isPlayer) {
          setEnemyHp(prev => Math.max(0, prev - card.value));
          setLastAction(`${card.name}: ${card.value} damage!`);
        } else {
          setPlayerHp(prev => Math.max(0, prev - card.value));
          setLastAction(`Enemy plays ${card.name}!`);
        }
    }
  }, [data, playerDeck, playerHand, drawCards]);

  // Play a card
  const playCard = useCallback((cardIndex: number) => {
    if (!isPlayerTurn || animating || gameEnded) return;
    const card = playerHand[cardIndex];
    if (!card || card.cost > playerMana) return;

    setAnimating(true);
    setPlayerMana(prev => prev - card.cost);
    setPlayerHand(prev => prev.filter((_, i) => i !== cardIndex));
    setPlayerField(prev => [...prev, card]);

    applyCardEffect(card, true);
    const newScore = score + card.value * 10;
    setScore(newScore);
    onScoreChange?.(newScore);

    setTimeout(() => setAnimating(false), 300);
  }, [isPlayerTurn, animating, gameEnded, playerHand, playerMana, score, applyCardEffect, onScoreChange]);

  // End player turn
  const endTurn = useCallback(() => {
    if (!isPlayerTurn || gameEnded) return;
    setIsPlayerTurn(false);

    // Enemy turn
    turnTimerRef.current = setTimeout(() => {
      // Enemy plays cards
      let currentMana = Math.min((data?.maxMana || 10), maxMana + 1);
      const hand = [...enemyHand];
      const field = [...enemyField];

      let card = aiSelectCard(hand, currentMana);
      while (card) {
        currentMana -= card.cost;
        const idx = hand.indexOf(card);
        hand.splice(idx, 1);
        field.push(card);
        applyCardEffect(card, false);
        card = aiSelectCard(hand, currentMana);
      }

      setEnemyHand(hand);
      setEnemyField(field);

      // Enemy draws
      const { newDeck, newHand } = drawCards(enemyDeck, hand, 1);
      setEnemyDeck(newDeck);
      setEnemyHand(newHand);

      // Next turn
      setTimeout(() => {
        const newMaxMana = Math.min((data?.maxMana || 10), maxMana + 1);
        setMaxMana(newMaxMana);
        setPlayerMana(newMaxMana);
        setTurn(prev => prev + 1);
        setIsPlayerTurn(true);

        // Player draws
        const pDraw = drawCards(playerDeck, playerHand, 1);
        setPlayerDeck(pDraw.newDeck);
        setPlayerHand(pDraw.newHand);
      }, 800);
    }, 600);
  }, [isPlayerTurn, gameEnded, data, maxMana, enemyHand, enemyField, enemyDeck, playerDeck, playerHand, applyCardEffect, drawCards]);

  // Check win/loss
  useEffect(() => {
    if (gameEnded) return;
    if (enemyHp <= 0) {
      setGameEnded(true);
      const finalScore = score + 1000;
      setScore(finalScore);
      onScoreChange?.(finalScore);
      onNarrativeEvent?.('Victory!');
      setTimeout(() => onGameOver?.(finalScore), 2000);
    } else if (playerHp <= 0) {
      setGameEnded(true);
      onNarrativeEvent?.('Defeated...');
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
      <div className="relative w-full bg-[#0a0a1a] flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <p className="font-pixel text-[10px] text-[#666]">No card game data available.</p>
      </div>
    );
  }

  const maxPlayerHp = data.playerHp;
  const maxEnemyHp = data.enemyHp;

  return (
    <div className="relative w-full bg-[#0e0e1a] overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
      {/* Background table texture */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(45deg, #1a1a3a 25%, transparent 25%, transparent 75%, #1a1a3a 75%)',
        backgroundSize: '8px 8px',
      }} />

      {/* Top: Enemy area */}
      <div className="absolute top-0 left-0 right-0 h-[25%] flex items-center justify-between px-6">
        {/* Enemy info */}
        <div className="flex flex-col gap-1">
          <span className="font-pixel text-[7px] text-[#ff6666]">{data.enemyName}</span>
          <div className="w-24 h-1.5 bg-[#2a2a3a]">
            <div className="h-full bg-[#ff4444] transition-all duration-300" style={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }} />
          </div>
          <span className="font-pixel text-[6px] text-[#aa6666]">{enemyHp}/{maxEnemyHp} HP</span>
        </div>

        {/* Enemy hand (face down) */}
        <div className="flex gap-1">
          {enemyHand.map((card, i) => (
            <CardComponent key={`eh-${i}`} card={card} faceDown small />
          ))}
        </div>

        {/* Enemy deck count */}
        <span className="font-pixel text-[6px] text-[#666]">Deck: {enemyDeck.length}</span>
      </div>

      {/* Middle: Battlefield */}
      <div className="absolute top-[25%] left-0 right-0 h-[30%] flex flex-col items-center justify-center border-y border-[#2a2a4a]">
        {/* Enemy field */}
        <div className="flex gap-1.5 mb-2">
          {enemyField.slice(-5).map((card, i) => (
            <CardComponent key={`ef-${i}`} card={card} small />
          ))}
        </div>

        {/* Turn / action indicator */}
        <div className="px-3 py-1 bg-[#1a1a2e] border border-[#3a3a5a] mb-2">
          <span className="font-pixel text-[6px] text-[#8888cc]">
            Turn {turn} | {isPlayerTurn ? 'Your Turn' : 'Enemy Turn'} | {lastAction}
          </span>
        </div>

        {/* Player field */}
        <div className="flex gap-1.5">
          {playerField.slice(-5).map((card, i) => (
            <CardComponent key={`pf-${i}`} card={card} small />
          ))}
        </div>
      </div>

      {/* Bottom: Player area */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] flex flex-col">
        {/* Player info bar */}
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex flex-col gap-1">
            <span className="font-pixel text-[7px] text-[#44aaff]">You</span>
            <div className="w-24 h-1.5 bg-[#2a2a3a]">
              <div className="h-full bg-[#44ff44] transition-all duration-300" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} />
            </div>
            <span className="font-pixel text-[6px] text-[#66aa66]">{playerHp}/{maxPlayerHp} HP</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mana */}
            <div className="flex items-center gap-1">
              <span className="font-pixel text-[7px] text-[#4488ff]">{playerMana}/{maxMana}</span>
              <span className="font-pixel text-[6px] text-[#4466aa]">MANA</span>
            </div>

            {/* Score */}
            <div>
              <span className="font-pixel text-[7px] text-[#ffd700]">{score}</span>
              <span className="font-pixel text-[6px] text-[#aa8800] ml-1">PTS</span>
            </div>

            {/* End turn button */}
            <button
              onClick={endTurn}
              disabled={!isPlayerTurn || gameEnded}
              className={`font-pixel text-[7px] px-3 py-1.5 border transition-colors ${
                isPlayerTurn && !gameEnded
                  ? 'border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-[#000] cursor-pointer'
                  : 'border-[#3a3a5a] text-[#3a3a5a]'
              }`}
            >
              END TURN
            </button>
          </div>

          <span className="font-pixel text-[6px] text-[#666]">Deck: {playerDeck.length}</span>
        </div>

        {/* Player hand */}
        <div className="flex-1 flex items-center justify-center gap-2 px-4 pb-3">
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
          <p className="font-pixel text-[16px] mb-3" style={{ color: enemyHp <= 0 ? '#ffd700' : '#ff4444' }}>
            {enemyHp <= 0 ? 'VICTORY!' : 'DEFEAT'}
          </p>
          <p className="font-pixel text-[9px] text-[#aaaacc]">Score: {score}</p>
        </div>
      )}
    </div>
  );
}

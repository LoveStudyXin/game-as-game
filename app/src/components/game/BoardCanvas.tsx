'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameCanvasProps } from './GameCanvas';
import type { BoardGameData, BoardPlacement, TerrainType } from '@/engine/types';

// ---------------------------------------------------------------------------
// BoardCanvas: React grid-based tactics / board game renderer
// ---------------------------------------------------------------------------

const TERRAIN_COLORS: Record<TerrainType, { bg: string; label: string }> = {
  plain:    { bg: '#2a2a3a', label: '' },
  mountain: { bg: '#5a5a6a', label: '🏔' },
  water:    { bg: '#2a3a5a', label: '~' },
  forest:   { bg: '#2a4a3a', label: '🌲' },
  lava:     { bg: '#5a2a1a', label: '🔥' },
};

const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  plain: 1, mountain: 3, water: 2, forest: 2, lava: 99,
};

interface PieceState extends BoardPlacement {
  currentHp: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

// Simple AI: find best move for each enemy piece
function aiTurn(
  pieces: PieceState[],
  terrain: TerrainType[][],
  boardW: number,
  boardH: number,
): { pieceId: string; action: 'move' | 'attack'; tx: number; ty: number }[] {
  const actions: { pieceId: string; action: 'move' | 'attack'; tx: number; ty: number }[] = [];
  const enemyPieces = pieces.filter(p => p.owner === 'enemy' && p.currentHp > 0);
  const playerPieces = pieces.filter(p => p.owner === 'player' && p.currentHp > 0);

  for (const ep of enemyPieces) {
    // Find closest player piece
    let closestDist = Infinity;
    let closestTarget: PieceState | null = null;
    for (const pp of playerPieces) {
      const dist = Math.abs(pp.x - ep.x) + Math.abs(pp.y - ep.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = pp;
      }
    }

    if (!closestTarget) continue;

    // Can attack directly?
    if (closestDist <= ep.piece.attackRange) {
      actions.push({ pieceId: ep.piece.id, action: 'attack', tx: closestTarget.x, ty: closestTarget.y });
      continue;
    }

    // Move toward target
    const dx = Math.sign(closestTarget.x - ep.x);
    const dy = Math.sign(closestTarget.y - ep.y);
    let nx = ep.x + dx;
    let ny = ep.y + dy;

    // Clamp to board
    nx = Math.max(0, Math.min(boardW - 1, nx));
    ny = Math.max(0, Math.min(boardH - 1, ny));

    // Check not occupied
    const occupied = pieces.some(p => p.x === nx && p.y === ny && p.currentHp > 0);
    if (!occupied && TERRAIN_MOVE_COST[terrain[ny]?.[nx] || 'plain'] < 99) {
      actions.push({ pieceId: ep.piece.id, action: 'move', tx: nx, ty: ny });
    }
  }

  return actions;
}

export default function BoardCanvas({
  config,
  onScoreChange,
  onNarrativeEvent,
  onGameOver,
}: GameCanvasProps) {
  const data = config.genreData?.board;
  const boardW = data?.width || 8;
  const boardH = data?.height || 8;

  // Game state
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [turn, setTurn] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [actionMode, setActionMode] = useState<'move' | 'attack' | null>(null);
  const [lastAction, setLastAction] = useState('');

  // Initialize
  useEffect(() => {
    if (!data) return;
    const initialPieces: PieceState[] = data.pieces.map(p => ({
      ...p,
      currentHp: p.piece.hp,
      hasMoved: false,
      hasAttacked: false,
    }));
    setPieces(initialPieces);
    setTurn(1);
    setIsPlayerTurn(true);
    setSelectedPiece(null);
    setScore(0);
    setGameEnded(false);
    setActionMode(null);
    setLastAction('');
  }, [data]);

  // Get terrain at position
  const getTerrain = useCallback((x: number, y: number): TerrainType => {
    if (!data) return 'plain';
    return data.terrain[y]?.[x] || 'plain';
  }, [data]);

  // Get reachable cells for a piece
  const getReachableCells = useMemo(() => {
    if (!selectedPiece || actionMode !== 'move') return new Set<string>();
    const piece = pieces.find(p => p.piece.id === selectedPiece);
    if (!piece || piece.hasMoved) return new Set<string>();

    const reachable = new Set<string>();
    const range = piece.piece.moveRange;

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > range) continue;
        const nx = piece.x + dx;
        const ny = piece.y + dy;
        if (nx < 0 || ny < 0 || nx >= boardW || ny >= boardH) continue;
        if (nx === piece.x && ny === piece.y) continue;

        const terrain = getTerrain(nx, ny);
        if (TERRAIN_MOVE_COST[terrain] >= 99) continue;
        const occupied = pieces.some(p => p.x === nx && p.y === ny && p.currentHp > 0);
        if (!occupied) {
          reachable.add(`${nx},${ny}`);
        }
      }
    }
    return reachable;
  }, [selectedPiece, actionMode, pieces, boardW, boardH, getTerrain]);

  // Get attackable cells
  const getAttackableCells = useMemo(() => {
    if (!selectedPiece || actionMode !== 'attack') return new Set<string>();
    const piece = pieces.find(p => p.piece.id === selectedPiece);
    if (!piece || piece.hasAttacked) return new Set<string>();

    const attackable = new Set<string>();
    const range = piece.piece.attackRange;

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (Math.abs(dx) + Math.abs(dy) > range) continue;
        const nx = piece.x + dx;
        const ny = piece.y + dy;
        if (nx < 0 || ny < 0 || nx >= boardW || ny >= boardH) continue;

        const target = pieces.find(p => p.x === nx && p.y === ny && p.owner === 'enemy' && p.currentHp > 0);
        if (target) {
          attackable.add(`${nx},${ny}`);
        }
      }
    }
    return attackable;
  }, [selectedPiece, actionMode, pieces, boardW, boardH]);

  // Handle cell click
  const handleCellClick = useCallback((cx: number, cy: number) => {
    if (!isPlayerTurn || gameEnded) return;

    const clickedPiece = pieces.find(p => p.x === cx && p.y === cy && p.currentHp > 0);

    if (!selectedPiece) {
      // Select a player piece
      if (clickedPiece && clickedPiece.owner === 'player') {
        setSelectedPiece(clickedPiece.piece.id);
        setActionMode('move');
      }
      return;
    }

    // Currently selected
    if (actionMode === 'move' && getReachableCells.has(`${cx},${cy}`)) {
      // Move piece
      setPieces(prev => prev.map(p =>
        p.piece.id === selectedPiece ? { ...p, x: cx, y: cy, hasMoved: true } : p
      ));
      setLastAction(`Moved to (${cx}, ${cy})`);
      setActionMode('attack'); // After moving, can attack
      return;
    }

    if (actionMode === 'attack' && getAttackableCells.has(`${cx},${cy}`)) {
      // Attack
      const attacker = pieces.find(p => p.piece.id === selectedPiece)!;
      const target = pieces.find(p => p.x === cx && p.y === cy && p.currentHp > 0)!;
      const damage = attacker.piece.atk;
      const newHp = Math.max(0, target.currentHp - damage);

      setPieces(prev => prev.map(p => {
        if (p.piece.id === selectedPiece) return { ...p, hasAttacked: true };
        if (p.x === cx && p.y === cy && p.currentHp > 0) return { ...p, currentHp: newHp };
        return p;
      }));

      const action = newHp <= 0 ? `${target.piece.name} defeated!` : `Hit ${target.piece.name} for ${damage} damage!`;
      setLastAction(action);
      if (newHp <= 0) {
        const newScore = score + 200;
        setScore(newScore);
        onScoreChange?.(newScore);
      }
      setSelectedPiece(null);
      setActionMode(null);
      return;
    }

    // Click on another player piece to switch selection
    if (clickedPiece && clickedPiece.owner === 'player') {
      setSelectedPiece(clickedPiece.piece.id);
      setActionMode('move');
      return;
    }

    // Deselect
    setSelectedPiece(null);
    setActionMode(null);
  }, [isPlayerTurn, gameEnded, pieces, selectedPiece, actionMode, getReachableCells, getAttackableCells, score, onScoreChange]);

  // End player turn
  const endPlayerTurn = useCallback(() => {
    if (!isPlayerTurn || gameEnded) return;
    setSelectedPiece(null);
    setActionMode(null);
    setIsPlayerTurn(false);

    // AI turn
    setTimeout(() => {
      if (!data) return;
      const actions = aiTurn(pieces, data.terrain, boardW, boardH);

      let updatedPieces = [...pieces];
      for (const action of actions) {
        const pieceIdx = updatedPieces.findIndex(p => p.piece.id === action.pieceId);
        if (pieceIdx === -1) continue;

        if (action.action === 'move') {
          updatedPieces[pieceIdx] = { ...updatedPieces[pieceIdx], x: action.tx, y: action.ty };
          setLastAction(`Enemy ${updatedPieces[pieceIdx].piece.name} moves`);
        } else if (action.action === 'attack') {
          const targetIdx = updatedPieces.findIndex(p => p.x === action.tx && p.y === action.ty && p.owner === 'player' && p.currentHp > 0);
          if (targetIdx !== -1) {
            const damage = updatedPieces[pieceIdx].piece.atk;
            const newHp = Math.max(0, updatedPieces[targetIdx].currentHp - damage);
            updatedPieces[targetIdx] = { ...updatedPieces[targetIdx], currentHp: newHp };
            setLastAction(`Enemy attacks ${updatedPieces[targetIdx].piece.name}!`);
          }
        }
      }

      // Reset movement flags for all pieces
      updatedPieces = updatedPieces.map(p => ({ ...p, hasMoved: false, hasAttacked: false }));
      setPieces(updatedPieces);
      setTurn(prev => prev + 1);
      setIsPlayerTurn(true);
    }, 800);
  }, [isPlayerTurn, gameEnded, pieces, data, boardW, boardH]);

  // Check win/loss
  useEffect(() => {
    if (gameEnded || pieces.length === 0) return;
    const playerAlive = pieces.some(p => p.owner === 'player' && p.currentHp > 0);
    const enemyAlive = pieces.some(p => p.owner === 'enemy' && p.currentHp > 0);

    if (!enemyAlive) {
      setGameEnded(true);
      const finalScore = score + 1000;
      setScore(finalScore);
      onScoreChange?.(finalScore);
      onNarrativeEvent?.('All enemies defeated!');
      setTimeout(() => onGameOver?.(finalScore), 2000);
    } else if (!playerAlive) {
      setGameEnded(true);
      onNarrativeEvent?.('Your forces have fallen...');
      setTimeout(() => onGameOver?.(score), 2000);
    }
  }, [pieces, gameEnded, score, onScoreChange, onNarrativeEvent, onGameOver]);

  if (!data) {
    return (
      <div className="relative w-full bg-[#0a0a1a] flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <p className="font-pixel text-[10px] text-[#666]">No board game data available.</p>
      </div>
    );
  }

  // Calculate cell size based on aspect ratio
  const cellSize = Math.min(
    Math.floor(500 / boardW),
    Math.floor(280 / boardH),
    48
  );

  const selPiece = pieces.find(p => p.piece.id === selectedPiece);

  return (
    <div className="relative w-full bg-[#0e0e1a] overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
      <div className="absolute inset-0 flex">
        {/* Board area (left) */}
        <div className="flex-1 flex items-center justify-center">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${boardW}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${boardH}, ${cellSize}px)`,
            border: '2px solid #3a3a5a',
          }}>
            {Array.from({ length: boardH }).map((_, y) =>
              Array.from({ length: boardW }).map((_, x) => {
                const terrain = getTerrain(x, y);
                const tInfo = TERRAIN_COLORS[terrain];
                const piece = pieces.find(p => p.x === x && p.y === y && p.currentHp > 0);
                const isSelected = piece && piece.piece.id === selectedPiece;
                const isReachable = getReachableCells.has(`${x},${y}`);
                const isAttackable = getAttackableCells.has(`${x},${y}`);

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className="relative border border-[#1a1a2a] cursor-pointer transition-colors duration-100"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isSelected ? '#4a4a8a' :
                                       isAttackable ? '#5a2a2a' :
                                       isReachable ? '#2a3a5a' : tInfo.bg,
                    }}
                  >
                    {/* Terrain label */}
                    {tInfo.label && !piece && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-40">
                        {tInfo.label}
                      </span>
                    )}

                    {/* Piece */}
                    {piece && (
                      <div className="absolute inset-[3px] flex flex-col items-center justify-center">
                        <div
                          className="w-[65%] h-[55%] border"
                          style={{
                            backgroundColor: piece.piece.color,
                            borderColor: piece.owner === 'player' ? '#44aaff' : '#ff4444',
                            borderWidth: isSelected ? 2 : 1,
                            borderRadius: piece.owner === 'player' ? '2px' : '50%',
                          }}
                        />
                        {/* HP bar */}
                        <div className="w-[80%] h-[3px] bg-[#1a1a2a] mt-0.5">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${(piece.currentHp / piece.piece.maxHp) * 100}%`,
                              backgroundColor: piece.owner === 'player' ? '#44ff44' : '#ff4444',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Movement / attack indicators */}
                    {isReachable && !piece && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#4488ff] opacity-50" />
                      </div>
                    )}
                    {isAttackable && (
                      <div className="absolute inset-0 border-2 border-[#ff4444] opacity-50" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-[200px] border-l border-[#2a2a4a] p-3 flex flex-col gap-3 overflow-y-auto">
          {/* Turn info */}
          <div>
            <p className="font-pixel text-[7px] text-[#8888cc]">
              Turn {turn} | {isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
            </p>
          </div>

          {/* Score */}
          <div>
            <p className="font-pixel text-[6px] text-[#666]">SCORE</p>
            <p className="font-pixel text-[10px] text-[#ffd700]">{score}</p>
          </div>

          {/* Selected piece info */}
          {selPiece && (
            <div className="border border-[#3a3a5a] p-2">
              <p className="font-pixel text-[7px] text-[#e0e0f0] mb-1">{selPiece.piece.name}</p>
              <p className="font-pixel text-[5px] text-[#aaaacc]">HP: {selPiece.currentHp}/{selPiece.piece.maxHp}</p>
              <p className="font-pixel text-[5px] text-[#aa6666]">ATK: {selPiece.piece.atk}</p>
              <p className="font-pixel text-[5px] text-[#6688aa]">Move: {selPiece.piece.moveRange}</p>
              <p className="font-pixel text-[5px] text-[#66aa88]">Range: {selPiece.piece.attackRange}</p>
              {selPiece.piece.special && (
                <p className="font-pixel text-[5px] text-[#cc88ff] mt-1">{selPiece.piece.special}</p>
              )}

              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => setActionMode('move')}
                  disabled={selPiece.hasMoved}
                  className={`font-pixel text-[5px] px-1.5 py-0.5 border cursor-pointer ${
                    actionMode === 'move' ? 'border-[#4488ff] text-[#4488ff]' : 'border-[#3a3a5a] text-[#666]'
                  } ${selPiece.hasMoved ? 'opacity-30' : ''}`}
                >
                  MOVE
                </button>
                <button
                  onClick={() => setActionMode('attack')}
                  disabled={selPiece.hasAttacked}
                  className={`font-pixel text-[5px] px-1.5 py-0.5 border cursor-pointer ${
                    actionMode === 'attack' ? 'border-[#ff4444] text-[#ff4444]' : 'border-[#3a3a5a] text-[#666]'
                  } ${selPiece.hasAttacked ? 'opacity-30' : ''}`}
                >
                  ATTACK
                </button>
              </div>
            </div>
          )}

          {/* Last action */}
          {lastAction && (
            <p className="font-pixel text-[6px] text-[#aaaacc]">{lastAction}</p>
          )}

          {/* End turn button */}
          <button
            onClick={endPlayerTurn}
            disabled={!isPlayerTurn || gameEnded}
            className={`font-pixel text-[7px] px-3 py-2 border mt-auto cursor-pointer ${
              isPlayerTurn && !gameEnded
                ? 'border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-[#000]'
                : 'border-[#3a3a5a] text-[#3a3a5a]'
            }`}
          >
            END TURN
          </button>

          {/* Piece list */}
          <div>
            <p className="font-pixel text-[5px] text-[#666] mb-1">YOUR UNITS</p>
            {pieces.filter(p => p.owner === 'player' && p.currentHp > 0).map(p => (
              <div key={p.piece.id} className="flex items-center gap-1 mb-0.5">
                <div className="w-2 h-2" style={{ backgroundColor: p.piece.color }} />
                <span className="font-pixel text-[5px] text-[#aaa]">{p.piece.name}</span>
                <span className="font-pixel text-[4px] text-[#666]">{p.currentHp}hp</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game over overlay */}
      {gameEnded && (
        <div className="absolute inset-0 bg-[#000000cc] flex flex-col items-center justify-center z-20">
          <p className="font-pixel text-[16px] mb-3" style={{
            color: pieces.some(p => p.owner === 'player' && p.currentHp > 0) ? '#ffd700' : '#ff4444'
          }}>
            {pieces.some(p => p.owner === 'player' && p.currentHp > 0) ? 'VICTORY!' : 'DEFEAT'}
          </p>
          <p className="font-pixel text-[9px] text-[#aaaacc]">Score: {score}</p>
        </div>
      )}
    </div>
  );
}

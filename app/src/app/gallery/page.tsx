'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import { useAuthStore } from '@/lib/store';

interface GameSummary {
  id: string;
  seed_code: string;
  name: string;
  description: string;
  play_count: number;
  created_at: string;
  username?: string;
}

type TabMode = 'recent' | 'popular' | 'mine';

export default function GalleryPage() {
  const router = useRouter();
  const { token, isLoggedIn } = useAuthStore();
  const [tab, setTab] = useState<TabMode>('recent');
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGames();
  }, [tab]);

  const fetchGames = async () => {
    setLoading(true);
    setError('');

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/games?mode=${tab}&limit=50`, { headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '获取失败');
      }

      const data = await res.json();
      setGames(data.games || []);
    } catch (err: any) {
      setError(err.message || '加载游戏列表失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePlay = (seedCode: string) => {
    router.push(`/play/${seedCode}`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-pixel text-[16px] sm:text-[20px] text-pixel-gold mb-3">
          🎮 游戏画廊
        </h1>
        <p className="font-pixel text-[8px] text-[#9090b0]">
          探索由玩家创造的独特游戏世界
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        <PixelButton
          variant={tab === 'recent' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTab('recent')}
        >
          🕐 最新
        </PixelButton>
        <PixelButton
          variant={tab === 'popular' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTab('popular')}
        >
          🔥 热门
        </PixelButton>
        {isLoggedIn() && (
          <PixelButton
            variant={tab === 'mine' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTab('mine')}
          >
            👤 我的
          </PixelButton>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-center mb-6">
          <p className="font-pixel text-[8px] text-pixel-accent">{error}</p>
          <PixelButton variant="ghost" size="sm" onClick={fetchGames} className="mt-2">
            重试
          </PixelButton>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 bg-pixel-blue animate-spin" />
          <p className="font-pixel text-[8px] text-[#9090b0] mt-4">加载中...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && games.length === 0 && (
        <div className="text-center py-12">
          <div className="text-[32px] mb-4">🎲</div>
          <p className="font-pixel text-[10px] text-pixel-light mb-2">
            {tab === 'mine' ? '你还没有创造过游戏' : '暂无游戏'}
          </p>
          <p className="font-pixel text-[7px] text-[#9090b0] mb-6">
            {tab === 'mine' ? '去创造你的第一个独特游戏吧！' : '成为第一个创造者'}
          </p>
          <Link href="/create">
            <PixelButton variant="accent" size="md">
              🔨 开始创造
            </PixelButton>
          </Link>
        </div>
      )}

      {/* Game Grid */}
      {!loading && games.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <PixelCard
              key={game.id}
              hoverable
              onClick={() => handlePlay(game.seed_code)}
              className="cursor-pointer group"
            >
              {/* Game Color Banner */}
              <div
                className="h-3 -mx-4 -mt-4 mb-3"
                style={{
                  background: `linear-gradient(90deg,
                    ${getGameAccentColor(game.seed_code)},
                    ${getGameSecondColor(game.seed_code)}
                  )`,
                }}
              />

              {/* Game Name */}
              <h3 className="font-pixel text-[9px] text-pixel-light mb-1.5 truncate group-hover:text-pixel-blue transition-colors">
                {game.name || '未命名游戏'}
              </h3>

              {/* Description */}
              <p className="font-pixel text-[6px] text-[#9090b0] mb-3 line-clamp-2 leading-relaxed">
                {game.description || '一个独特的游戏世界'}
              </p>

              {/* Seed Code */}
              <div className="flex items-center justify-between mb-2">
                <code className="font-pixel text-[7px] text-pixel-blue bg-pixel-black px-2 py-1 border border-pixel-border">
                  {game.seed_code}
                </code>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(game.seed_code);
                  }}
                  className="font-pixel text-[6px] text-[#9090b0] hover:text-pixel-light cursor-pointer"
                  title="复制种子码"
                >
                  📋
                </button>
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center">
                <span className="font-pixel text-[6px] text-[#9090b0]">
                  🎮 {game.play_count} 次游玩
                </span>
                <span className="font-pixel text-[6px] text-[#9090b0]">
                  {formatDate(game.created_at)}
                </span>
              </div>
            </PixelCard>
          ))}
        </div>
      )}

      {/* Create CTA at bottom */}
      {!loading && games.length > 0 && (
        <div className="text-center mt-10">
          <p className="font-pixel text-[7px] text-[#9090b0] mb-3">
            想要创造自己的独特游戏？
          </p>
          <Link href="/create">
            <PixelButton variant="accent" size="md">
              🔨 开始创造
            </PixelButton>
          </Link>
        </div>
      )}
    </div>
  );
}

// Generate a consistent color from seed code for visual variety
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getGameAccentColor(seedCode: string): string {
  const colors = ['#e94560', '#00d4ff', '#00ff88', '#ffd700', '#b388ff', '#ff9800', '#ff4081', '#76ff03'];
  return colors[hashCode(seedCode) % colors.length];
}

function getGameSecondColor(seedCode: string): string {
  const colors = ['#b388ff', '#ff9800', '#e94560', '#00d4ff', '#00ff88', '#ffd700', '#76ff03', '#ff4081'];
  return colors[hashCode(seedCode + '_2') % colors.length];
}

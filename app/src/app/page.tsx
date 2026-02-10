'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import PixelInput from '@/components/pixel/PixelInput';
import PixelCharacter from '@/components/layout/PixelCharacter';
import { useAuthStore } from '@/lib/store';

// Floating pixel particles for background
function FloatingPixels() {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; size: number; color: string; delay: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#e94560', '#00d4ff', '#ffd700', '#00ff88', '#b388ff', '#ff9800'];
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `float ${3 + p.delay}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [seedInput, setSeedInput] = useState('');

  const handleStartCreate = () => {
    if (isLoggedIn()) {
      router.push('/create');
    } else {
      router.push('/login?redirect=/create');
    }
  };

  const handleLoadSeed = () => {
    if (seedInput.trim()) {
      router.push(`/play/${seedInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-52px)] flex flex-col items-center justify-center px-4 py-8 sm:py-4">
      <FloatingPixels />

      <div className="relative z-10 text-center max-w-2xl mx-auto w-full">
        {/* Pixel Character */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <PixelCharacter size={5} animate={true} />
        </div>

        {/* Title */}
        <h1 className="font-pixel text-[18px] sm:text-[28px] text-pixel-gold mb-3 sm:mb-4 leading-relaxed">
          GAME ENGINE
        </h1>
        <p className="font-pixel text-[8px] sm:text-[10px] text-pixel-light mb-2 leading-loose">
          一个生成游戏的游戏
        </p>
        <p className="font-pixel text-[7px] sm:text-[8px] text-[#9090b0] mb-8 sm:mb-10 leading-loose">
          生成属于你的独一无二的游戏
        </p>

        {/* Main CTA */}
        <div className="mb-8 sm:mb-10">
          <PixelButton
            variant="accent"
            size="lg"
            onClick={handleStartCreate}
          >
            🔨 开始创造
          </PixelButton>
        </div>

        {/* Seed Input */}
        <PixelCard className="max-w-md mx-auto">
          <p className="font-pixel text-[7px] sm:text-[8px] text-[#9090b0] mb-3 text-center leading-relaxed">
            或者，输入种子码来玩别人的游戏
          </p>
          <div className="flex gap-2">
            <PixelInput
              value={seedInput}
              onChange={setSeedInput}
              placeholder="输入种子码..."
              className="flex-1"
            />
            <PixelButton
              variant="primary"
              size="md"
              onClick={handleLoadSeed}
              disabled={!seedInput.trim()}
            >
              加载
            </PixelButton>
          </div>
        </PixelCard>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 sm:mt-12 max-w-xl mx-auto">
          <div className="text-center">
            <div className="text-[18px] sm:text-[20px] mb-1 sm:mb-2">🎮</div>
            <p className="font-pixel text-[7px] sm:text-[8px] text-pixel-blue">6种游戏类型</p>
            <p className="font-pixel text-[5px] sm:text-[6px] text-[#9090b0] mt-1 leading-relaxed">
              动作 · 推理 · 卡牌 · 战棋 · 解谜 · 节奏
            </p>
          </div>
          <div className="text-center">
            <div className="text-[18px] sm:text-[20px] mb-1 sm:mb-2">🌀</div>
            <p className="font-pixel text-[7px] sm:text-[8px] text-pixel-purple">混沌引擎</p>
            <p className="font-pixel text-[5px] sm:text-[6px] text-[#9090b0] mt-1 leading-relaxed">
              从秩序到超现实的无限可能
            </p>
          </div>
          <div className="text-center">
            <div className="text-[18px] sm:text-[20px] mb-1 sm:mb-2">🔗</div>
            <p className="font-pixel text-[7px] sm:text-[8px] text-pixel-green">种子分享</p>
            <p className="font-pixel text-[5px] sm:text-[6px] text-[#9090b0] mt-1 leading-relaxed">
              一个种子码，一个独特世界
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

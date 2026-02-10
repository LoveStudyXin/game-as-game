'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCreationStore } from '@/lib/store';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import StepChooseWorld from '@/components/creation/StepChooseWorld';
import StepDiscoverDNA from '@/components/creation/StepDiscoverDNA';
import StepDNACard from '@/components/creation/StepDNACard';

const STEP_LABELS = [
  '选择你的世界',
  '发现你的DNA',
  '你的游戏DNA',
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1 mb-4 sm:mb-6">
      <div className="flex items-center gap-0.5 sm:gap-1">
        {Array.from({ length: total }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`
                w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all duration-200
                ${i === current
                  ? 'bg-pixel-gold scale-125'
                  : i < current
                    ? 'bg-pixel-green'
                    : 'bg-pixel-border'
                }
              `}
            />
            {i < total - 1 && (
              <div
                className={`w-3 sm:w-6 h-0.5 ${i < current ? 'bg-pixel-green' : 'bg-pixel-border'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <span className="sm:ml-3 font-pixel text-[7px] sm:text-[8px] text-[#aaaacc]">
        {current + 1}/{total} {STEP_LABELS[current]}
      </span>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { step, nextStep, prevStep, reset } = useCreationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn()) {
      router.push('/login?redirect=/create');
    }
  }, [mounted, isLoggedIn, router]);

  useEffect(() => {
    // Reset on mount
    reset();
  }, [reset]);

  const renderStep = () => {
    switch (step) {
      case 0: return <StepChooseWorld />;
      case 1: return <StepDiscoverDNA />;
      case 2: return <StepDNACard />;
      default: return null;
    }
  };

  // Wait for client hydration before rendering to avoid SSR mismatch
  if (!mounted || !isLoggedIn()) return null;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="font-pixel text-[11px] sm:text-[14px] text-pixel-gold text-center mb-1 sm:mb-2">
        🧬 创造你的游戏
      </h1>
      <p className="font-pixel text-[6px] sm:text-[7px] text-[#aaaacc] text-center mb-4 sm:mb-6">
        每一个回答都会融入你的游戏DNA
      </p>

      <StepIndicator current={step} total={3} />

      <PixelCard variant="default" className="mb-4 sm:mb-6">
        {renderStep()}
      </PixelCard>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <PixelButton
          variant="ghost"
          size="sm"
          onClick={step === 0 ? () => router.push('/') : prevStep}
        >
          {step === 0 ? '← 返回首页' : '← 上一步'}
        </PixelButton>

        {step === 1 ? (
          <PixelButton
            variant="primary"
            size="md"
            onClick={nextStep}
          >
            下一步 →
          </PixelButton>
        ) : null}
      </div>
    </div>
  );
}

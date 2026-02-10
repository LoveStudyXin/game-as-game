'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import PixelButton from '@/components/pixel/PixelButton';

export default function Header() {
  const { user, logout, isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Only render auth-dependent UI after hydration to avoid SSR mismatch.
  // Zustand persist restores state from localStorage on the client only,
  // so the server always sees "logged out" while the client may see "logged in".
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-pixel-black border-b-3 border-pixel-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 no-underline shrink-0">
          <span className="text-[12px] sm:text-[14px]">🔨</span>
          <span className="font-pixel text-[8px] sm:text-[10px] text-pixel-gold">
            GAME ENGINE
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3">
          {!mounted ? (
            <div className="h-[28px]" />
          ) : isLoggedIn() ? (
            <>
              <Link href="/create">
                <PixelButton variant="accent" size="sm">
                  + 创造
                </PixelButton>
              </Link>
              <Link href="/gallery">
                <PixelButton variant="ghost" size="sm">
                  画廊
                </PixelButton>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[7px] sm:text-[8px] text-pixel-blue hidden sm:inline">
                  {user?.username}
                </span>
                <PixelButton variant="ghost" size="sm" onClick={logout}>
                  登出
                </PixelButton>
              </div>
            </>
          ) : (
            <>
              <Link href="/gallery">
                <PixelButton variant="ghost" size="sm">
                  画廊
                </PixelButton>
              </Link>
              <Link href="/login">
                <PixelButton variant="ghost" size="sm">
                  登录
                </PixelButton>
              </Link>
              <Link href="/register">
                <PixelButton variant="primary" size="sm">
                  注册
                </PixelButton>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

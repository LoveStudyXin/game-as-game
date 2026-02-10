'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import PixelInput from '@/components/pixel/PixelInput';
import { useAuthStore } from '@/lib/store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }

      setAuth(data.token, data.user);
      router.push(redirect);
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PixelCard className="w-full max-w-sm">
      <h1 className="font-pixel text-[14px] text-pixel-gold text-center mb-6">
        登录
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PixelInput
          label="邮箱"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
        />
        <PixelInput
          label="密码"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="******"
        />

        {error && (
          <p className="font-pixel text-[8px] text-pixel-accent text-center">
            {error}
          </p>
        )}

        <PixelButton
          type="submit"
          variant="accent"
          size="md"
          fullWidth
          disabled={loading}
        >
          {loading ? '登录中...' : '进入游戏世界'}
        </PixelButton>
      </form>

      <p className="font-pixel text-[7px] text-[#9090b0] text-center mt-4">
        还没有账号？{' '}
        <Link href="/register" className="text-pixel-blue hover:text-pixel-light">
          去注册
        </Link>
      </p>
    </PixelCard>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-center">
          <div className="inline-block w-4 h-4 bg-pixel-blue animate-spin" />
          <p className="font-pixel text-[8px] text-[#9090b0] mt-3">加载中...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

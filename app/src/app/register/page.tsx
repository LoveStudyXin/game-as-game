'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PixelButton from '@/components/pixel/PixelButton';
import PixelCard from '@/components/pixel/PixelCard';
import PixelInput from '@/components/pixel/PixelInput';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }

      setAuth(data.token, data.user);
      router.push('/create');
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4">
      <PixelCard className="w-full max-w-sm">
        <h1 className="font-pixel text-[14px] text-pixel-gold text-center mb-6">
          注册
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PixelInput
            label="用户名"
            value={username}
            onChange={setUsername}
            placeholder="给自己起个名字"
            maxLength={20}
          />
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
            placeholder="至少6个字符"
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
            {loading ? '创建中...' : '进入游戏世界'}
          </PixelButton>
        </form>

        <p className="font-pixel text-[7px] text-[#9090b0] text-center mt-4">
          已有账号？{' '}
          <Link href="/login" className="text-pixel-blue hover:text-pixel-light">
            去登录
          </Link>
        </p>
      </PixelCard>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { getGameBySeedCode, incrementPlayCount } from '@/db/queries';

// GET /api/seed/[code] - Load a game by seed code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: '缺少种子码' }, { status: 400 });
    }

    const game = getGameBySeedCode(code.toUpperCase());
    if (!game) {
      return NextResponse.json({ error: '未找到该种子码对应的游戏' }, { status: 404 });
    }

    // Increment play count
    incrementPlayCount(code.toUpperCase());

    return NextResponse.json({
      game: {
        ...game,
        config: JSON.parse(game.config),
      },
    });
  } catch (error) {
    console.error('Load seed error:', error);
    return NextResponse.json({ error: '加载游戏失败' }, { status: 500 });
  }
}

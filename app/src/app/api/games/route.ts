import { NextResponse } from 'next/server';
import { createGame, getGamesByUserId, getRecentGames, getPopularGames } from '@/db/queries';
import { getUserFromRequest } from '@/lib/auth';
import { generateId } from '@/lib/utils';

// GET /api/games - Get games (user's games or public games)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'recent'; // 'mine' | 'recent' | 'popular'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (mode === 'mine') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 });
      }
      const games = await getGamesByUserId(user.userId);
      return NextResponse.json({ games });
    }

    if (mode === 'popular') {
      const games = await getPopularGames(limit);
      return NextResponse.json({ games });
    }

    // Default: recent
    const games = await getRecentGames(limit);
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json({ error: '获取游戏列表失败' }, { status: 500 });
  }
}

// POST /api/games - Save a new game
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { seedCode, config, name, description, parentSeed } = await request.json();

    if (!seedCode || !config) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const id = generateId();
    const game = await createGame(
      id,
      user.userId,
      seedCode,
      JSON.stringify(config),
      name,
      description,
      parentSeed
    );

    return NextResponse.json({ game });
  } catch (error: any) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error?.message && error.message.includes('UNIQUE constraint failed'))) {
      return NextResponse.json({ error: '该种子码已存在' }, { status: 409 });
    }
    console.error('Create game error:', error);
    return NextResponse.json({ error: '保存游戏失败' }, { status: 500 });
  }
}

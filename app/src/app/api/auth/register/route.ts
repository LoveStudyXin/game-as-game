import { NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername } from '@/db/queries';
import { hashPassword, createToken } from '@/lib/auth';
import { generateId } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: '请填写所有字段' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6个字符' },
        { status: 400 }
      );
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { error: '用户名需要2-20个字符' },
        { status: 400 }
      );
    }

    // Check existing
    if (await getUserByEmail(email)) {
      return NextResponse.json(
        { error: '该邮箱已注册' },
        { status: 409 }
      );
    }

    if (await getUserByUsername(username)) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 409 }
      );
    }

    // Create user
    const id = generateId();
    const passwordHash = await hashPassword(password);
    const user = await createUser(id, email, passwordHash, username);

    // Create token
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json({
      token,
      user: {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

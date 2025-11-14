import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAuthToken, generateRefreshToken } from '@/lib/jwt';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { user } = session;

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    // Use type assertion to access provider
    const userWithProvider = user as { provider?: string };

    if (!dbUser) {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          username: user.email!.split('@')[0] || `user_${Date.now()}`,
          provider: userWithProvider.provider || 'oauth',
          isVerified: true,
          isLoggedIn: true,
        },
      });
    } else {
      // Update existing user
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          isLoggedIn: true,
          provider: userWithProvider.provider || dbUser.provider,
        },
      });
    }

    // Generate our custom JWT tokens
    const authToken = generateAuthToken(dbUser.id);
    const refreshToken = generateRefreshToken(dbUser.id);

    // Create session in our database
    await prisma.session.create({
      data: {
        userId: dbUser.id,
        sessionToken: refreshToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set cookies
    const response = NextResponse.json({
      message: 'OAuth login successful',
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        provider: dbUser.provider,
      },
    });

    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.json(
      { error: 'OAuth authentication failed' },
      { status: 500 }
    );
  }
}
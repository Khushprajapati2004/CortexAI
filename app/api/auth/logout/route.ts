import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    const refreshToken = request.cookies.get('refresh-token')?.value

    if (refreshToken) {
      try {
        const decoded = verifyAuthToken(authToken || '')
        
        // Update user login status
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { isLoggedIn: false },
        })

        // Delete session
        await prisma.session.deleteMany({
          where: { sessionToken: refreshToken },
        })
      } catch {
        // Token verification failed, continue with logout
      }
    }

    const response = NextResponse.json({
      message: 'Logout successful',
    })

    // Clear cookies
    response.cookies.delete('auth-token')
    response.cookies.delete('refresh-token')

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
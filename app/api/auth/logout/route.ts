// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refresh-token')?.value;

        // Delete session from database if refresh token exists
        if (refreshToken) {
            await prisma.session.deleteMany({
                where: {
                    sessionToken: refreshToken,
                },
            });
        }

        // Update user login status
        const authToken = request.cookies.get('auth-token')?.value;
        if (authToken) {
            // You might want to decode the token to get user ID
            // For now, we'll handle this in the middleware or separately
        }

        // Clear cookies
        const response = NextResponse.json({ message: 'Logout successful' });
        
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        response.cookies.set('refresh-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const authToken = request.cookies.get('auth-token')?.value;

        if (!authToken) {
            return NextResponse.json({ user: null });
        }

        const decoded = verifyAuthToken(authToken);
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                isVerified: true,
                isLoggedIn: true,
            },
        });

        if (!user || !user.isLoggedIn) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ user: null });
    }
}
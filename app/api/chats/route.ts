// app/api/chats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const chats = await prisma.chat.findMany({
            where: { userId: session.user.id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 1, // Get first message for preview
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ chats });
    } catch (error) {
        console.error('Failed to fetch chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user && session.user.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!user) {
            try {
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: session.user.email || `${userId}@app.local`,
                        username: (session.user.name || session.user.email || userId).replace(/\s+/g, '_').substring(0, 20),
                        name: session.user.name,
                        image: session.user.image,
                        isVerified: true,
                        provider: 'oauth',
                    },
                });
            } catch (createError: unknown) {
                if (
                    typeof createError === 'object' &&
                    createError !== null &&
                    'code' in createError &&
                    (createError as { code?: string }).code === 'P2002' &&
                    session.user.email
                ) {
                    user = await prisma.user.findUnique({
                        where: { email: session.user.email },
                    });
                }
                
                if (!user) {
                    return NextResponse.json({ 
                        error: 'User account issue. Please try logging in again.' 
                    }, { status: 401 });
                }
            }
        }

        const { title, mode } = await request.json();

        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const chat = await prisma.chat.create({
            data: {
                title: title.trim(),
                mode: mode || null,
                userId: user.id,
            },
        });

        return NextResponse.json({ chat });
    } catch (error) {
        console.error('Failed to create chat:', error);
        return NextResponse.json({ 
            error: 'Failed to create chat' 
        }, { status: 500 });
    }
}

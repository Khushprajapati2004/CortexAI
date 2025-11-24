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
            console.error('No session or user id:', { hasSession: !!session, userId: session?.user?.id });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        console.log('=== Creating chat for user:', userId);

        let user = null;
        
        // Step 1: Try to find user by session ID only
        try {
            user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (user) {
                console.log('✓ User exists with session ID:', userId);
            }
        } catch (err) {
            console.warn('Error finding user by ID:', err);
        }

        // Step 2: If user doesn't exist, try to find by email and use that user
        if (!user && typeof session.user.email === 'string') {
            try {
                user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                });
                if (user) {
                    console.log('✓ User found by email (fallback):', user.email);
                }
            } catch (err) {
                console.warn('Error finding user by email:', err);
            }
        }

        // Step 3: If still no user, create one with the session ID and email
        if (!user) {
            console.log('! User not found by ID or email, creating new user with session ID:', userId);
            try {
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: session.user.email || `${userId}@app.local`,
                        username: (session.user.name || session.user.email || userId).replace(/\s+/g, '_').substring(0, 20),
                        name: session.user.name,
                        image: session.user.image,
                        isVerified: true,
                        isLoggedIn: true,
                        provider: 'oauth',
                    },
                });
                console.log('✓ User created successfully:', user.id);
            } catch (createError: unknown) {
                if (
                    typeof createError === 'object' &&
                    createError !== null &&
                    'code' in createError &&
                    (createError as { code?: string }).code === 'P2002'
                ) {
                    // Unique constraint failed on email, so fetch the user by email
                    if (typeof session.user.email === 'string') {
                        user = await prisma.user.findUnique({
                            where: { email: session.user.email },
                        });
                        if (user) {
                            console.log('✓ User found by email after constraint error:', user.email);
                        } else {
                            console.error('✗ CRITICAL: Cannot find user after constraint error');
                            return NextResponse.json({ 
                                error: 'User account issue. Please try logging in again.' 
                            }, { status: 401 });
                        }
                    } else {
                        console.error('✗ CRITICAL: Email not available after constraint error');
                        return NextResponse.json({ 
                            error: 'User account issue. Please try logging in again.' 
                        }, { status: 401 });
                    }
                } else {
                    console.error('✗ FAILED to create user:', createError);
                    return NextResponse.json({ 
                        error: 'User account issue. Please try logging in again.' 
                    }, { status: 401 });
                }
            }
        }

        // Always use the database user ID for chat creation
        if (!user) {
            console.error('✗ CRITICAL: No user found for chat creation');
            return NextResponse.json({ error: 'User account issue. Please try logging in again.' }, { status: 401 });
        }

        // Step 3: Verify user exists before creating chat
        if (!user || !user.id) {
            console.error('✗ User verification failed');
            return NextResponse.json({ 
                error: 'User account not properly initialized' 
            }, { status: 500 });
        }

        // Step 4: Parse request body
        const { title, mode } = await request.json();

        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

      
            // Step 5: CREATE CHAT - Use database user ID!
            console.log('→ Creating chat for user:', user.id);
            const chat = await prisma.chat.create({
                data: {
                    title: title.trim(),
                    mode: mode || null,
                    userId: user.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

        console.log('✓ Chat created successfully:', chat.id);
        return NextResponse.json({ chat });
    } catch (error) {
        console.error('✗ Failed to create chat:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ 
            error: `Failed to create chat: ${errorMessage}` 
        }, { status: 500 });
    }
}

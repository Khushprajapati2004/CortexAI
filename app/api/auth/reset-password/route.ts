import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/utils';
import { verifyResetToken } from '@/lib/jwt';
import { sendPasswordResetSuccess } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword } = await request.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    // Verify reset token
    let userId: string;
    try {
      const decoded = verifyResetToken(resetToken);
      userId = decoded.userId;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear any existing reset tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send success email
    await sendPasswordResetSuccess(user.email, user.username);

    return NextResponse.json({
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
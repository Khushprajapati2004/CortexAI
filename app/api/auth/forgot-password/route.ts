import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/utils';
import { sendPasswordResetOTP } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a reset OTP',
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before resetting password' },
        { status: 400 }
      );
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiry,
      },
    });

    // Send OTP email
    await sendPasswordResetOTP(email, otp, user.username);

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a reset OTP',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
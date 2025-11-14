import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateResetToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find user with valid OTP
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
        otpExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = generateResetToken(user.id);

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json({
      message: 'OTP verified successfully',
      resetToken,
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
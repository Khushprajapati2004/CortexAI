import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - CortexAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to CortexAI!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">
          If you didn't create an account with CortexAI, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendSuccessEmail = async (email: string, username: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verified Successfully - CortexAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verified Successfully!</h2>
        <p>Hello ${username},</p>
        <p>Your email has been successfully verified. You can now login to your CortexAI account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/login" 
             style="background-color: #10B981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to CortexAI
          </a>
        </div>
        <p>Welcome aboard!</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetOTP = async (email: string, otp: string, username: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP - CortexAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Use the OTP below to verify your identity:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #4F46E5; color: white; padding: 15px 30px; 
                      border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;
                      display: inline-block;">
            ${otp}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">
          This OTP will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          For security reasons, do not share this OTP with anyone.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetSuccess = async (email: string, username: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Successful - CortexAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful!</h2>
        <p>Hello ${username},</p>
        <p>Your password has been successfully reset. If you did not make this change, please contact our support team immediately.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/login" 
             style="background-color: #10B981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          For security reasons, we recommend using a strong, unique password.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
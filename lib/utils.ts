import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};
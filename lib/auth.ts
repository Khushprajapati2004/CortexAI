// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist user id and provider to the token using type-safe approach
      if (user) {
        // Use type assertion for user object
        const userWithId = user ;
        token.id = userWithId.id;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client with type safety
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          provider: token.provider as string,
        },
      };
    },
    async signIn({ user, account }) { // Removed unused 'profile' parameter
      try {
        // Check if user exists in our custom User table
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Update user provider if different
            if (existingUser.provider !== account?.provider) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  provider: account?.provider || "oauth",
                  providerId: account?.providerAccountId,
                  isVerified: true, // OAuth users are automatically verified
                  isLoggedIn: true,
                },
              });
            }
          } else {
            // Create new user in our custom User table
            await prisma.user.create({
              data: {
                email: user.email,
                username: user.email?.split('@')[0] || `user_${Date.now()}`,
                provider: account?.provider || "oauth",
                providerId: account?.providerAccountId,
                isVerified: true,
                isLoggedIn: true,
              },
            });
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser && user.email) {
        console.log(`New user signed up with ${account?.provider}: ${user.email}`);
      }
    },
  },
};
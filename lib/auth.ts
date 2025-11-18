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
        // Store the NextAuth user ID in token
        token.id = user.id;
        token.email = user.email;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client with type safety
      // Use the ID from the custom User table if available, otherwise use NextAuth ID
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          provider: token.provider as string,
        },
      };
    },
    async signIn({ user, account }) {
      try {
        if (!user.email || !user.id) {
          console.error("User missing email or id:", { email: user.email, id: user.id });
          return true;
        }

        console.log("SignIn callback - user.id:", user.id);

        // ALWAYS use the user.id from NextAuth as the source of truth
        // Don't look up by email - this causes ID mismatches!
        
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
        }).catch(err => {
          console.warn("Error finding user:", err);
          return null;
        });

        if (existingUser) {
          // User exists, just update their info
          console.log("User exists with ID:", user.id);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isLoggedIn: true,
              isVerified: true,
              provider: account?.provider || existingUser.provider,
              providerId: account?.providerAccountId || existingUser.providerId,
              email: user.email, // Ensure email is up to date
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
            },
          }).catch(err => console.warn("Error updating user:", err));
        } else {
          // Create new user with the NextAuth user.id
          console.log("Creating new user with NextAuth ID:", user.id);
          try {
            await prisma.user.create({
              data: {
                id: user.id, // Use NextAuth user ID
                email: user.email,
                username: user.name?.replace(/\s+/g, '_').substring(0, 20) || user.email.split('@')[0] || `user_${user.id}`.substring(0, 20),
                name: user.name,
                image: user.image,
                provider: account?.provider || "oauth",
                providerId: account?.providerAccountId,
                isVerified: true,
                isLoggedIn: true,
              },
            });
            console.log("User created successfully with ID:", user.id);
          } catch (createError: unknown) {
            console.error("Failed to create user:", createError);
            // Even if creation fails, allow signin to proceed
            // The user will be created on next API call if needed
          }
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return true;
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
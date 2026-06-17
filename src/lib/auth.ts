import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import LineProvider from "next-auth/providers/line";
import bcrypt from "bcrypt";
import prisma from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Email + Password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // GitHub OAuth
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // LINE OAuth
    ...(process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET
      ? [
          LineProvider({
            clientId: process.env.LINE_CLIENT_ID,
            clientSecret: process.env.LINE_CLIENT_SECRET,
            authorization: { params: { scope: "profile openid", bot_prompt: "normal" } },
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "line" && user?.id) {
        try {
          const p = profile as any;
          // Get current notification preferences
          const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { notificationPreferences: true }
          });
          const currentPrefs = (currentUser?.notificationPreferences as any) || {};
          const updatedPrefs = {
            ...currentPrefs,
            lineDisplayName: p?.displayName || p?.name || null,
            linePictureUrl: p?.pictureUrl || p?.picture || p?.image || null
          };

          // Remove the lineUserId from any other user to prevent unique constraint violation
          await prisma.user.updateMany({
            where: {
              lineUserId: account.providerAccountId,
              id: { not: user.id }
            },
            data: { lineUserId: null }
          });

          // Set it on the current user
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              lineUserId: account.providerAccountId,
              notificationPreferences: updatedPrefs
            }
          });
        } catch (error) {
          console.error("Error updating lineUserId in signIn event:", error);
        }
      }
    },
    async linkAccount({ user, account, profile }) {
      if (account.provider === "line" && user?.id) {
        try {
          const p = profile as any;
          // Get current notification preferences
          const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { notificationPreferences: true }
          });
          const currentPrefs = (currentUser?.notificationPreferences as any) || {};
          const updatedPrefs = {
            ...currentPrefs,
            lineDisplayName: p?.displayName || p?.name || null,
            linePictureUrl: p?.pictureUrl || p?.picture || p?.image || null
          };

          // Remove the lineUserId from any other user to prevent unique constraint violation
          await prisma.user.updateMany({
            where: {
              lineUserId: account.providerAccountId,
              id: { not: user.id }
            },
            data: { lineUserId: null }
          });

          // Set it on the current user
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              lineUserId: account.providerAccountId,
              notificationPreferences: updatedPrefs
            }
          });
        } catch (error) {
          console.error("Error updating lineUserId in linkAccount event:", error);
        }
      }
    },
  },
});

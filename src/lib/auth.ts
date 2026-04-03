import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import type { Role, Plan, Language, Theme } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      plan: Plan;
      language: Language;
      theme: Theme;
      onboardingCompleted: boolean;
      orgId?: string;
    };
  }

  interface User {
    role: Role;
    plan: Plan;
    language: Language;
    theme: Theme;
    onboardingCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    plan: Plan;
    language: Language;
    theme: Theme;
    onboardingCompleted: boolean;
    orgId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_FROM,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email, deletedAt: null },
        });

        if (!user?.hashedPassword) return null;

        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
          language: user.language,
          theme: user.theme,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
        token.language = user.language;
        token.theme = user.theme;
        token.onboardingCompleted = user.onboardingCompleted;

        const org = await prisma.organization.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });
        token.orgId = org?.id;
      }

      if (trigger === "update" && session) {
        if (session.language) token.language = session.language;
        if (session.theme) token.theme = session.theme;
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session.orgId) token.orgId = session.orgId;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.plan = token.plan;
      session.user.language = token.language;
      session.user.theme = token.theme;
      session.user.onboardingCompleted = token.onboardingCompleted;
      session.user.orgId = token.orgId;
      return session;
    },
  },
};

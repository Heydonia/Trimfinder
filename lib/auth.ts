import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@dealer.com' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const remember = credentials?.rememberMe === 'true' || credentials?.rememberMe === 'on';

        if (adminEmail && adminPassword && credentials.email === adminEmail && credentials.password === adminPassword) {
          return {
            id: 'env-admin',
            name: 'Dealer Admin',
            email: adminEmail,
            role: 'admin',
            rememberMe: remember,
          } as any;
        }

        if (userEmail && userPassword && credentials.email === userEmail && credentials.password === userPassword) {
          return {
            id: 'env-user',
            name: 'Dealer User',
            email: userEmail,
            role: 'user',
            rememberMe: remember,
          } as any;
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id.toString(),
          name: user.email,
          email: user.email,
          role: user.role,
          rememberMe: remember,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        const rememberMe = !!(user as any).rememberMe;
        token.rememberMe = rememberMe;
        token.exp = Math.floor(Date.now() / 1000) + (rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.exp) {
        session.expires = new Date(token.exp * 1000).toISOString();
      }
      (session.user as any).role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

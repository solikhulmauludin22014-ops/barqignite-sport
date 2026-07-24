import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // --- BACKDOOR DITAMBAHKAN SEMENTARA ---
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          return {
            id: '1',
            name: 'admin',
            email: 'admin@club.com',
            role: 'admin',
          };
        }
        // --------------------------------------

        const { data: admin, error } = await supabase
          .from('admin')
          .select('*')
          .eq('username', credentials.username)
          .single();

        if (error || !admin) {
          return null;
        }

        if (credentials.password === admin.password) {
          return {
            id: admin.id,
            name: admin.username,
            email: `${admin.username}@club.com`,
            role: admin.role,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

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

        try {
          // Cari admin berdasarkan username
          const { data: admin, error } = await supabase
            .from('admin')
            .select('id, username, password_hash, role')
            .eq('username', credentials.username)
            .single();

          if (error || !admin) {
            console.log('[Auth] Admin tidak ditemukan:', credentials.username);
            return null;
          }

          // Bandingkan password: cek plain text dulu (untuk development)
          // password_hash bisa berupa plain text atau bcrypt hash
          let passwordValid = false;

          // Cek apakah password_hash mengandung '$2b$' (format bcrypt)
          if (admin.password_hash?.startsWith('$2b$') || admin.password_hash?.startsWith('$2a$')) {
            // Bcrypt comparison
            try {
              const bcrypt = await import('bcryptjs');
              passwordValid = await bcrypt.compare(credentials.password, admin.password_hash);
            } catch {
              // bcryptjs tidak tersedia, fallback ke plain text
              passwordValid = credentials.password === admin.password_hash;
            }
          } else {
            // Plain text comparison (untuk development)
            passwordValid = credentials.password === admin.password_hash;
          }

          if (passwordValid) {
            return {
              id: admin.id,
              name: admin.username,
              email: `${admin.username}@barqignite.com`,
              role: admin.role,
            };
          }

          console.log('[Auth] Password salah untuk:', credentials.username);
          return null;
        } catch (err) {
          console.error('[Auth] Error saat authorize:', err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 jam
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-barqignite-2026',
};

export default NextAuth(authOptions);

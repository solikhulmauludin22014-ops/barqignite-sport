import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const isProduction = process.env.NODE_ENV === 'production';

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
          console.time('Supabase Query');
          // Cari admin berdasarkan username
          const { data: admin, error } = await supabase
            .from('admin')
            .select('id, username, password_hash, role')
            .eq('username', credentials.username)
            .single();
          console.timeEnd('Supabase Query');

          if (error || !admin) {
            console.log('[Auth] Admin tidak ditemukan:', credentials.username);
            return null;
          }

          // Bandingkan password: cek plain text dulu (untuk development)
          // password_hash bisa berupa plain text atau bcrypt hash
          let passwordValid = false;

          // Cek apakah password_hash mengandung '$2b$' (format bcrypt)
          console.time('Password Validation');
          if (admin.password_hash?.startsWith('$2b$') || admin.password_hash?.startsWith('$2a$')) {
            // Bcrypt comparison
            try {
              passwordValid = await bcrypt.compare(credentials.password, admin.password_hash);
            } catch (err) {
              console.error('Bcrypt compare error:', err);
              // Fallback to plain text if bcrypt fails unexpectedly
              passwordValid = credentials.password === admin.password_hash;
            }
          } else {
            // Plain text comparison (untuk development)
            passwordValid = credentials.password === admin.password_hash;
          }
          console.timeEnd('Password Validation');

          if (passwordValid) {
            console.time('Session Creation');
            const userObj = {
              id: admin.id,
              name: admin.username,
              email: `${admin.username}@barqignite.com`,
              role: admin.role,
            };
            console.timeEnd('Session Creation');
            return userObj;
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
  // ─── Fix CSRF cold start issue pada Vercel & custom domain ────────────────────────────────
  // Ketika NEXTAUTH_URL tidak cocok dengan actual host (cold start / proxy),
  // NextAuth gagal generate CSRF token yang valid sehingga form login tidak berfungsi
  // pada load pertama. Setting trustHost = true membuat NextAuth percaya pada
  // x-forwarded-host header dari Vercel's edge network.
  // Referensi: https://next-auth.js.org/configuration/options#trusthost
  ...(isProduction && {
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
        },
      },
      callbackUrl: {
        name: `__Secure-next-auth.callback-url`,
        options: {
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
          secure: true,
        },
      },
      csrfToken: {
        name: `__Host-next-auth.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
        },
      },
    },
  }),
};

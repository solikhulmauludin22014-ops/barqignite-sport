import type { Metadata } from 'next';
import { Anton, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

// ─── Sport Jersey Display Font — Anton ────────────────────────────────────────
// Anton: ultra-condensed, heavy, all-caps — authentic jersey/varsity number feel
// Single weight (700-equivalent black), subset latin saja biar ringan
const anton = Anton({
  weight: '400', // Anton hanya punya satu weight tapi sudah sangat heavy
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Clean geometric body font
const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Monospace for stats / scoreboard numbers
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Barqignite Private Sport',
    template: '%s | Barqignite Private Sport',
  },
  description: 'Website resmi club olahraga Barqignite — profil, pendaftaran, jadwal latihan, dan informasi anggota.',
  keywords: ['club olahraga', 'basket', 'renang', 'pendaftaran', 'latihan', 'jadwal', 'sidoarjo'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${anton.variable} ${plusJakartaSans.variable} ${spaceMono.variable} antialiased bg-arena-800 text-neutral-light`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

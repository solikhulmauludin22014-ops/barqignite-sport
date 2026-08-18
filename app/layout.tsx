import type { Metadata } from 'next';
import { Barlow_Condensed, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

// Athletic display font — headline jersey/scoreboard feel
const barlowCondensed = Barlow_Condensed({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-barlow',
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
      <body className={`${barlowCondensed.variable} ${plusJakartaSans.variable} ${spaceMono.variable} antialiased bg-arena-800 text-neutral-light`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

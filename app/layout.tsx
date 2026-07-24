import type { Metadata } from 'next';
import { Inter, Oswald, Space_Mono } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono' });

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
      <body className={`${inter.variable} ${oswald.variable} ${spaceMono.variable} antialiased bg-arena-800 text-neutral-light`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

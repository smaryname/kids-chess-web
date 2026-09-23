import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Chess PvsP',
  description: 'A friendly two-player chess game made for young children.',
  openGraph: {
    title: 'Chess PvsP',
    description: 'Play, learn, smile. A friendly two-player chess game for young children.',
    images: ['https://raw.githubusercontent.com/smaryname/kids-chess-web/main/public/og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chess PvsP',
    description: 'Play, learn, smile. A friendly two-player chess game for young children.',
    images: ['https://raw.githubusercontent.com/smaryname/kids-chess-web/main/public/og.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${fredoka.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { SoundProvider } from '@/components/SoundProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PokeBattle',
  description: 'Top-Trumps Web3 Trading Card Game on Monad',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SoundProvider />
        <Providers>
          <Navbar />
          <main className="flex-grow pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

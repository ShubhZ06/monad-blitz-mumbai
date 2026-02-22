'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
    return (
        <nav className="fixed w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 left-0 top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-400 bg-clip-text text-transparent">
                            MonadMons
                        </Link>

                        <div className="hidden md:flex space-x-4">
                            <Link href="/shop" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                Shop & Claim
                            </Link>
                            <Link href="/collection" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                My Collection
                            </Link>
                            <Link href="/battle" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                Battle Lobby
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}

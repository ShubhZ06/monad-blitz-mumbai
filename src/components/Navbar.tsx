'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export function Navbar() {
    const { isConnected } = useAccount();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch on client vs server
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="fixed w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 left-0 top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-400 bg-clip-text text-transparent">
                            MonadMons
                        </Link>

                        {/* Only show these navigation links if the user is both connected and the component has mounted */}
                        {mounted && isConnected && (
                            <div className="hidden md:flex space-x-4">
                                <Link href="/shop" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                    Shop
                                </Link>
                                <Link href="/collection" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                    My Pokemons
                                </Link>
                                <Link href="/battle" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                    Arena
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}

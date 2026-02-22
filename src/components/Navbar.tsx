'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useProfile } from './ProfileProvider';

export function Navbar() {
    const { isConnected } = useAccount();
    const { profile, setShowProfilePopup } = useProfile();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch on client vs server
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="fixed w-full z-50 bg-[#fffbe6] border-b-4 border-black left-0 top-0 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-2xl font-black text-black uppercase tracking-wider border-2 border-black bg-yellow-400 px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                            PokeBattle
                        </Link>

                        {/* Only show these navigation links if the user is both connected and the component has mounted */}
                        {mounted && isConnected && (
                            <div className="hidden md:flex space-x-6">
                                <Link href="/shop" className="text-sm font-bold text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-transparent hover:border-black transition-colors rounded-md">
                                    Shop
                                </Link>
                                <Link href="/collection" className="text-sm font-bold text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-transparent hover:border-black transition-colors rounded-md">
                                    My Pokemons
                                </Link>
                                <Link href="/battle" className="text-sm font-bold text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-transparent hover:border-black transition-colors rounded-md">
                                    Arena
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Show username badge if profile exists */}
                        {mounted && isConnected && profile && (
                            <button
                                onClick={() => setShowProfilePopup(true)}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#33CCFF] border-2 border-black shadow-[2px_2px_0_0_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg"
                            >
                                <span className="text-lg">👤</span>
                                <span className="font-bold text-black text-sm">{profile.username}</span>
                            </button>
                        )}
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}

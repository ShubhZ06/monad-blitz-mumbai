'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const { isConnected, address } = useAccount();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Security: Kick unauthenticated users back to landing
    useEffect(() => {
        if (mounted && !isConnected) {
            router.push('/');
        }
    }, [mounted, isConnected, router]);

    if (!mounted || !isConnected) return null; // Avoid hydration flash

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 relative">

            {/* Header / Welcome Area */}
            <div className="mb-16 text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center shadow-[0_0_40px_-5px_rgba(244,63,94,0.5)] mb-6 border-4 border-zinc-950">
                    <span className="text-4xl">🏥</span>
                </div>
                <h1 className="text-5xl font-black mb-4 text-white">
                    Welcome to the <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">Health Centre</span>
                </h1>
                <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                    Your Pokémon are fully healed and ready for action. {address ? `Trainer ${address.slice(0, 6)}...${address.slice(-4)}` : ''}, where would you like to go today?
                </p>
            </div>

            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Shop Card */}
                <Link href="/shop" className="group flex flex-col items-center justify-center p-12 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm hover:bg-zinc-800/80 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🏪</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Poké Mart</h2>
                    <p className="text-zinc-500 text-center text-sm">Buy Premium items and claim your free daily drops.</p>
                </Link>

                {/* Collection Card */}
                <Link href="/collection" className="group flex flex-col items-center justify-center p-12 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🎒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">My Pokémons</h2>
                    <p className="text-zinc-500 text-center text-sm">View your collection, check stats, and manage your team.</p>
                </Link>

                {/* Battle Card */}
                <Link href="/battle" className="group flex flex-col items-center justify-center p-12 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm hover:bg-zinc-800/80 hover:border-red-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.3)]">
                    <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-4xl">⚔️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">The Arena</h2>
                    <p className="text-zinc-500 text-center text-sm">Stake your NFTs and battle other trainers to claim their cards.</p>
                </Link>

            </div>

        </div>
    );
}

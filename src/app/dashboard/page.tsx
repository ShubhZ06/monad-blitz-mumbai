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
                <div className="w-24 h-24 mx-auto bg-pink-400 rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#000000] mb-6 border-4 border-black">
                    <span className="text-4xl">🏥</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 text-black uppercase tracking-tight">
                    Welcome to the <span className="bg-[#FF3366] text-white px-4 border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-2deg] inline-block">Health Centre</span>
                </h1>
                <p className="text-black font-bold max-w-2xl mx-auto text-lg border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000000]">
                    Your Pokémon are fully healed and ready for action. {address ? `Trainer ${address.slice(0, 6)}...${address.slice(-4)}` : ''}, where would you like to go today?
                </p>
            </div>

            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Shop Card */}
                <Link href="/shop" className="neo-card flex flex-col items-center justify-center p-12 bg-[#33CCFF] group transition-all transform hover:-translate-y-2 hover:shadow-[8px_12px_0_0_#000000]">
                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_#000000]">
                        <span className="text-4xl">🏪</span>
                    </div>
                    <h2 className="text-3xl font-black text-black mb-2 uppercase">Poké Mart</h2>
                    <p className="text-black font-bold text-center text-sm">Buy Premium items and claim your free daily drops.</p>
                </Link>

                {/* Collection Card */}
                <Link href="/collection" className="neo-card flex flex-col items-center justify-center p-12 bg-[#34c759] group transition-all transform hover:-translate-y-2 hover:shadow-[8px_12px_0_0_#000000]">
                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_#000000]">
                        <span className="text-4xl">🎒</span>
                    </div>
                    <h2 className="text-3xl font-black text-black mb-2 uppercase">My Pokémons</h2>
                    <p className="text-black font-bold text-center text-sm">View your collection, check stats, and manage your team.</p>
                </Link>

                {/* Battle Card */}
                <Link href="/battle" className="neo-card flex flex-col items-center justify-center p-12 bg-[#FF3366] group transition-all transform hover:-translate-y-2 hover:shadow-[8px_12px_0_0_#000000]">
                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_#000000]">
                        <span className="text-4xl">⚔️</span>
                    </div>
                    <h2 className="text-3xl font-black text-black mb-2 uppercase text-white drop-shadow-[2px_2px_0_#000000]">The Arena</h2>
                    <p className="text-white font-bold text-center text-sm drop-shadow-[1px_1px_0_#000000]">Stake your NFTs and battle other trainers to claim their cards.</p>
                </Link>

            </div>

        </div>
    );
}

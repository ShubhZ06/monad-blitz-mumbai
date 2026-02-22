'use client';

import { useAccount, useReadContract } from 'wagmi';
import Link from 'next/link';

const MonadMonsABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "tokenOfOwnerByIndex", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "monStats", "outputs": [{ "internalType": "uint8", "name": "attack", "type": "uint8" }, { "internalType": "uint8", "name": "defense", "type": "uint8" }, { "internalType": "uint8", "name": "speed", "type": "uint8" }, { "internalType": "enum MonadMons.Tier", "name": "tier", "type": "uint8" }], "stateMutability": "view", "type": "function" }
];

const MONAD_MONS_ADDRESS = '0xa33773ee9ecc5db55ec87de62bbb1a7b8c821754';

export default function Collection() {
    const { address, isConnected } = useAccount();

    const { data: balanceData, isLoading: isBalanceLoading, error: readError } = useReadContract({
        abi: MonadMonsABI,
        address: MONAD_MONS_ADDRESS,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    const balance = balanceData ? Number(balanceData) : 0;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Wallet Disconnected</h2>
                <p className="mt-4 text-zinc-400">Please connect to the Monad Testnet to view your collection.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent text-center md:text-left">My Pokémons</h1>

            {readError && (
                <div className="max-w-3xl mx-auto mb-12 p-6 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 font-medium whitespace-pre-wrap break-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]">
                    <h3 className="text-lg font-bold mb-2">Error connecting to Monad Network</h3>
                    <p className="text-sm font-mono opacity-80">{readError.message}</p>
                </div>
            )}

            {isBalanceLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    <span className="ml-4 text-zinc-400">Loading collection from Monad network...</span>
                </div>
            ) : balance === 0 ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto mt-12">
                    <div className="text-6xl mb-6 opacity-50 grayscale">🎒</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Your Bag is Empty</h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                        You don't own any MonadMons yet! Visit the Poké Mart to claim your free daily drop or mint a Legendary Premium Pokémon.
                    </p>
                    <Link href="/shop" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                        Go to Poké Mart
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-8 text-zinc-400 bg-white/5 p-4 rounded-xl border border-white/5 inline-block">
                        <span className="font-bold text-white tracking-widest uppercase text-sm">Wallet Balance:</span>
                        <span className="ml-2 font-mono text-pink-400 text-xl font-bold">{balance}</span> MonadMons
                    </div>

                    {/* UI Mock: Rendering generic "Premium" and "Standard" cards based on balance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* We will render a mix of mocked cards that represents the count of the user's True balance. For a real app, we'd loop tokenOfOwnerByIndex and fetch stats. */}
                        {Array.from({ length: balance }).map((_, i) => {
                            const isPremium = i === 0; // Assume the first card is the Premium they bought for demo

                            return (
                                <div key={i} className={`bg-zinc-900 border ${isPremium ? 'border-amber-500/50 shadow-amber-500/20' : 'border-purple-500/30 shadow-purple-500/10'} rounded-2xl overflow-hidden transition-colors shadow-lg group hover:scale-[1.02] transform duration-300 relative`}>
                                    <div className={`h-48 ${isPremium ? 'bg-gradient-to-tr from-amber-900/40 to-orange-600/20' : 'bg-purple-900/20'} flex flex-col items-center justify-center relative`}>
                                        <div className={`absolute top-3 right-3 ${isPremium ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'} text-xs px-2 py-1 rounded font-bold uppercase tracking-widest`}>
                                            {isPremium ? 'Premium' : 'Standard'}
                                        </div>
                                        <div className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                                            {isPremium ? '🦄' : '🐲'}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h4 className="text-lg font-bold text-white mb-4">{isPremium ? `Monad Uni #${420 + i}` : `Monad Dragon #${101 + i}`}</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Attack</span>
                                                <span className="text-red-400 font-mono font-bold">{isPremium ? '48' : '25'}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className={`bg-red-500 h-1.5 rounded-full ${isPremium ? 'w-[48%]' : 'w-[25%]'}`} /></div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Defense</span>
                                                <span className="text-blue-400 font-mono font-bold">{isPremium ? '41' : '22'}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className={`bg-blue-500 h-1.5 rounded-full ${isPremium ? 'w-[41%]' : 'w-[22%]'}`} /></div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Speed</span>
                                                <span className="text-yellow-400 font-mono font-bold">{isPremium ? '52' : '28'}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className={`bg-yellow-500 h-1.5 rounded-full ${isPremium ? 'w-[52%]' : 'w-[28%]'}`} /></div>
                                        </div>

                                        <button className={`w-full mt-6 py-2 ${isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 border-none hover:opacity-90' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'} text-sm font-semibold rounded-lg transition-all`}>
                                            Stake in Escrow
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

        </div>
    );
}

'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';

const MonadMonsABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "tokenOfOwnerByIndex", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "monStats", "outputs": [{ "internalType": "uint8", "name": "attack", "type": "uint8" }, { "internalType": "uint8", "name": "defense", "type": "uint8" }, { "internalType": "uint8", "name": "speed", "type": "uint8" }, { "internalType": "enum MonadMons.Tier", "name": "tier", "type": "uint8" }], "stateMutability": "view", "type": "function" }
];

const MONAD_MONS_ADDRESS = '0xb304e21E368cCe3e8F8367e1Bb143E90bb3F0512';

export default function Collection() {
    const { address, isConnected } = useAccount();

    // A basic implementation would read the balance, then loop indexing over balance to fetch each NFT stats.
    // For the sake of this UI demo, we'll display mock data when not fully connected to save network calls in UI.

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
            <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">My Collection</h1>

            {/* Mock Collection UI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Mock Card 1 */}
                <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl overflow-hidden hover:border-purple-500 transition-colors shadow-lg shadow-black group">
                    <div className="h-48 bg-purple-900/20 flex flex-col items-center justify-center relative">
                        <div className="absolute top-3 right-3 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded font-bold">Standard</div>
                        <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🐲</div>
                    </div>
                    <div className="p-5">
                        <h4 className="text-lg font-bold text-white mb-4">Monad Dragon #101</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Attack</span>
                                <span className="text-red-400 font-mono font-bold">25</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full w-[25%]" /></div>

                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Defense</span>
                                <span className="text-blue-400 font-mono font-bold">22</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full w-[22%]" /></div>

                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Speed</span>
                                <span className="text-yellow-400 font-mono font-bold">28</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full w-[28%]" /></div>
                        </div>

                        <button className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-lg transition-colors border border-white/5">
                            Stake in Escrow
                        </button>
                    </div>
                </div>

                {/* Mock Card 2 */}
                <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl overflow-hidden hover:border-amber-500 transition-colors shadow-lg shadow-black group">
                    <div className="h-48 bg-amber-900/20 flex flex-col items-center justify-center relative">
                        <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded font-bold">Premium</div>
                        <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🦄</div>
                    </div>
                    <div className="p-5">
                        <h4 className="text-lg font-bold text-white mb-4">Monad Uni #420</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Attack</span>
                                <span className="text-red-400 font-mono font-bold">48</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full w-[48%]" /></div>

                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Defense</span>
                                <span className="text-blue-400 font-mono font-bold">41</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full w-[41%]" /></div>

                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Speed</span>
                                <span className="text-yellow-400 font-mono font-bold">52</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full w-[52%]" /></div>
                        </div>

                        <button className="w-full mt-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-900 text-sm font-semibold rounded-lg transition-colors">
                            Stake in Escrow
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}

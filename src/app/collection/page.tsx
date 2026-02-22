'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';

const MonadMonsABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "tokenOfOwnerByIndex", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "monStats", "outputs": [{ "internalType": "uint8", "name": "attack", "type": "uint8" }, { "internalType": "uint8", "name": "defense", "type": "uint8" }, { "internalType": "uint8", "name": "speed", "type": "uint8" }, { "internalType": "uint8", "name": "speciesId", "type": "uint8" }, { "internalType": "enum MonadMons.Tier", "name": "tier", "type": "uint8" }], "stateMutability": "view", "type": "function" }
];

const MONAD_MONS_ADDRESS = '0xdcB7bD581BABF76ea8530E11b00E29988032Bea8';

const POKEMON_PRODUCTS = [
    { name: 'Charizard', image: '/images/charizaed.png', type: 'Fire / Flying', gradient: 'from-orange-500 to-red-600', textColor: 'text-orange-400', shadow: 'shadow-orange-500/20' },
    { name: 'Blastoise', image: '/images/blastois.png', type: 'Water', gradient: 'from-blue-500 to-cyan-500', textColor: 'text-blue-400', shadow: 'shadow-blue-500/20' },
    { name: 'Venusaur', image: '/images/venasaur.png', type: 'Grass / Poison', gradient: 'from-green-500 to-emerald-600', textColor: 'text-green-400', shadow: 'shadow-green-500/20' },
    { name: 'Pikachu', image: '/images/pikachu.png', type: 'Electric', gradient: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-400', shadow: 'shadow-yellow-500/20' },
    { name: 'Unknown', image: '/images/pikachu.png', type: 'Normal', gradient: 'from-gray-400 to-gray-500', textColor: 'text-gray-400', shadow: 'shadow-gray-500/20' }
];

// Sub component to fetch token stats
function PokemonCard({ index, owner }: { index: number, owner: `0x${string}` }) {
    const { data: tokenIdData } = useReadContract({
        abi: MonadMonsABI,
        address: MONAD_MONS_ADDRESS,
        functionName: 'tokenOfOwnerByIndex',
        args: [owner, index]
    });

    const tokenId = tokenIdData !== undefined ? Number(tokenIdData) : undefined;

    const { data: statsData } = useReadContract({
        abi: MonadMonsABI,
        address: MONAD_MONS_ADDRESS,
        functionName: 'monStats',
        args: tokenId !== undefined ? [tokenId] : undefined,
        query: {
            enabled: tokenId !== undefined
        }
    });

    if (!statsData) {
        return <div className="animate-pulse bg-zinc-900 rounded-2xl h-96 w-full border border-white/5"></div>;
    }

    const [attack, defense, speed, speciesId, tierVal] = statsData as [number, number, number, number, number];

    // Fallback if species ID is out of bounds
    const pokemon = POKEMON_PRODUCTS[speciesId] || POKEMON_PRODUCTS[4];

    const tier = tierVal === 2 ? 'Premium' : tierVal === 1 ? 'Standard' : 'Starter';
    const isPremium = tier === 'Premium';

    return (
        <div className={`bg-zinc-900 border ${isPremium ? 'border-amber-500/50 shadow-amber-500/20' : 'border-zinc-700'} rounded-2xl overflow-hidden shadow-lg group hover:scale-[1.02] transform transition-all duration-300 relative`}>
            <div className={`h-48 bg-gradient-to-tr ${pokemon.gradient} opacity-80 flex flex-col items-center justify-center relative`}>
                <div className="absolute inset-0 bg-black/40"></div>

                <div className={`absolute top-3 right-3 ${isPremium ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-500/20 text-zinc-300'} text-xs px-2 py-1 rounded font-bold uppercase tracking-widest z-20 backdrop-blur-md`}>
                    {tier}
                </div>

                <div className="relative w-32 h-32 z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                    <Image src={pokemon.image} alt={pokemon.name} fill className="object-contain" />
                </div>
            </div>
            <div className="p-5 relative z-10 bg-zinc-900">
                <h4 className={`text-xl font-bold mb-4 ${pokemon.textColor}`}>{pokemon.name} <span className="text-zinc-500 text-sm">#{tokenId}</span></h4>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Attack</span>
                        <span className="text-red-400 font-mono font-bold">{attack}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((attack / 60) * 100, 100)}%` }} /></div>

                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Defense</span>
                        <span className="text-blue-400 font-mono font-bold">{defense}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((defense / 60) * 100, 100)}%` }} /></div>

                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Speed</span>
                        <span className="text-yellow-400 font-mono font-bold">{speed}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${Math.min((speed / 60) * 100, 100)}%` }} /></div>
                </div>

                <button className={`w-full mt-6 py-2 bg-gradient-to-r ${pokemon.gradient} text-white text-sm font-semibold rounded-lg transition-all hover:brightness-110`}>
                    Stake in Escrow
                </button>
            </div>
        </div>
    );
}

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
                        {Array.from({ length: balance }).map((_, i) => (
                            <PokemonCard key={i} index={i} owner={address as `0x${string}`} />
                        ))}
                    </div>
                </>
            )}

        </div>
    );
}

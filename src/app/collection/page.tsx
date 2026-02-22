'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Swords } from 'lucide-react';
import { CardDefinition, TIER_COLORS, TIER_BORDER_GLOW, getTierConfig, CardTier } from '@/lib/cards';
import { getPlayerCards, OwnedCard } from '@/lib/inventory';

export default function Collection() {
    const { address, isConnected } = useAccount();
    const [cards, setCards] = useState<(OwnedCard & { card: CardDefinition })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTier, setFilterTier] = useState<CardTier | 'all'>('all');

    useEffect(() => {
        if (!address) return;
        setLoading(true);
        getPlayerCards(address).then(data => {
            setCards(data);
            setLoading(false);
        });
    }, [address]);

    const filteredCards = filterTier === 'all' ? cards : cards.filter(c => c.card.tier === filterTier);

    // Calculate collection stats
    const totalValue = cards.reduce((sum, c) => sum + c.card.value, 0);
    const tierCounts: Record<string, number> = {};
    cards.forEach(c => { tierCounts[c.card.tier] = (tierCounts[c.card.tier] || 0) + 1; });

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

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="animate-spin w-12 h-12 text-pink-500 mb-4" />
                    <span className="text-zinc-400">Loading collection...</span>
                </div>
            ) : cards.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto mt-12">
                    <div className="text-6xl mb-6 opacity-50 grayscale">🎒</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Your Bag is Empty</h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                        You don&apos;t own any MonadMons yet! Visit the Poké Mart to claim your free starter, grab daily drops, or mint Premium cards.
                    </p>
                    <Link href="/shop" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                        Go to Poké Mart
                    </Link>
                </div>
            ) : (
                <>
                    {/* ─── Collection Stats Bar ─── */}
                    <div className="flex flex-wrap gap-4 mb-8 items-center">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="font-bold text-white tracking-widest uppercase text-sm">Total Cards:</span>
                            <span className="ml-2 font-mono text-pink-400 text-xl font-bold">{cards.length}</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="font-bold text-white tracking-widest uppercase text-sm">Total Value:</span>
                            <span className="ml-2 font-mono text-amber-400 text-xl font-bold">{totalValue.toLocaleString()}</span>
                            <span className="text-zinc-500 ml-1">pts</span>
                        </div>
                        {Object.entries(tierCounts).map(([tier, count]) => (
                            <div key={tier} className={`px-3 py-2 rounded-lg border text-sm font-bold ${TIER_COLORS[tier as CardTier]}`}>
                                {tier}: {count}
                            </div>
                        ))}
                    </div>

                    {/* ─── Tier Filter ─── */}
                    <div className="flex gap-2 mb-8 flex-wrap">
                        <button
                            onClick={() => setFilterTier('all')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterTier === 'all' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            All ({cards.length})
                        </button>
                        {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as CardTier[]).map(tier => {
                            const count = tierCounts[tier] || 0;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={tier}
                                    onClick={() => setFilterTier(tier)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${filterTier === tier ? TIER_COLORS[tier] : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-transparent'}`}
                                >
                                    {tier} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* ─── Card Grid ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCards.map((owned) => {
                            const card = owned.card;
                            const tierConf = getTierConfig(card.tier);

                            return (
                                <div
                                    key={owned.id}
                                    className={`bg-zinc-900 border rounded-2xl overflow-hidden shadow-lg group hover:scale-[1.02] transform transition-all duration-300 relative ${TIER_BORDER_GLOW[card.tier]}`}
                                >
                                    {/* Card Image */}
                                    <div className={`h-48 bg-gradient-to-tr ${card.color} opacity-80 flex flex-col items-center justify-center relative`}>
                                        <div className="absolute inset-0 bg-black/40" />

                                        <div className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest z-20 backdrop-blur-md border ${TIER_COLORS[card.tier]}`}>
                                            {card.tier} {tierConf.badge}
                                        </div>

                                        <div className="relative w-32 h-32 z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                                            <Image src={card.image} alt={card.name} fill className="object-contain" />
                                        </div>
                                    </div>

                                    {/* Card Details */}
                                    <div className="p-5 relative z-10 bg-zinc-900">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className={`text-xl font-bold ${card.textColor}`}>{card.name}</h4>
                                                <p className="text-zinc-500 text-xs mt-1">{card.type}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-amber-400 font-mono font-bold text-sm">{card.value} pts</span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">HP</span>
                                                <span className="text-emerald-400 font-mono font-bold">{card.maxHp}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((card.maxHp / 360) * 100, 100)}%` }} />
                                            </div>

                                            {/* Moves Preview */}
                                            <div className="flex gap-1 mt-3">
                                                {card.moves.map((m, i) => (
                                                    <span key={i} className={`text-xs px-2 py-1 rounded-md font-bold
                                                        ${m.type === 'attack' ? 'bg-red-500/10 text-red-400' : m.type === 'power' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}
                                                    `}>
                                                        {m.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Acquired info */}
                                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                            <span className="text-xs text-zinc-600 capitalize">
                                                via {owned.acquired_via.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-zinc-600">
                                                {new Date(owned.acquired_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <Link href="/battle" className={`w-full mt-4 py-2 bg-gradient-to-r ${card.color} text-white text-sm font-semibold rounded-lg transition-all hover:brightness-110 flex items-center justify-center gap-2`}>
                                            <Swords className="w-4 h-4" /> Battle with this card
                                        </Link>
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

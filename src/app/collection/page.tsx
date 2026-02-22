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
                <h2 className="text-4xl font-black text-black uppercase bg-[#FF3366] text-white px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-2deg]">Wallet Disconnected</h2>
                <p className="mt-6 text-black font-bold">Please connect to the Monad Testnet to view your collection.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-5xl md:text-6xl font-black mb-8 text-black uppercase tracking-tighter text-center md:text-left drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">My Pokémons</h1>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin h-12 w-12 text-black mb-4 mr-4" />
                    <span className="text-black font-black uppercase tracking-widest text-xl">Loading collection...</span>
                </div>
            ) : cards.length === 0 ? (
                <div className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0_0_#000000] p-12 text-center max-w-2xl mx-auto mt-12 rotate-[1deg]">
                    <div className="text-6xl mb-6 grayscale drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">🎒</div>
                    <h2 className="text-3xl font-black text-black mb-4 uppercase">Your Bag is Empty</h2>
                    <p className="text-black font-bold mb-8 max-w-md mx-auto">
                        You don't own any cards yet! Visit the Poké Mart to claim your free starter, grab daily drops, or mint Premium cards.
                    </p>
                    <Link href="/shop" className="neo-button inline-block px-8 py-4 bg-[#33CCFF] text-black uppercase tracking-widest text-lg">
                        Go to Poké Mart
                    </Link>
                </div>
            ) : (
                <>
                    {/* ─── Collection Stats Bar ─── */}
                    <div className="flex flex-wrap gap-4 mb-8 items-center bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_#000000] rotate-[-1deg] justify-center md:justify-start">
                        <div className="flex items-center">
                            <span className="font-black text-black uppercase tracking-widest text-sm mr-2">Total Cards:</span>
                            <span className="bg-[#FF3366] text-white px-3 py-1 border-2 border-black font-mono text-lg font-black shadow-[2px_2px_0_0_#000000]">{cards.length}</span>
                        </div>
                        <div className="flex items-center ml-4">
                            <span className="font-black text-black uppercase tracking-widest text-sm mr-2">Total Value:</span>
                            <span className="bg-[#FFCC00] text-black px-3 py-1 border-2 border-black font-mono text-lg font-black shadow-[2px_2px_0_0_#000000]">{totalValue.toLocaleString()} pts</span>
                        </div>
                    </div>

                    {/* ─── Tier Filter ─── */}
                    <div className="flex gap-4 mb-12 flex-wrap justify-center md:justify-start">
                        <button
                            onClick={() => setFilterTier('all')}
                            className={`px-6 py-2 font-black uppercase tracking-widest border-4 border-black transition-all ${filterTier === 'all' ? 'bg-[#33CCFF] text-black shadow-[4px_4px_0_0_#000000] translate-y-[-2px]' : 'bg-white text-black hover:bg-gray-100'}`}
                        >
                            All ({cards.length})
                        </button>
                        {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Premium'] as CardTier[]).map(tier => {
                            const count = tierCounts[tier] || 0;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={tier}
                                    onClick={() => setFilterTier(tier)}
                                    className={`px-6 py-2 font-black uppercase tracking-widest border-4 border-black transition-all ${filterTier === tier ? 'bg-[#FF3366] text-white shadow-[4px_4px_0_0_#000000] translate-y-[-2px]' : 'bg-white text-black hover:bg-gray-100'}`}
                                >
                                    {tier} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* ─── Card Grid ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center">
                        {filteredCards.map((owned) => {
                            const card = owned.card;
                            const tierConf = getTierConfig(card.tier);

                            let bgGradient = 'bg-gray-200';
                            if (card.type.includes('Fire')) bgGradient = 'bg-[#FF3366]';
                            else if (card.type.includes('Water')) bgGradient = 'bg-[#33CCFF]';
                            else if (card.type.includes('Grass')) bgGradient = 'bg-[#34c759]';
                            else if (card.type.includes('Electric')) bgGradient = 'bg-[#FFCC00]';

                            return (
                                <div
                                    key={owned.id}
                                    className={`neo-card w-full max-w-[320px] overflow-hidden group hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#000000] transition-all duration-300 relative bg-white flex flex-col`}
                                >
                                    {/* Card Image */}
                                    <div className={`h-48 ${bgGradient} flex flex-col items-center justify-center relative border-b-4 border-black`}>
                                        <div className={`absolute top-4 right-4 z-20 text-xs px-2 py-1 font-black uppercase tracking-widest border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000000]`}>
                                            {card.tier} {tierConf.badge}
                                        </div>

                                        <div className="relative w-32 h-32 z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                            <Image src={card.image} alt={card.name} fill className="object-contain" />
                                        </div>
                                    </div>

                                    {/* Card Details */}
                                    <div className="p-5 flex-grow relative z-10 bg-white flex flex-col">
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <div>
                                                <h4 className={`text-2xl font-black text-black uppercase tracking-wide leading-tight`}>{card.name}</h4>
                                                <p className="text-black font-bold uppercase tracking-widest text-xs mt-1 border-2 border-black inline-block px-1 bg-gray-100">{card.type}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-black bg-[#FFCC00] px-2 py-1 border-2 border-black font-mono font-black text-xs shadow-[2px_2px_0_0_#000000] uppercase block mb-1">Val: {card.value}</span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="space-y-4 font-bold text-black border-4 border-black p-3 bg-[#fdfaf6] shadow-[4px_4px_0_0_#000000] mb-6 flex-grow">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-sm uppercase">
                                                    <span>HP</span>
                                                    <span className="font-mono text-lg">{card.maxHp}</span>
                                                </div>
                                                <div className="w-full bg-white border-2 border-black h-4"><div className="bg-[#34c759] h-full border-r-2 border-black" style={{ width: `${Math.min((card.maxHp / 360) * 100, 100)}%` }} /></div>
                                            </div>

                                            {/* Moves Preview */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {card.moves.map((m, i) => {
                                                    let colorClass = 'bg-white text-black';
                                                    if (m.type === 'attack') colorClass = 'bg-[#FF3366] text-white';
                                                    else if (m.type === 'power') colorClass = 'bg-[#FFCC00] text-black';
                                                    else colorClass = 'bg-[#33CCFF] text-black';

                                                    return (
                                                        <span key={i} className={`text-xs px-2 py-1 border-2 border-black font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000000] ${colorClass}`}>
                                                            {m.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Acquired info */}
                                        <div className="flex justify-between items-center mb-4 uppercase text-xs font-black tracking-widest text-gray-500 border-2 border-dashed border-gray-300 p-2">
                                            <span>VIA: {owned.acquired_via.replace('_', ' ')}</span>
                                            <span>{new Date(owned.acquired_at).toLocaleDateString()}</span>
                                        </div>

                                        <Link href="/battle" className={`neo-button w-full py-4 bg-white text-black text-sm uppercase tracking-widest text-center flex items-center justify-center gap-2 mt-auto`}>
                                            <Swords className="w-5 h-5" /> TAKE TO ARENA
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

'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { GlareCard } from '@/components/ui/glare-card';
import { Loader2, Gift, ShoppingBag, Clock, CheckCircle, Star } from 'lucide-react';
import { CARD_CATALOG, getShopCards, getDailyClaimableCards, TIER_COLORS, getTierConfig, CardDefinition } from '@/lib/cards';
import { buyCard, claimDailyCard, giveStarterCard, canClaimDaily, getPlayerCards } from '@/lib/inventory';

const MonadMonsABI = [
    { "inputs": [{ "internalType": "uint8", "name": "_speciesId", "type": "uint8" }], "name": "mintStarter", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint8", "name": "_speciesId", "type": "uint8" }], "name": "claimDaily", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint8", "name": "_speciesId", "type": "uint8" }], "name": "buyCard", "outputs": [], "stateMutability": "payable", "type": "function" }
];

const MONAD_MONS_ADDRESS = '0xdcB7bD581BABF76ea8530E11b00E29988032Bea8';

export default function Shop() {
    const { isConnected, address } = useAccount();
    const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

    const [buyingCard, setBuyingCard] = useState<string | null>(null);
    const [buyResult, setBuyResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [claimingDaily, setClaimingDaily] = useState(false);
    const [dailyResult, setDailyResult] = useState<{ type: 'success' | 'error'; message: string; card?: CardDefinition } | null>(null);
    const [dailyAvailable, setDailyAvailable] = useState(true);
    const [nextClaimTime, setNextClaimTime] = useState<string | null>(null);
    const [claimingStarter, setClaimingStarter] = useState(false);
    const [starterResult, setStarterResult] = useState<{ type: 'success' | 'error'; message: string; card?: CardDefinition } | null>(null);
    const [hasCards, setHasCards] = useState<boolean | null>(null);

    const shopCards = getShopCards();

    // Check daily claim availability and starter eligibility
    useEffect(() => {
        if (!address) return;

        canClaimDaily(address).then(({ canClaim, nextClaimAt }) => {
            setDailyAvailable(canClaim);
            setNextClaimTime(nextClaimAt || null);
        });

        getPlayerCards(address).then(cards => {
            setHasCards(cards.length > 0);
        });
    }, [address, buyResult, dailyResult, starterResult]);

    const handleBuyFromShop = async (card: CardDefinition) => {
        if (!address || buyingCard) return;
        setBuyingCard(card.id);
        setBuyResult(null);

        const result = await buyCard(address, card.id);

        if (result.success) {
            setBuyResult({ type: 'success', message: `${card.name} (${card.tier}) has been added to your collection!` });
        } else {
            setBuyResult({ type: 'error', message: result.error || 'Failed to purchase card.' });
        }
        setBuyingCard(null);
    };

    const handleClaimDaily = async () => {
        if (!address || claimingDaily) return;
        setClaimingDaily(true);
        setDailyResult(null);

        const result = await claimDailyCard(address);

        if (result.success && result.card) {
            setDailyResult({ type: 'success', message: `You received ${result.card.name} (${result.card.tier})!`, card: result.card });
            setDailyAvailable(false);
        } else {
            setDailyResult({ type: 'error', message: result.error || 'Failed to claim daily card.' });
        }
        setClaimingDaily(false);
    };

    const handleClaimStarter = async () => {
        if (!address || claimingStarter) return;
        setClaimingStarter(true);
        setStarterResult(null);

        const result = await giveStarterCard(address);

        if (result.success && result.card) {
            setStarterResult({ type: 'success', message: `Welcome! You received ${result.card.name} as your starter!`, card: result.card });
            setHasCards(true);
        } else {
            setStarterResult({ type: 'error', message: result.error || 'Failed to claim starter.' });
        }
        setClaimingStarter(false);
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Please Connect Wallet</h2>
                <p className="mt-4 text-zinc-400">You must be connected to the Monad Testnet to access the Shop.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent text-center">
                Poké Mart
            </h1>
            <p className="text-zinc-400 mb-8 text-center text-lg max-w-2xl mx-auto">
                Acquire cards through the shop, daily claims, or earn your starter. Use them to battle in the Arena!
            </p>

            {/* ─── Notification Banners ─── */}
            {buyResult && (
                <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-xl font-medium text-center shadow-lg border ${buyResult.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {buyResult.type === 'success' ? <CheckCircle className="inline w-5 h-5 mr-2" /> : null}
                    {buyResult.message}
                </div>
            )}
            {dailyResult && (
                <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-xl font-medium text-center shadow-lg border ${dailyResult.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {dailyResult.type === 'success' ? <Gift className="inline w-5 h-5 mr-2" /> : null}
                    {dailyResult.message}
                </div>
            )}
            {starterResult && (
                <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-xl font-medium text-center shadow-lg border ${starterResult.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
                    {starterResult.message}
                </div>
            )}

            {/* ─── Starter Pack + Daily Claim Section ─── */}
            <div className="flex flex-col md:flex-row justify-center gap-8 mb-16 max-w-4xl mx-auto">
                {/* Starter Pack */}
                <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 text-center backdrop-blur-md">
                    <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <Star className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Starter Pack</h3>
                    <p className="text-zinc-500 mb-4 text-sm">New here? Claim a free Pikachu to start your journey!</p>
                    <div className="text-xs text-zinc-600 mb-4 font-mono">Tier: Common • Value: 100 pts</div>
                    <button
                        onClick={handleClaimStarter}
                        disabled={claimingStarter || hasCards === true}
                        className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {claimingStarter ? <Loader2 className="animate-spin inline w-5 h-5" /> : hasCards ? 'Already Claimed' : 'Free Claim'}
                    </button>
                </div>

                {/* Daily Drop */}
                <div className="flex-1 bg-zinc-900/50 border border-purple-500/20 rounded-3xl p-8 text-center backdrop-blur-md">
                    <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <Gift className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-purple-400">Daily Drop</h3>
                    <p className="text-zinc-500 mb-4 text-sm">Claim a free random card every 24 hours!</p>
                    <div className="text-xs text-zinc-600 mb-4 font-mono">Pool: Common & Uncommon cards</div>
                    {!dailyAvailable && nextClaimTime && (
                        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-4">
                            <Clock className="w-4 h-4" />
                            <span>Next claim: {new Date(nextClaimTime).toLocaleTimeString()}</span>
                        </div>
                    )}
                    <button
                        onClick={handleClaimDaily}
                        disabled={claimingDaily || !dailyAvailable}
                        className="px-8 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {claimingDaily ? <Loader2 className="animate-spin inline w-5 h-5" /> : dailyAvailable ? 'Claim Daily' : 'Claimed Today'}
                    </button>
                </div>
            </div>

            {/* ─── Premium Shop Section ─── */}
            <div className="border-t border-white/10 pt-12">
                <h2 className="text-3xl font-black text-center mb-2 text-white">Premium Shop</h2>
                <p className="text-zinc-400 text-center mb-10 max-w-xl mx-auto">
                    Purchase powerful cards with MON. Higher tiers have stronger stats and greater battle value.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 place-items-center">
                    {shopCards.map((card) => {
                        const tierConf = getTierConfig(card.tier);
                        return (
                            <div key={card.id} className="flex flex-col items-center w-full max-w-[280px]">
                                <div className="w-full relative mb-4">
                                    <GlareCard className="flex flex-col items-center justify-center px-6 py-6">
                                        <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-b from-transparent to-black rounded-[48px]" />

                                        {/* Tier Badge */}
                                        <div className={`absolute top-4 right-4 z-20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest backdrop-blur-md border ${TIER_COLORS[card.tier]}`}>
                                            {card.tier}
                                        </div>

                                        <h3 className={`text-2xl font-bold mb-1 z-10 ${card.textColor}`}>{card.name}</h3>
                                        <p className="text-white/60 text-xs tracking-widest uppercase font-bold mb-4 z-10">{card.type}</p>

                                        <div className="relative w-full aspect-square z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500">
                                            <Image
                                                src={card.image}
                                                alt={card.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 280px"
                                                className="object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]"
                                            />
                                        </div>

                                        <div className="absolute bottom-4 w-full text-center z-10 space-y-1">
                                            <p className="text-white/80 font-mono font-bold text-sm">{tierConf.badge} HP: {card.maxHp}</p>
                                            <p className="text-zinc-400 text-xs">Value: {card.value} pts</p>
                                        </div>
                                    </GlareCard>
                                </div>

                                <button
                                    disabled={buyingCard === card.id}
                                    onClick={() => handleBuyFromShop(card)}
                                    className={`w-full py-3 rounded-xl font-bold bg-gradient-to-r ${card.color} text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg text-sm`}
                                >
                                    {buyingCard === card.id ? <Loader2 className="animate-spin inline w-5 h-5" /> : `Buy (${card.shopPrice} MON)`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── How to Get Cards Guide ─── */}
            <div className="mt-20 max-w-4xl mx-auto bg-zinc-900/50 border border-white/5 rounded-3xl p-10 backdrop-blur-md">
                <h3 className="text-2xl font-bold text-white text-center mb-8">Ways to Get Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-4xl mb-3">🏪</div>
                        <h4 className="font-bold text-white mb-2">Shop</h4>
                        <p className="text-zinc-500 text-sm">Buy cards directly with MON. Higher tiers cost more but have stronger stats.</p>
                    </div>
                    <div>
                        <div className="text-4xl mb-3">🎁</div>
                        <h4 className="font-bold text-white mb-2">Daily Claims</h4>
                        <p className="text-zinc-500 text-sm">Claim a free random Common or Uncommon card every 24 hours.</p>
                    </div>
                    <div>
                        <div className="text-4xl mb-3">⚔️</div>
                        <h4 className="font-bold text-white mb-2">Win Battles</h4>
                        <p className="text-zinc-500 text-sm">Defeat opponents in the Arena and claim their staked card as your prize!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Loader2, Gift, ShoppingBag, Clock, CheckCircle, Star } from 'lucide-react';
import { CARD_CATALOG, getShopCards, getDailyClaimableCards, TIER_COLORS, getTierConfig, CardDefinition } from '@/lib/cards';
import { buyCard, claimDailyCard, giveStarterCard, canClaimDaily, getPlayerCards } from '@/lib/inventory';

const MonadMonsABI = [
    { "inputs": [{ "internalType": "uint8", "name": "_speciesId", "type": "uint8" }], "name": "mintStarter", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint8", "name": "_speciesId", "type": "uint8" }], "name": "claimDaily", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint8", "name": "_speciesId", "type": "uint8" }], "name": "buyCard", "outputs": [], "stateMutability": "payable", "type": "function" }
];

const MONAD_MONS_ADDRESS = '0xdcB7bD581BABF76ea8530E11b00E29988032Bea8'; // Updated to new deployment

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
                <h2 className="text-4xl font-black text-black uppercase bg-[#FF3366] text-white px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-2deg]">Please Connect Wallet</h2>
                <p className="mt-6 text-black font-bold">You must be connected to the Monad Testnet to access the Shop.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-5xl md:text-7xl font-black mb-4 text-black uppercase tracking-tighter text-center drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                Poké Mart
            </h1>
            <p className="text-black font-bold mb-8 text-center text-lg max-w-2xl mx-auto border-b-4 border-black pb-4">
                Acquire cards through the shop, daily claims, or earn your starter. Use them to battle in the Arena!
            </p>

            {/* ─── Notification Banners ─── */}
            {buyResult && (
                <div className={`max-w-3xl mx-auto mb-8 p-4 border-4 border-black font-black text-center shadow-[4px_4px_0_0_#000000] uppercase tracking-wide ${buyResult.type === 'success' ? 'bg-[#34c759] text-black' : 'bg-[#FF3366] text-white'}`}>
                    {buyResult.type === 'success' ? <CheckCircle className="inline w-6 h-6 mr-2" /> : null}
                    {buyResult.message}
                </div>
            )}
            {dailyResult && (
                <div className={`max-w-3xl mx-auto mb-8 p-4 border-4 border-black font-black text-center shadow-[4px_4px_0_0_#000000] uppercase tracking-wide ${dailyResult.type === 'success' ? 'bg-[#34c759] text-black' : 'bg-[#FF3366] text-white'}`}>
                    {dailyResult.type === 'success' ? <Gift className="inline w-6 h-6 mr-2" /> : null}
                    {dailyResult.message}
                </div>
            )}
            {starterResult && (
                <div className={`max-w-3xl mx-auto mb-8 p-4 border-4 border-black font-black text-center shadow-[4px_4px_0_0_#000000] uppercase tracking-wide ${starterResult.type === 'success' ? 'bg-[#34c759] text-black' : 'bg-[#FFCC00] text-black'}`}>
                    {starterResult.message}
                </div>
            )}

            {/* ─── Starter Pack + Daily Claim Section ─── */}
            <div className="flex flex-col md:flex-row justify-center gap-12 mb-24 max-w-4xl mx-auto mt-16">
                {/* Starter Pack */}
                <div className="flex flex-col items-center w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000000] rotate-[-1deg] hover:rotate-0 transition-transform">
                    <div className="w-20 h-20 mb-4 bg-[#34c759] border-4 border-black shadow-[4px_4px_0_0_#000000] flex items-center justify-center">
                        <Star className="w-10 h-10 text-black" />
                    </div>
                    <h3 className="text-3xl font-black mb-2 text-black uppercase">Starter Pack</h3>
                    <p className="text-black font-bold mb-4 text-sm text-center">New here? Claim a free Common Pikachu to start your journey!</p>
                    <div className="text-sm font-black text-black bg-white border-2 border-black px-2 shadow-[2px_2px_0_0_#000000] mb-6 inline-block uppercase tracking-widest">
                        Tier: Common • Value: 100 pts
                    </div>
                    <button
                        onClick={handleClaimStarter}
                        disabled={claimingStarter || hasCards === true}
                        className="neo-button w-full px-8 py-4 bg-[#33CCFF] text-black text-lg uppercase tracking-wide disabled:opacity-50"
                    >
                        {claimingStarter ? <Loader2 className="animate-spin inline w-6 h-6" /> : hasCards ? 'ALREADY CLAIMED' : 'FREE CLAIM'}
                    </button>
                </div>

                {/* Daily Drop */}
                <div className="flex flex-col items-center w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000000] rotate-[1deg] hover:rotate-0 transition-transform mt-8 md:mt-0">
                    <div className="w-20 h-20 mb-4 bg-[#FFCC00] border-4 border-black shadow-[4px_4px_0_0_#000000] flex items-center justify-center">
                        <Gift className="w-10 h-10 text-black" />
                    </div>
                    <h3 className="text-3xl font-black mb-2 text-black uppercase">Daily Drop</h3>
                    <p className="text-black font-bold mb-4 text-sm text-center">Claim a free random card every 24 hours!</p>
                    <div className="text-sm font-black text-black bg-white border-2 border-black px-2 shadow-[2px_2px_0_0_#000000] mb-6 inline-block uppercase tracking-widest">
                        Pool: Common & Uncommon
                    </div>

                    {!dailyAvailable && nextClaimTime && (
                        <div className="flex items-center justify-center gap-2 text-black font-bold text-sm mb-4 border-2 border-dashed border-black px-4 py-2 bg-gray-100">
                            <Clock className="w-4 h-4" />
                            <span>Next: {new Date(nextClaimTime).toLocaleTimeString()}</span>
                        </div>
                    )}
                    <button
                        onClick={handleClaimDaily}
                        disabled={claimingDaily || !dailyAvailable}
                        className="neo-button w-full px-8 py-4 bg-[#FF3366] text-white text-lg uppercase tracking-wide disabled:opacity-50"
                    >
                        {claimingDaily ? <Loader2 className="animate-spin inline w-6 h-6" /> : dailyAvailable ? 'CLAIM DAILY' : 'CLAIMED TODAY'}
                    </button>
                </div>
            </div>

            {/* ─── Premium Shop Section ─── */}
            <div className="border-t-8 border-black pt-16">
                <h2 className="text-5xl font-black text-center mb-6 text-black uppercase tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">Premium Shop</h2>
                <div className="bg-[#FFCC00] border-4 border-black shadow-[4px_4px_0_0_#000000] rounded-none p-4 max-w-3xl mx-auto mb-16 text-center text-black font-bold text-sm rotate-[1deg]">
                    <span className="font-black bg-white px-2 py-1 border-2 border-black mr-2 uppercase tracking-widest shadow-[2px_2px_0_0_#000000]">INFO:</span>
                    Purchase powerful cards with MON. Higher tiers have stronger stats and greater battle value.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 place-items-center">
                    {shopCards.map((card) => {
                        const tierConf = getTierConfig(card.tier);

                        // Pick a color based on type for Neo-Brutalism
                        let bgGradient = 'bg-gray-200';
                        if (card.type.includes('Fire')) bgGradient = 'bg-[#FF3366]';
                        else if (card.type.includes('Water')) bgGradient = 'bg-[#33CCFF]';
                        else if (card.type.includes('Grass')) bgGradient = 'bg-[#34c759]';
                        else if (card.type.includes('Electric')) bgGradient = 'bg-[#FFCC00]';

                        return (
                            <div key={card.id} className="flex flex-col items-center w-full max-w-[320px]">
                                <div className="w-full relative mb-6">
                                    <div className={`neo-card flex flex-col items-center justify-center px-6 py-8 ${bgGradient} hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#000000] transition-all`}>

                                        <div className={`absolute top-4 right-4 z-20 text-xs px-2 py-1 font-black uppercase tracking-widest border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000000]`}>
                                            {card.tier}
                                        </div>

                                        <h3 className={`text-3xl font-black mb-1 z-10 text-black uppercase tracking-wider drop-shadow-[2px_2px_0_#ffffff]`}>{card.name}</h3>
                                        <p className="text-black bg-white border-2 border-black px-3 text-sm tracking-widest uppercase font-bold mb-8 z-10 shadow-[2px_2px_0_0_#000000]">{card.type}</p>

                                        <div className="relative w-full aspect-square z-10 hover:scale-110 transition-transform duration-300">
                                            <Image
                                                src={card.image}
                                                alt={card.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 320px"
                                                className="object-contain filter drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
                                            />
                                        </div>

                                        <div className="absolute bottom-6 w-full text-center z-10 flex flex-col items-center space-y-2">
                                            <p className="text-black bg-white border-2 border-black px-4 py-1 inline-block font-mono font-black text-lg shadow-[2px_2px_0_0_#000000]">{tierConf.badge} HP: {card.maxHp}</p>
                                            <p className="text-black bg-white font-bold text-xs uppercase tracking-widest border-2 border-black px-2 shadow-[2px_2px_0_0_#000000]">Value: {card.value} pts</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={buyingCard === card.id}
                                    onClick={() => handleBuyFromShop(card)}
                                    className="neo-button w-full py-4 bg-white text-black text-xl disabled:opacity-50 uppercase tracking-widest flex items-center justify-center"
                                >
                                    {buyingCard === card.id ? <Loader2 className="animate-spin inline w-6 h-6" /> : `BUY FOR ${card.shopPrice} MON`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

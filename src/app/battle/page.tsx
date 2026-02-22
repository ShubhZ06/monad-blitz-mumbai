'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { Shield, Swords, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CardDefinition, Move, TIER_COLORS, TIER_BORDER_GLOW, getTierConfig } from '@/lib/cards';
import { getPlayerCards, transferCard, OwnedCard } from '@/lib/inventory';
import Link from 'next/link';

type Phase = 'JOIN' | 'SELECT_CARD' | 'WAITING' | 'BATTLE' | 'RESULT';

export default function BattleLobby() {
    const { address, isConnected } = useAccount();
    const [phase, setPhase] = useState<Phase>('JOIN');
    const [roomCode, setRoomCode] = useState('');
    const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
    const isPlayer1Ref = useRef(false);

    // Owned cards for selection
    const [ownedCards, setOwnedCards] = useState<(OwnedCard & { card: CardDefinition })[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [selectedOwnedCard, setSelectedOwnedCard] = useState<(OwnedCard & { card: CardDefinition }) | null>(null);

    // Battle state
    const [myCard, setMyCard] = useState<CardDefinition | null>(null);
    const [myOwnedCardId, setMyOwnedCardId] = useState<string | null>(null);
    const [opponentCard, setOpponentCard] = useState<CardDefinition | null>(null);
    const [myHp, setMyHp] = useState(0);
    const [opponentHp, setOpponentHp] = useState(0);
    const [myShield, setMyShield] = useState(0);
    const [opponentShield, setOpponentShield] = useState(0);
    const [winner, setWinner] = useState<'me' | 'opponent' | 'draw' | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [myMoveSubmitted, setMyMoveSubmitted] = useState(false);
    const [opponentMoveSubmitted, setOpponentMoveSubmitted] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [transferDone, setTransferDone] = useState(false);
    const [wonCardName, setWonCardName] = useState<string | null>(null);

    const logEndRef = useRef<HTMLDivElement>(null);
    const isResolvingRef = useRef(false);
    const myMoveSubmittedRef = useRef(false);
    const opponentCardRef = useRef<CardDefinition | null>(null);

    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [battleLog]);

    // Load player's owned cards when entering card selection
    useEffect(() => {
        if (phase === 'SELECT_CARD' && address) {
            setLoadingCards(true);
            getPlayerCards(address).then(cards => {
                setOwnedCards(cards);
                setLoadingCards(false);
            });
        }
    }, [phase, address]);

    // Supabase subscription
    useEffect(() => {
        if (!roomCode || phase === 'JOIN' || phase === 'SELECT_CARD') return;

        const channel = supabase.channel(`room:${roomCode}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomCode}` }, (payload) => {
                const newData = payload.new as any;
                if (!newData) return;
                syncStateWithDB(newData);
            })
            .subscribe();

        supabase.from('rooms').select('*').eq('id', roomCode).single().then(({ data }) => {
            if (data) syncStateWithDB(data);
        });

        return () => { supabase.removeChannel(channel); };
    }, [roomCode, phase, isPlayer1]);

    const syncStateWithDB = (data: any) => {
        if (!data) return;

        const p1Card = data.player1_card;
        const p2Card = data.player2_card;
        const amP1 = isPlayer1Ref.current; // Use ref to avoid stale closure

        if (p1Card && p2Card && data.status === 'battle') {
            setPhase('BATTLE');
        }

        if (amP1) {
            if (p2Card && !opponentCardRef.current) { setOpponentCard(p2Card); opponentCardRef.current = p2Card; }
            setMyHp(data.player1_hp); setOpponentHp(data.player2_hp);
            setMyShield(data.player1_shield); setOpponentShield(data.player2_shield);
            if (data.winner === 'player1') { setWinner('me'); setPhase('RESULT'); }
            else if (data.winner === 'player2') { setWinner('opponent'); setPhase('RESULT'); }
            else if (data.winner === 'draw') { setWinner('draw'); setPhase('RESULT'); }
        } else {
            if (p1Card && !opponentCardRef.current) { setOpponentCard(p1Card); opponentCardRef.current = p1Card; }
            setMyHp(data.player2_hp); setOpponentHp(data.player1_hp);
            setMyShield(data.player2_shield); setOpponentShield(data.player1_shield);
            if (data.winner === 'player2') { setWinner('me'); setPhase('RESULT'); }
            else if (data.winner === 'player1') { setWinner('opponent'); setPhase('RESULT'); }
            else if (data.winner === 'draw') { setWinner('draw'); setPhase('RESULT'); }
        }

        setBattleLog(data.action_log || []);

        const oppMove = amP1 ? data.player2_move : data.player1_move;
        setOpponentMoveSubmitted(!!oppMove);

        if (data.player1_move && data.player2_move && amP1 && !isResolvingRef.current) {
            isResolvingRef.current = true;
            setResolving(true);
            resolveRound(data);
        }

        if (!data.player1_move && !data.player2_move && myMoveSubmittedRef.current) {
            setMyMoveSubmitted(false);
            myMoveSubmittedRef.current = false;
            setOpponentMoveSubmitted(false);
            setResolving(false);
            isResolvingRef.current = false;
        }
    };

    const applyMove = (move: Move, attackerCard: CardDefinition, isAttackerP1: boolean, p1Hp: number, p2Hp: number, p1Shield: number, p2Shield: number) => {
        let logEntry = `${isAttackerP1 ? 'P1' : 'P2'} (${attackerCard.name}) used ${move.name}!`;

        if (move.type === 'defense') {
            if (move.description?.includes('Heals') || move.description?.includes('Recover')) {
                if (isAttackerP1) p1Hp = Math.min(attackerCard.maxHp, p1Hp + move.value);
                else p2Hp = Math.min(attackerCard.maxHp, p2Hp + move.value);
                logEntry += ` Recovered HP.`;
            } else {
                if (isAttackerP1) p1Shield = move.value; else p2Shield = move.value;
                logEntry += ` Gained Shield.`;
            }
        } else {
            const rawDamage = Math.floor(move.value * (0.8 + Math.random() * 0.4));
            let actualDamage = rawDamage;
            if (isAttackerP1) {
                if (actualDamage >= p2Shield && p2Shield > 0) { actualDamage -= p2Shield; p2Shield = 0; logEntry += ` Shield broke!`; }
                else if (p2Shield > 0) { p2Shield -= actualDamage; actualDamage = 0; logEntry += ` Blocked.`; }
                if (actualDamage > 0) { p2Hp = Math.max(0, p2Hp - actualDamage); logEntry += ` Dealt ${actualDamage} DMG.`; }
            } else {
                if (actualDamage >= p1Shield && p1Shield > 0) { actualDamage -= p1Shield; p1Shield = 0; logEntry += ` Shield broke!`; }
                else if (p1Shield > 0) { p1Shield -= actualDamage; actualDamage = 0; logEntry += ` Blocked.`; }
                if (actualDamage > 0) { p1Hp = Math.max(0, p1Hp - actualDamage); logEntry += ` Dealt ${actualDamage} DMG.`; }
            }
        }
        return { p1Hp, p2Hp, p1Shield, p2Shield, logEntry };
    };

    const resolveRound = async (data: any) => {
        const p1Move = data.player1_move as Move;
        const p2Move = data.player2_move as Move;
        const p1Card = data.player1_card as CardDefinition;
        const p2Card = data.player2_card as CardDefinition;
        let logs = [...(data.action_log || []), `--- ROUND ---`];

        let res = applyMove(p1Move, p1Card, true, data.player1_hp, data.player2_hp, data.player1_shield, data.player2_shield);
        logs.push(res.logEntry);

        let res2 = applyMove(p2Move, p2Card, false, res.p1Hp, res.p2Hp, res.p1Shield, res.p2Shield);
        logs.push(res2.logEntry);

        let winnerDB: string | null = null;
        if (res2.p1Hp <= 0 && res2.p2Hp <= 0) winnerDB = 'draw';
        else if (res2.p1Hp <= 0) winnerDB = 'player2';
        else if (res2.p2Hp <= 0) winnerDB = 'player1';

        await supabase.from('rooms').update({
            player1_hp: res2.p1Hp, player2_hp: res2.p2Hp,
            player1_shield: res2.p1Shield, player2_shield: res2.p2Shield,
            player1_move: null, player2_move: null,
            action_log: logs,
            winner: winnerDB,
            status: winnerDB ? 'finished' : 'battle'
        }).eq('id', roomCode);
    };

    const confirmCardSelection = async () => {
        if (!selectedOwnedCard) return;
        const card = selectedOwnedCard.card;
        setMyCard(card);
        setMyOwnedCardId(selectedOwnedCard.id);
        setMyHp(card.maxHp);
        setMyShield(0);

        const { data: room } = await supabase.from('rooms').select('*').eq('id', roomCode).single();

        if (!room) {
            // I am Player 1
            isPlayer1Ref.current = true;
            setIsPlayer1(true);

            const initLog = [`Room created. ${card.name} (${card.tier}) enters the arena. Waiting for Player 2...`];
            setBattleLog(initLog); // Show immediately in UI

            const { error } = await supabase.from('rooms').insert({
                id: roomCode,
                player1_address: address,
                player1_card: card,
                player1_hp: card.maxHp,
                player1_shield: 0,
                status: 'waiting',
                action_log: initLog
            });

            if (error) {
                console.error('Failed to create room:', error);
                setBattleLog([`Error creating room: ${error.message}`]);
                return;
            }

            // Phase change AFTER successful insert so subscription sees the room
            setPhase('WAITING');
        } else {
            // I am Player 2
            isPlayer1Ref.current = false;
            setIsPlayer1(false);

            const logs = [...(room.action_log || []), `Player 2 joined with ${card.name} (${card.tier})! Match starts.`];
            setBattleLog(logs); // Show immediately in UI

            // Set opponent card from existing room data
            if (room.player1_card) {
                setOpponentCard(room.player1_card);
                opponentCardRef.current = room.player1_card;
                setOpponentHp(room.player1_hp || 0);
            }

            const { error } = await supabase.from('rooms').update({
                player2_address: address,
                player2_card: card,
                player2_hp: card.maxHp,
                player2_shield: 0,
                status: 'battle',
                action_log: logs
            }).eq('id', roomCode);

            if (error) {
                console.error('Failed to join room:', error);
                setBattleLog([`Error joining room: ${error.message}`]);
                return;
            }

            // Phase change AFTER successful update
            setPhase('BATTLE');
        }
    };

    const submitMove = async (move: Move) => {
        if (myMoveSubmittedRef.current || !myCard || !opponentCardRef.current) return;
        setMyMoveSubmitted(true);
        myMoveSubmittedRef.current = true;
        const field = isPlayer1Ref.current ? 'player1_move' : 'player2_move';
        await supabase.from('rooms').update({ [field]: move }).eq('id', roomCode);
    };

    // Handle card transfer after battle
    const handlePostBattle = async () => {
        if (transferDone || !roomCode || !address) return;
        setTransferring(true);

        try {
            const { data: room } = await supabase.from('rooms').select('*').eq('id', roomCode).single();
            if (!room) { setTransferring(false); return; }

            const iAmP1 = isPlayer1Ref.current;
            const iWon = winner === 'me';

            if (iWon && room.winner !== 'draw') {
                const loserAddress = iAmP1 ? room.player2_address : room.player1_address;
                const loserCard = iAmP1 ? room.player2_card : room.player1_card;

                if (loserAddress && loserCard) {
                    // Find the loser's owned card record by address and card_id
                    const { data: loserOwnedCards } = await supabase
                        .from('player_cards')
                        .select('id')
                        .eq('owner_address', String(loserAddress).toLowerCase())
                        .eq('card_id', loserCard.id)
                        .limit(1);

                    if (loserOwnedCards && loserOwnedCards.length > 0) {
                        const result = await transferCard(loserOwnedCards[0].id, loserAddress, address);
                        if (result.success) {
                            setWonCardName(loserCard?.name || 'Unknown');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Transfer error:', err);
        }

        setTransferDone(true);
        setTransferring(false);
    };

    // Auto-trigger card transfer when result is shown
    useEffect(() => {
        if (phase === 'RESULT' && !transferDone) {
            handlePostBattle();
        }
    }, [phase]);

    if (!isConnected) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <h2 className="text-4xl font-black text-black uppercase bg-[#FF3366] text-white px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-2deg]">Wallet Disconnected</h2>
            <p className="mt-6 text-black font-bold">Connect your wallet to enter the battlefield.</p>
        </div>
    );

    // ─── PHASE: JOIN ROOM ───
    if (phase === 'JOIN') {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center relative z-10">
                <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center mb-8 shadow-[8px_8px_0_0_#000000] rotate-[5deg]">
                    <Swords className="text-black w-10 h-10" />
                </div>

                <h1 className="text-6xl font-black mb-4 text-center text-black uppercase tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">Enter the Arena</h1>
                <p className="text-black font-bold text-center mb-12 max-w-lg text-lg border-b-4 border-black pb-4">Stake your card in the Escrow. The victor of the battle claims the opponent's card.</p>

                <div className="w-full bg-[#FFCC00] p-10 border-4 border-black flex flex-col md:flex-row gap-8 items-center shadow-[16px_16px_0_0_#000000] relative overflow-hidden rotate-[-1deg]">
                    {/* JOIN COLUMN */}
                    <div className="flex-1 w-full space-y-4 relative z-10">
                        <label className="text-sm font-black text-black uppercase tracking-widest bg-white border-2 border-black px-2 shadow-[2px_2px_0_0_#000000]">Join Private Room</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="XXXX"
                                className="bg-white border-4 border-black px-4 py-4 w-full text-center text-3xl font-black font-mono tracking-widest text-black uppercase focus:outline-none focus:ring-0 shadow-[4px_4px_0_0_#000000]"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            />
                            <button
                                onClick={() => { if (roomCode.length === 4) setPhase('SELECT_CARD'); }}
                                className="neo-button bg-white text-black font-black py-4 px-8 disabled:opacity-50"
                                disabled={roomCode.length !== 4}
                            >
                                JOIN
                            </button>
                        </div>
                    </div>

                    <div className="text-black font-black text-2xl px-4 relative z-10">OR</div>

                    <div className="flex-1 w-full space-y-4 relative z-10">
                        <label className="text-sm font-black text-black uppercase tracking-widest bg-white border-2 border-black px-2 shadow-[2px_2px_0_0_#000000] opacity-0 select-none">Create Room</label>
                        <button
                            onClick={() => {
                                setRoomCode(Math.floor(1000 + Math.random() * 9000).toString());
                                setPhase('SELECT_CARD');
                            }}
                            className="neo-button w-full bg-[#FF3366] text-white font-black py-4 px-8 text-xl tracking-widest"
                        >
                            CREATE ROOM
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── PHASE: SELECT CARD (from owned cards only) ───
    if (phase === 'SELECT_CARD') {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-block bg-white border-4 border-black text-black font-mono px-6 py-3 text-lg font-black tracking-widest mb-8 shadow-[6px_6px_0_0_#000000] rotate-[-2deg]">
                        Room Code: <span className="text-[#FF3366] ml-2 text-2xl">{roomCode}</span>
                    </div>
                    <h2 className="text-5xl font-black text-black mb-4 uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">Choose Your Fighter</h2>
                    <p className="text-black font-bold text-lg border-b-4 border-black pb-4 inline-block">Select a MonadMon from your collection to stake in the Escrow.</p>
                </div>

                {loadingCards ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin w-12 h-12 text-black mb-4" />
                        <p className="text-black font-black uppercase tracking-widest">Loading your collection...</p>
                    </div>
                ) : ownedCards.length === 0 ? (
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000000] p-12 text-center max-w-2xl mx-auto rotate-[1deg]">
                        <AlertTriangle className="w-16 h-16 text-black mx-auto mb-6" />
                        <h3 className="text-3xl font-black text-black mb-4 uppercase">No Cards Available</h3>
                        <p className="text-black font-bold mb-8 max-w-md mx-auto">
                            You need to own at least one MonadMon to enter the arena. Visit the Shop to buy or claim cards first!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/shop" className="neo-button px-8 py-4 bg-[#33CCFF] text-black uppercase tracking-widest text-lg">
                                Go to Shop
                            </Link>
                            <button onClick={() => setPhase('JOIN')} className="neo-button px-8 py-4 bg-white text-black uppercase tracking-widest text-lg">
                                Back
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center mb-12">
                            {ownedCards.map((owned) => {
                                const card = owned.card;
                                const tierConf = getTierConfig(card.tier);
                                const isSelected = selectedOwnedCard?.id === owned.id;

                                let bgGradient = 'bg-gray-200';
                                if (card.type.includes('Fire')) bgGradient = 'bg-[#FF3366]';
                                else if (card.type.includes('Water')) bgGradient = 'bg-[#33CCFF]';
                                else if (card.type.includes('Grass')) bgGradient = 'bg-[#34c759]';
                                else if (card.type.includes('Electric')) bgGradient = 'bg-[#FFCC00]';

                                return (
                                    <div
                                        key={owned.id}
                                        onClick={() => setSelectedOwnedCard(owned)}
                                        className={`cursor-pointer w-full max-w-[280px] bg-white border-4 border-black transition-all duration-300
                                            ${isSelected
                                                ? 'shadow-[8px_8px_0_0_#FF3366] -translate-y-2 ring-4 ring-black'
                                                : 'shadow-[4px_4px_0_0_#000000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000000]'
                                            }`}
                                    >
                                        {/* Card Image */}
                                        <div className={`h-40 ${bgGradient} flex items-center justify-center relative border-b-4 border-black`}>
                                            <img src={card.image} className="h-full object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,1)] p-2" />
                                            {/* Tier Badge */}
                                            <div className={`absolute top-2 right-2 text-xs px-2 py-1 font-black uppercase tracking-widest border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000000]`}>
                                                {card.tier}
                                            </div>
                                        </div>

                                        {/* Card Info */}
                                        <div className="p-4 bg-white">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className={`font-black text-black uppercase tracking-wider text-xl`}>{card.name}</h4>
                                                <span className="text-xs text-black border-2 border-black px-1 font-mono font-bold bg-gray-100">{tierConf.badge}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-black font-bold uppercase tracking-widest mb-2 border-2 border-dashed border-gray-300 p-1">
                                                <span>HP: {card.maxHp}</span>
                                                <span className="bg-[#FFCC00] px-1 border border-black shadow-[1px_1px_0_0_#000000]">Val: {card.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={confirmCardSelection}
                                disabled={!selectedOwnedCard}
                                className="neo-button bg-[#34c759] text-black font-black py-6 px-16 disabled:opacity-50 text-2xl uppercase tracking-widest"
                            >
                                STAKE & ENTER
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ─── PHASE: BATTLE ───
    if (phase === 'WAITING' || phase === 'BATTLE') {
        const getBattleStatus = () => {
            if (phase === 'WAITING') return { text: 'Waiting For Player 2...', color: 'bg-white text-black' };
            if (resolving) return { text: 'RESOLVING ROUND...', color: 'bg-[#FFCC00] text-black' };
            if (myMoveSubmitted) return { text: 'WAITING FOR OPPONENT...', color: 'bg-[#33CCFF] text-black' };
            return { text: 'PICK YOUR MOVE', color: 'bg-[#34c759] text-black' };
        };
        const status = getBattleStatus();

        return (
            <div className="max-w-7xl mx-auto px-4 py-8 relative">
                <div className="text-center mb-8">
                    <div className="inline-block bg-white border-4 border-black text-black font-mono px-4 py-2 text-sm font-bold tracking-widest mb-4 shadow-[4px_4px_0_0_#000000]">
                        Room Code: <span className="text-[#FF3366] text-lg font-black ml-2">{roomCode}</span>
                    </div><br />
                    <h2 className={`text-4xl font-black transition-colors inline-block border-4 border-black px-8 py-4 shadow-[8px_8px_0_0_#000000] ${status.color}`}>
                        {(phase === 'WAITING' || myMoveSubmitted || resolving) && <Loader2 className="animate-spin inline mr-4" />}{status.text}
                    </h2>
                    {phase === 'BATTLE' && (
                        <div className="flex justify-center gap-6 mt-8 font-black uppercase text-sm tracking-widest">
                            <span className={`px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000000] ${myMoveSubmitted ? 'bg-[#34c759] text-black' : 'bg-white text-black'}`}>
                                You: {myMoveSubmitted ? '✅ Locked' : '⏳ Choosing'}
                            </span>
                            <span className={`px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000000] ${opponentMoveSubmitted ? 'bg-[#34c759] text-black' : 'bg-white text-black'}`}>
                                Opponent: {opponentMoveSubmitted ? '✅ Locked' : '⏳ Choosing'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row w-full justify-center items-start gap-8 md:gap-24 relative z-10 transition-all mt-12">
                    {/* MY CARD */}
                    <div className="flex flex-col items-center gap-4 transition-all w-full max-w-[320px]">
                        <span className="text-2xl font-black bg-white border-4 border-black shadow-[4px_4px_0_0_#000000] px-6 py-2 text-black uppercase tracking-widest">You ({myHp} HP)</span>
                        <div className="w-full bg-white border-4 border-black rounded-none overflow-hidden shadow-[12px_12px_0_0_#000000]">
                            <div className="relative">
                                {myCard && (() => {
                                    let bgGradient = 'bg-gray-200';
                                    if (myCard.type.includes('Fire')) bgGradient = 'bg-[#FF3366]';
                                    else if (myCard.type.includes('Water')) bgGradient = 'bg-[#33CCFF]';
                                    else if (myCard.type.includes('Grass')) bgGradient = 'bg-[#34c759]';
                                    else if (myCard.type.includes('Electric')) bgGradient = 'bg-[#FFCC00]';

                                    return (
                                        <div className={`w-full h-48 ${bgGradient} border-b-4 border-black flex items-center justify-center p-4`}>
                                            <img src={myCard.image} className="h-full object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" />
                                        </div>
                                    )
                                })()}

                                <div className={`absolute top-2 right-2 text-xs px-2 py-1 font-black uppercase tracking-widest border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000000]`}>
                                    {myCard!.tier}
                                </div>
                            </div>
                            <div className="p-4 bg-white space-y-2 relative overflow-hidden">
                                <div className="w-full bg-white border-2 border-black h-4 mb-2"><div className="bg-[#FF3366] h-full border-r-2 border-black transition-all" style={{ width: `${Math.max(0, (myHp / myCard!.maxHp) * 100)}%` }} /></div>
                                {myShield > 0 && <span className="text-sm text-black font-black uppercase tracking-widest block mb-2 text-center bg-[#33CCFF] border-2 border-black shadow-[2px_2px_0_0_#000000] py-1">🛡️ Shield: {myShield}</span>}

                                {phase === 'BATTLE' && !myMoveSubmitted && myCard!.moves.map((m, i) => (
                                    <button key={i} onClick={() => submitMove(m)} className="w-full text-lg bg-white border-2 border-black shadow-[2px_2px_0_0_#000000] p-3 text-black font-black text-left hover:bg-[#FFCC00] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000000] active:translate-y-0 active:shadow-none flex justify-between uppercase tracking-wider transition-all mb-2">
                                        <span className="flex items-center gap-2">
                                            {m.type === 'attack' ? <Swords className="w-5 h-5 text-red-500" /> : m.type === 'power' ? <Zap className="text-yellow-500 w-5 h-5" /> : <Shield className="text-blue-500 w-5 h-5" />}
                                            {m.name}
                                        </span>
                                        <span className="text-black bg-white px-2 border-2 border-black font-mono shadow-[2px_2px_0_0_#000000]">{m.value}</span>
                                    </button>
                                ))}
                                {phase === 'BATTLE' && myMoveSubmitted && (
                                    <div className="text-center py-6 text-black bg-[#34c759] border-4 border-black font-black text-xl shadow-[4px_4px_0_0_#000000] uppercase tracking-widest rotate-[-2deg] mt-4">✅ Move Locked In!</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="font-black text-7xl text-black self-center hidden md:block drop-shadow-[4px_4px_0_#ffffff]">VS</div>

                    {/* OPPONENT CARD */}
                    <div className="flex flex-col items-center gap-4 transition-all w-full max-w-[320px]">
                        <span className="text-2xl font-black bg-white border-4 border-black shadow-[4px_4px_0_0_#000000] px-6 py-2 text-black uppercase tracking-widest">Enemy {opponentCard && `(${opponentHp} HP)`}</span>
                        <div className="w-full bg-white border-4 border-black rounded-none overflow-hidden shadow-[12px_12px_0_0_#000000]">
                            {opponentCard ? (
                                <>
                                    <div className="relative">
                                        {(() => {
                                            let bgGradient = 'bg-gray-200';
                                            if (opponentCard.type.includes('Fire')) bgGradient = 'bg-[#FF3366]';
                                            else if (opponentCard.type.includes('Water')) bgGradient = 'bg-[#33CCFF]';
                                            else if (opponentCard.type.includes('Grass')) bgGradient = 'bg-[#34c759]';
                                            else if (opponentCard.type.includes('Electric')) bgGradient = 'bg-[#FFCC00]';

                                            return (
                                                <div className={`w-full h-48 ${bgGradient} border-b-4 border-black flex items-center justify-center p-4`}>
                                                    <img src={opponentCard.image} className="h-full object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" />
                                                </div>
                                            )
                                        })()}

                                        <div className={`absolute top-2 right-2 text-xs px-2 py-1 font-black uppercase tracking-widest border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000000]`}>
                                            {opponentCard.tier}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white space-y-2">
                                        <div className="w-full bg-white border-2 border-black h-4 mb-2"><div className="bg-[#FF3366] h-full border-r-2 border-black transition-all" style={{ width: `${Math.max(0, (opponentHp / opponentCard.maxHp) * 100)}%` }} /></div>
                                        {opponentShield > 0 && <span className="text-sm text-black font-black uppercase tracking-widest block mb-2 text-center bg-[#33CCFF] border-2 border-black shadow-[2px_2px_0_0_#000000] py-1">🛡️ Shield: {opponentShield}</span>}
                                        <div className={`text-center font-black mt-6 mb-4 text-xl border-4 border-black py-4 shadow-[4px_4px_0_0_#000000] uppercase tracking-wider ${opponentMoveSubmitted ? 'bg-[#34c759] text-black rotate-[2deg]' : 'bg-white text-black'}`}>
                                            {opponentMoveSubmitted ? '✅ Locked In!' : '⏳ Choosing...'}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-[320px] flex items-center justify-center text-8xl bg-gray-200 border-b-4 border-black font-black text-black">?</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Battle Log */}
                <div className="mt-20 max-w-4xl mx-auto w-full bg-white border-4 border-black p-6 h-64 overflow-y-auto font-mono text-sm space-y-2 shadow-[8px_8px_0_0_#000000]">
                    <div className="sticky top-0 bg-white text-black text-lg font-black uppercase tracking-widest mb-4 pb-2 border-b-4 border-black z-10 flex items-center gap-2">
                        <Swords className="w-6 h-6" /> BATTLE LOG
                    </div>
                    {battleLog.length === 0 && <p className="text-black font-bold italic">Waiting to begin...</p>}
                    {battleLog.map((log, i) => <div key={i} className={`animate-fade-in font-bold text-base border-b-2 border-gray-100 py-1 ${log.includes('P1') ? 'text-blue-600' : ''} ${log.includes('P2') ? 'text-red-600' : ''} ${log.includes('ROUND') ? 'bg-black text-white p-2 text-center uppercase tracking-widest mt-4 mb-2 border-2 border-black inline-block' : ''} ${(log.includes('Match starts') || log.includes('joined')) ? 'bg-[#34c759] text-black p-2 border-2 border-black inline-block mt-2' : ''}`}>&gt; {log}</div>)}
                    <div ref={logEndRef} />
                </div>
            </div>
        );
    }

    // ─── PHASE: RESULT ───
    if (phase === 'RESULT') {
        const handlePlayAgain = async () => {
            if (roomCode) {
                await supabase.from('rooms').delete().eq('id', roomCode);
            }
            setPhase('JOIN');
            setRoomCode('');
            setMyCard(null);
            setMyOwnedCardId(null);
            setOpponentCard(null);
            setSelectedOwnedCard(null);
            setWinner(null);
            setBattleLog([]);
            setMyHp(0);
            setOpponentHp(0);
            setTransferDone(false);
            setWonCardName(null);
        };

        return (
            <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center">
                <div className="text-8xl mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    {winner === 'draw' ? '🤝' : winner === 'me' ? '🏆' : '💀'}
                </div>
                <h1 className="text-7xl md:text-8xl font-black mb-6 text-center text-black uppercase tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                    {winner === 'draw' ? 'DRAW!' : winner === 'me' ? 'VICTORY!' : 'DEFEATED'}
                </h1>

                {/* Card transfer status */}
                {transferring && (
                    <div className="flex items-center gap-3 text-black mb-6 bg-white border-2 border-black px-4 py-2 shadow-[2px_2px_0_0_#000000]">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span className="font-bold uppercase tracking-widest">Transferring cards...</span>
                    </div>
                )}

                {transferDone && winner === 'me' && wonCardName && (
                    <div className="bg-[#34c759] border-4 border-black p-6 mb-8 text-center max-w-md shadow-[8px_8px_0_0_#000000] rotate-[-2deg]">
                        <p className="text-black font-black text-2xl uppercase mb-2">🎉 Card Acquired!</p>
                        <p className="text-black font-bold">You won <span className="text-white font-black px-1 bg-black">{wonCardName}</span> from your opponent. It has been added to your collection!</p>
                    </div>
                )}

                {transferDone && winner === 'opponent' && (
                    <div className="bg-[#FF3366] border-4 border-black p-6 mb-8 text-center max-w-md shadow-[8px_8px_0_0_#000000] rotate-[2deg]">
                        <p className="text-white font-black text-2xl uppercase mb-2">Card Lost</p>
                        <p className="text-white font-bold">Your <span className="text-black bg-white font-black px-1">{myCard?.name}</span> has been transferred to the winner.</p>
                    </div>
                )}

                <p className="text-black font-black text-center mb-12 text-2xl max-w-lg bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_#000000] rotate-[-1deg] uppercase">
                    {winner === 'draw'
                        ? 'It was a tie! No cards were transferred.'
                        : winner === 'me'
                            ? 'The opponent\'s card is now yours.'
                            : 'Your staked card was lost to the opponent.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                    <button onClick={handlePlayAgain} className="neo-button bg-white text-black font-black py-6 px-12 text-2xl uppercase tracking-widest">
                        PLAY AGAIN
                    </button>
                    <Link href="/collection" className="neo-button bg-[#33CCFF] text-black font-black py-6 px-12 text-2xl uppercase tracking-widest text-center flex items-center justify-center">
                        View Collection
                    </Link>
                </div>
            </div>
        );
    }
}

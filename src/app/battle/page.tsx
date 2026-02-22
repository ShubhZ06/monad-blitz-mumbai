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
    const [winner, setWinner] = useState<'me' | 'opponent' | null>(null);
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
        } else {
            if (p1Card && !opponentCardRef.current) { setOpponentCard(p1Card); opponentCardRef.current = p1Card; }
            setMyHp(data.player2_hp); setOpponentHp(data.player1_hp);
            setMyShield(data.player2_shield); setOpponentShield(data.player1_shield);
            if (data.winner === 'player2') { setWinner('me'); setPhase('RESULT'); }
            else if (data.winner === 'player1') { setWinner('opponent'); setPhase('RESULT'); }
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
                        .eq('owner_address', loserAddress.toLowerCase())
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
            <h2 className="text-4xl font-black text-white text-center">Wallet Disconnected</h2>
            <p className="mt-4 text-zinc-400">Connect your wallet to enter the battlefield.</p>
        </div>
    );

    // ─── PHASE: JOIN ROOM ───
    if (phase === 'JOIN') {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
                    <Swords className="text-white w-10 h-10" />
                </div>

                <h1 className="text-5xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Enter the Arena</h1>
                <p className="text-zinc-400 text-center mb-12 max-w-lg text-lg">Stake your MonadMon in the Escrow. The victor claims the opponent&apos;s card.</p>

                <div className="w-full bg-black/60 backdrop-blur-xl p-10 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />

                    <div className="flex-1 w-full space-y-4 relative z-10">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Join Private Room</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="XXXX"
                                className="bg-zinc-900 border border-white/10 rounded-2xl px-4 py-4 w-full text-center text-2xl font-black font-mono tracking-widest text-white uppercase focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            />
                            <button
                                onClick={() => { if (roomCode.length === 4) setPhase('SELECT_CARD'); }}
                                className="bg-white hover:bg-zinc-200 text-black font-black py-4 px-8 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                disabled={roomCode.length !== 4}
                            >
                                JOIN
                            </button>
                        </div>
                    </div>

                    <div className="text-zinc-600 font-bold px-4 relative z-10">OR</div>

                    <div className="flex-1 w-full space-y-4 relative z-10">
                        <label className="text-xs font-bold text-transparent select-none uppercase tracking-widest block pl-1">Create Room</label>
                        <button
                            onClick={() => {
                                setRoomCode(Math.floor(1000 + Math.random() * 9000).toString());
                                setPhase('SELECT_CARD');
                            }}
                            className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)] hover:scale-[1.02] active:scale-[0.98]"
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
                    <div className="inline-block bg-white/10 backdrop-blur-md border border-white/10 text-white font-mono px-4 py-2 rounded-full text-sm mb-6 shadow-lg">
                        Room Code: <span className="text-orange-400 font-bold text-lg">{roomCode}</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-4">Choose Your Fighter</h2>
                    <p className="text-zinc-400 text-lg">Select a MonadMon from <span className="text-white font-bold">your collection</span> to stake in the Escrow.</p>
                </div>

                {loadingCards ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin w-10 h-10 text-orange-400 mb-4" />
                        <p className="text-zinc-400">Loading your collection...</p>
                    </div>
                ) : ownedCards.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-6 opacity-70" />
                        <h3 className="text-2xl font-bold text-white mb-4">No Cards Available</h3>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            You need to own at least one MonadMon to enter the arena. Visit the Shop to buy or claim cards first!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/shop" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                                Go to Shop
                            </Link>
                            <button onClick={() => setPhase('JOIN')} className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-white/10">
                                Back
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {ownedCards.map((owned) => {
                                const card = owned.card;
                                const tierConf = getTierConfig(card.tier);
                                const isSelected = selectedOwnedCard?.id === owned.id;

                                return (
                                    <div
                                        key={owned.id}
                                        onClick={() => setSelectedOwnedCard(owned)}
                                        className={`cursor-pointer rounded-3xl overflow-hidden transition-all duration-300
                                            ${isSelected
                                                ? 'ring-4 ring-orange-500 scale-105 shadow-[0_0_30px_rgba(249,115,22,0.3)]'
                                                : `border ${TIER_BORDER_GLOW[card.tier]} opacity-80 hover:opacity-100 hover:scale-[1.02]`
                                            }`}
                                    >
                                        {/* Card Image */}
                                        <div className={`h-48 bg-gradient-to-br ${card.color} flex items-center justify-center relative`}>
                                            <img src={card.image} className="h-full object-contain drop-shadow-2xl" />
                                            {/* Tier Badge */}
                                            <div className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest backdrop-blur-md border ${TIER_COLORS[card.tier]}`}>
                                                {card.tier}
                                            </div>
                                        </div>

                                        {/* Card Info */}
                                        <div className="p-4 bg-zinc-900">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className={`font-bold text-lg ${card.textColor}`}>{card.name}</h4>
                                                <span className="text-xs text-zinc-500 font-mono">{tierConf.badge}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>HP: {card.maxHp}</span>
                                                <span>Value: {card.value} pts</span>
                                            </div>
                                            <div className="text-xs text-zinc-600 mt-1 capitalize">
                                                via {owned.acquired_via.replace('_', ' ')}
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
                                className="bg-white text-black font-black py-4 px-12 rounded-full disabled:opacity-50 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all text-lg"
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
            if (phase === 'WAITING') return { text: 'Waiting For Player 2...', color: 'text-zinc-400' };
            if (resolving) return { text: 'RESOLVING ROUND...', color: 'text-yellow-400' };
            if (myMoveSubmitted) return { text: 'WAITING FOR OPPONENT...', color: 'text-amber-400' };
            return { text: 'PICK YOUR MOVE', color: 'text-emerald-400' };
        };
        const status = getBattleStatus();

        return (
            <div className="max-w-7xl mx-auto px-4 py-8 relative">
                <div className="text-center mb-8">
                    <div className="inline-block bg-white/10 backdrop-blur-md border border-white/10 text-white font-mono px-4 py-2 rounded-full text-sm mb-4 shadow-lg">
                        Room Code: <span className="text-orange-400 font-bold text-lg">{roomCode}</span>
                    </div>
                    <h2 className={`text-4xl font-black ${status.color} transition-colors`}>
                        {(phase === 'WAITING' || myMoveSubmitted || resolving) && <Loader2 className="animate-spin inline mr-2" />}{status.text}
                    </h2>
                    {phase === 'BATTLE' && (
                        <div className="flex justify-center gap-6 mt-4">
                            <span className={`text-sm font-bold px-4 py-1 rounded-full ${myMoveSubmitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                You: {myMoveSubmitted ? '✅ Locked' : '⏳ Choosing'}
                            </span>
                            <span className={`text-sm font-bold px-4 py-1 rounded-full ${opponentMoveSubmitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                Opponent: {opponentMoveSubmitted ? '✅ Locked' : '⏳ Choosing'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row w-full justify-center items-start gap-8 md:gap-24 relative z-10 transition-all">
                    {/* MY CARD */}
                    <div className="flex flex-col items-center gap-4 transition-all">
                        <span className="text-xl font-bold bg-white/10 px-6 py-2 rounded-full text-white">You ({myHp} HP)</span>
                        <div className={`w-72 bg-zinc-900 border-2 border-orange-500 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.3)]`}>
                            <div className="relative">
                                <img src={myCard!.image} className={`w-full h-48 bg-gradient-to-br ${myCard!.color} object-contain p-4`} />
                                <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest backdrop-blur-md border ${TIER_COLORS[myCard!.tier]}`}>
                                    {myCard!.tier}
                                </div>
                            </div>
                            <div className="p-4 bg-zinc-950 space-y-2 relative overflow-hidden">
                                <div className="w-full bg-red-900 rounded-full h-2 mb-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(0, (myHp / myCard!.maxHp) * 100)}%` }} /></div>
                                {myShield > 0 && <span className="text-xs text-blue-400 font-bold block mb-2 text-center bg-blue-500/10 py-1 rounded">🛡️ Shield: {myShield}</span>}
                                {phase === 'BATTLE' && !myMoveSubmitted && myCard!.moves.map((m, i) => (
                                    <button key={i} onClick={() => submitMove(m)} className="w-full text-sm bg-black border border-white/5 p-3 rounded-lg text-white font-bold text-left hover:bg-zinc-800 flex justify-between uppercase tracking-wider hover:border-orange-500/50 transition-all">
                                        <span className="flex items-center gap-2">
                                            {m.type === 'attack' ? <Swords className="w-4 h-4" /> : m.type === 'power' ? <Zap className="text-orange-400 w-4 h-4" /> : <Shield className="text-blue-400 w-4 h-4" />}
                                            {m.name}
                                        </span>
                                        <span className="text-zinc-500 font-mono">{m.value}</span>
                                    </button>
                                ))}
                                {phase === 'BATTLE' && myMoveSubmitted && (
                                    <div className="text-center py-6 text-emerald-400 font-bold text-lg">✅ Move Locked In!</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="font-black text-5xl text-white/50 self-center hidden md:block">VS</div>

                    {/* OPPONENT CARD */}
                    <div className="flex flex-col items-center gap-4 transition-all">
                        <span className="text-xl font-bold bg-white/10 px-6 py-2 rounded-full text-white">Opponent {opponentCard && `(${opponentHp} HP)`}</span>
                        <div className="w-72 bg-zinc-900 border-2 border-white/10 rounded-3xl overflow-hidden">
                            {opponentCard ? (
                                <>
                                    <div className="relative">
                                        <img src={opponentCard.image} className={`w-full h-48 bg-gradient-to-br ${opponentCard.color} object-contain p-4`} />
                                        <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest backdrop-blur-md border ${TIER_COLORS[opponentCard.tier]}`}>
                                            {opponentCard.tier}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-950 space-y-2">
                                        <div className="w-full bg-red-900 rounded-full h-2 mb-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(0, (opponentHp / opponentCard.maxHp) * 100)}%` }} /></div>
                                        {opponentShield > 0 && <span className="text-xs text-blue-400 font-bold block mb-2 text-center bg-blue-500/10 py-1 rounded">🛡️ Shield: {opponentShield}</span>}
                                        <div className={`text-center font-bold mt-6 mb-4 ${opponentMoveSubmitted ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {opponentMoveSubmitted ? '✅ Move Locked In!' : '⏳ Choosing move...'}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-[320px] flex items-center justify-center text-6xl animate-pulse bg-zinc-950">❓</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Battle Log */}
                <div className="mt-12 max-w-2xl mx-auto w-full bg-black/60 border border-white/10 rounded-2xl p-4 h-40 overflow-y-auto font-mono text-sm space-y-2">
                    <div className="sticky top-0 bg-black/80 text-xs font-bold text-zinc-500 mb-2 pb-2 border-b border-white/5 z-10">BATTLE LOG</div>
                    {battleLog.length === 0 && <p className="text-zinc-600 italic">Waiting to begin...</p>}
                    {battleLog.map((log, i) => <div key={i} className={`animate-fade-in ${log.includes('P1') ? 'text-blue-400' : ''} ${log.includes('P2') ? 'text-orange-400' : ''} ${log.includes('ROUND') ? 'text-zinc-600 font-bold' : ''} ${log.includes('Match starts') || log.includes('joined') ? 'text-emerald-400 font-bold' : ''}`}>&gt; {log}</div>)}
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
                <div className="text-8xl mb-6">{winner === 'me' ? '🏆' : '💀'}</div>
                <h1 className="text-6xl font-black mb-6 text-center text-white">{winner === 'me' ? 'VICTORY!' : 'DEFEATED'}</h1>

                {/* Card transfer status */}
                {transferring && (
                    <div className="flex items-center gap-3 text-amber-400 mb-6">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span className="font-bold">Transferring cards...</span>
                    </div>
                )}

                {transferDone && winner === 'me' && wonCardName && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-8 text-center max-w-md">
                        <p className="text-emerald-400 font-bold text-lg mb-1">🎉 Card Acquired!</p>
                        <p className="text-zinc-300">You won <span className="text-white font-bold">{wonCardName}</span> from your opponent. It has been added to your collection!</p>
                    </div>
                )}

                {transferDone && winner === 'opponent' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8 text-center max-w-md">
                        <p className="text-red-400 font-bold text-lg mb-1">Card Lost</p>
                        <p className="text-zinc-300">Your <span className="text-white font-bold">{myCard?.name}</span> has been transferred to the winner.</p>
                    </div>
                )}

                <p className="text-zinc-400 text-center mb-12 text-xl max-w-lg">
                    {winner === 'me'
                        ? 'The opponent\'s card has been transferred to your collection from the Escrow.'
                        : 'Your staked card was lost to the opponent.'}
                </p>

                <div className="flex gap-4">
                    <button onClick={handlePlayAgain} className="bg-white text-black font-black py-4 px-12 rounded-full text-xl shadow-xl hover:scale-105 transition-transform">
                        PLAY AGAIN
                    </button>
                    <Link href="/collection" className="bg-zinc-800 text-white font-bold py-4 px-8 rounded-full text-xl border border-white/10 hover:bg-zinc-700 transition-all flex items-center">
                        View Collection
                    </Link>
                </div>
            </div>
        );
    }
}

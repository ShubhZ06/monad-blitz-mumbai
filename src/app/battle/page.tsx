'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { Shield, Swords, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Phase = 'JOIN' | 'SELECT_CARD' | 'WAITING' | 'BATTLE' | 'RESULT';

interface Move { name: string; type: 'attack' | 'power' | 'defense'; value: number; description: string; }
interface Card { id: string; name: string; image: string; type: string; color: string; maxHp: number; moves: Move[]; }

const MOCK_COLLECTION: Card[] = [
    { id: '1', name: 'Charizard', image: '/images/charizaed.png', type: 'Fire', color: 'from-orange-500 to-red-600', maxHp: 200, moves: [{ name: 'Flamethrower', type: 'attack', value: 35, description: '' }, { name: 'Fire Blast', type: 'power', value: 65, description: '' }, { name: 'Smokescreen', type: 'defense', value: 20, description: '' }] },
    { id: '2', name: 'Blastoise', image: '/images/blastois.png', type: 'Water', color: 'from-blue-500 to-cyan-600', maxHp: 220, moves: [{ name: 'Water Gun', type: 'attack', value: 30, description: '' }, { name: 'Hydro Pump', type: 'power', value: 60, description: '' }, { name: 'Shell Smash', type: 'defense', value: 30, description: '' }] },
    { id: '3', name: 'Venusaur', image: '/images/venasaur.png', type: 'Grass', color: 'from-green-500 to-emerald-600', maxHp: 240, moves: [{ name: 'Vine Whip', type: 'attack', value: 25, description: '' }, { name: 'Solar Beam', type: 'power', value: 70, description: '' }, { name: 'Synthesis', type: 'defense', value: 40, description: 'Heals HP' }] },
    { id: '4', name: 'Pikachu', image: '/images/pikachu.png', type: 'Electric', color: 'from-yellow-400 to-amber-500', maxHp: 160, moves: [{ name: 'Thunder Shock', type: 'attack', value: 40, description: '' }, { name: 'Thunder', type: 'power', value: 80, description: '' }, { name: 'Double Team', type: 'defense', value: 15, description: '' }] }
];

export default function BattleLobby() {
    const { address, isConnected } = useAccount();
    const [phase, setPhase] = useState<Phase>('JOIN');
    const [roomCode, setRoomCode] = useState('');
    const [isPlayer1, setIsPlayer1] = useState<boolean>(false);

    const [myCard, setMyCard] = useState<Card | null>(null);
    const [opponentCard, setOpponentCard] = useState<Card | null>(null);
    const [myHp, setMyHp] = useState(0);
    const [opponentHp, setOpponentHp] = useState(0);
    const [myShield, setMyShield] = useState(0);
    const [opponentShield, setOpponentShield] = useState(0);
    const [winner, setWinner] = useState<'me' | 'opponent' | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [animatingCard, setAnimatingCard] = useState<'me' | 'opponent' | null>(null);
    const [myMoveSubmitted, setMyMoveSubmitted] = useState(false);
    const [opponentMoveSubmitted, setOpponentMoveSubmitted] = useState(false);
    const [resolving, setResolving] = useState(false);

    const logEndRef = useRef<HTMLDivElement>(null);
    const isResolvingRef = useRef(false);
    const myMoveSubmittedRef = useRef(false);

    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [battleLog]);

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

        if (p1Card && p2Card && data.status === 'battle' && phase === 'WAITING') {
            setPhase('BATTLE');
        }

        if (isPlayer1) {
            if (p2Card && !opponentCard) setOpponentCard(p2Card);
            setMyHp(data.player1_hp); setOpponentHp(data.player2_hp);
            setMyShield(data.player1_shield); setOpponentShield(data.player2_shield);
            if (data.winner === 'player1') { setWinner('me'); setPhase('RESULT'); }
            else if (data.winner === 'player2') { setWinner('opponent'); setPhase('RESULT'); }
        } else {
            if (p1Card && !opponentCard) setOpponentCard(p1Card);
            setMyHp(data.player2_hp); setOpponentHp(data.player1_hp);
            setMyShield(data.player2_shield); setOpponentShield(data.player1_shield);
            if (data.winner === 'player2') { setWinner('me'); setPhase('RESULT'); }
            else if (data.winner === 'player1') { setWinner('opponent'); setPhase('RESULT'); }
        }

        setBattleLog(data.action_log || []);

        // Track opponent move status
        const oppMove = isPlayer1 ? data.player2_move : data.player1_move;
        setOpponentMoveSubmitted(!!oppMove);

        // If both moves are in and I haven't submitted mine yet, don't resolve
        // If both moves are in, Player 1 resolves the round
        if (data.player1_move && data.player2_move && isPlayer1 && !isResolvingRef.current) {
            isResolvingRef.current = true;
            setResolving(true);
            resolveRound(data);
        }

        // After resolution, moves are cleared — reset submitted state
        if (!data.player1_move && !data.player2_move && myMoveSubmittedRef.current) {
            setMyMoveSubmitted(false);
            myMoveSubmittedRef.current = false;
            setOpponentMoveSubmitted(false);
            setResolving(false);
            isResolvingRef.current = false;
        }
    };

    const applyMove = (move: Move, attackerCard: Card, isAttackerP1: boolean, p1Hp: number, p2Hp: number, p1Shield: number, p2Shield: number) => {
        let logEntry = `${isAttackerP1 ? 'P1' : 'P2'} (${attackerCard.name}) used ${move.name}!`;

        if (move.type === 'defense') {
            if (attackerCard.name === 'Venusaur') {
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
        const p1Card = data.player1_card as Card;
        const p2Card = data.player2_card as Card;
        let logs = [...(data.action_log || []), `--- ROUND ---`];

        // Apply P1's move
        let res = applyMove(p1Move, p1Card, true, data.player1_hp, data.player2_hp, data.player1_shield, data.player2_shield);
        logs.push(res.logEntry);

        // Apply P2's move on the post-P1 state
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
        if (!myCard) return;
        setPhase('WAITING');
        const { data: room } = await supabase.from('rooms').select('*').eq('id', roomCode).single();

        if (!room) {
            setIsPlayer1(true);
            await supabase.from('rooms').insert({
                id: roomCode, player1_address: address, player1_card: myCard,
                player1_hp: myCard.maxHp, player1_shield: 0, status: 'waiting',
                action_log: [`Room created. Waiting for Player 2...`]
            });
        } else {
            setIsPlayer1(false);
            const logs = [...(room.action_log || []), `Player 2 joined! Match starts.`];
            await supabase.from('rooms').update({
                player2_address: address, player2_card: myCard,
                player2_hp: myCard.maxHp, player2_shield: 0,
                status: 'battle', action_log: logs
            }).eq('id', roomCode);
            setPhase('BATTLE');
        }
    };

    const submitMove = async (move: Move) => {
        if (myMoveSubmittedRef.current || !myCard || !opponentCard) return;
        setMyMoveSubmitted(true);
        myMoveSubmittedRef.current = true;
        const field = isPlayer1 ? 'player1_move' : 'player2_move';
        await supabase.from('rooms').update({ [field]: move }).eq('id', roomCode);
    };

    if (!isConnected) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <h2 className="text-4xl font-black text-white text-center">Wallet Disconnected</h2>
            <p className="mt-4 text-zinc-400">Connect your wallet to enter the battlefield.</p>
        </div>
    );

    if (phase === 'JOIN') {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
                    <Swords className="text-white w-10 h-10" />
                </div>

                <h1 className="text-5xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Enter the Arena</h1>
                <p className="text-zinc-400 text-center mb-12 max-w-lg text-lg">Stake your Monad in the Escrow. The victor of the battle claims both cards.</p>

                <div className="w-full bg-black/60 backdrop-blur-xl p-10 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />

                    {/* JOIN COLUMN */}
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

                    {/* CREATE COLUMN */}
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

    if (phase === 'SELECT_CARD') {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-block bg-white/10 backdrop-blur-md border border-white/10 text-white font-mono px-4 py-2 rounded-full text-sm mb-6 shadow-lg">
                        Room Code: <span className="text-orange-400 font-bold text-lg">{roomCode}</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-4">Choose Your Fighter</h2>
                    <p className="text-zinc-400 text-lg">Select a Monad from your collection to stake in the Escrow.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {MOCK_COLLECTION.map((card) => (
                        <div key={card.id} onClick={() => setMyCard(card)} className={`cursor-pointer rounded-3xl overflow-hidden transition-all ${myCard?.id === card.id ? 'ring-4 ring-orange-500 scale-105 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'border border-white/10 opacity-75 hover:opacity-100 hover:border-white/30'}`}>
                            <div className={`h-48 bg-gradient-to-br ${card.color} flex items-center justify-center`}><img src={card.image} className="h-full object-contain drop-shadow-2xl" /></div>
                            <div className="p-4 bg-zinc-900 text-center font-bold text-xl">{card.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center"><button onClick={confirmCardSelection} disabled={!myCard} className="bg-white text-black font-black py-4 px-12 rounded-full disabled:opacity-50 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">STAKE & ENTER</button></div>
            </div>
        );
    }

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
                    <div className="flex flex-col items-center gap-4 transition-all">
                        <span className="text-xl font-bold bg-white/10 px-6 py-2 rounded-full text-white">You ({myHp} HP)</span>
                        <div className="w-72 bg-zinc-900 border-2 border-orange-500 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                            <img src={myCard!.image} className={`w-full h-48 bg-gradient-to-br ${myCard!.color} object-contain p-4`} />
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

                    <div className="flex flex-col items-center gap-4 transition-all">
                        <span className="text-xl font-bold bg-white/10 px-6 py-2 rounded-full text-white">Opponent {opponentCard && `(${opponentHp} HP)`}</span>
                        <div className="w-72 bg-zinc-900 border-2 border-white/10 rounded-3xl overflow-hidden">
                            {opponentCard ? (
                                <>
                                    <img src={opponentCard.image} className={`w-full h-48 bg-gradient-to-br ${opponentCard.color} object-contain p-4`} />
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

                <div className="mt-12 max-w-2xl mx-auto w-full bg-black/60 border border-white/10 rounded-2xl p-4 h-40 overflow-y-auto font-mono text-sm space-y-2">
                    <div className="sticky top-0 bg-black/80 text-xs font-bold text-zinc-500 mb-2 pb-2 border-b border-white/5 z-10">BATTLE LOG</div>
                    {battleLog.length === 0 && <p className="text-zinc-600 italic">Waiting to begin...</p>}
                    {battleLog.map((log, i) => <div key={i} className={`animate-fade-in ${log.includes('P1') ? 'text-blue-400' : ''} ${log.includes('P2') ? 'text-orange-400' : ''} ${log.includes('ROUND') ? 'text-zinc-600 font-bold' : ''} ${log.includes('Match starts') ? 'text-emerald-400 font-bold' : ''}`}>&gt; {log}</div>)}
                    <div ref={logEndRef} />
                </div>
            </div>
        );
    }

    if (phase === 'RESULT') {
        const handlePlayAgain = async () => {
            if (roomCode) {
                // Terminate and clean up the room so the code can be reused
                await supabase.from('rooms').delete().eq('id', roomCode);
            }
            setPhase('JOIN');
            setRoomCode('');
            setMyCard(null);
            setOpponentCard(null);
            setWinner(null);
            setBattleLog([]);
            setMyHp(0);
            setOpponentHp(0);
        };

        return (
            <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center">
                <div className="text-6xl mb-6">{winner === 'me' ? '🏆' : '💀'}</div>
                <h1 className="text-6xl font-black mb-6 text-center text-white">{winner === 'me' ? 'VICTORY!' : 'DEFEATED'}</h1>
                <p className="text-zinc-400 text-center mb-12 text-xl max-w-lg">{winner === 'me' ? 'You won both cards from the Escrow.' : 'Your card was lost to the opponent.'}</p>
                <button onClick={handlePlayAgain} className="bg-white text-black font-black py-4 px-12 rounded-full text-xl shadow-xl hover:scale-105 transition-transform">PLAY AGAIN</button>
            </div>
        );
    }
}

'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for our Game State
type StatType = 'attack' | 'defense' | 'speed';
type GamePhase = 'lobby' | 'selecting_stat' | 'revealing' | 'game_over';

interface CardStats {
    id: number;
    name: string;
    attack: number;
    defense: number;
    speed: number;
    tier: 'Starter' | 'Standard' | 'Premium';
    emoji: string;
}

// Mock card generator based on MonadMons.sol
function generateRandomCard(): CardStats {
    const isPremium = Math.random() > 0.8;
    const base = isPremium ? 40 : 20;
    return {
        id: Math.floor(Math.random() * 1000),
        name: isPremium ? 'Monad Uni' : 'Monad Dragon',
        tier: isPremium ? 'Premium' : 'Standard',
        emoji: isPremium ? '🦄' : '🐲',
        attack: base + Math.floor(Math.random() * 20),
        defense: base + Math.floor(Math.random() * 20),
        speed: base + Math.floor(Math.random() * 20),
    };
}

export default function BattleLobby() {
    const { address, isConnected } = useAccount();
    const [roomCode, setRoomCode] = useState('');
    const [inLobby, setInLobby] = useState(false);

    // Supabase Realtime State
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const [playerCount, setPlayerCount] = useState(0);

    // Game Core State
    const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
    const [isHost, setIsHost] = useState(false);

    // Player Context (My Board vs Opponent Board)
    const [myCard, setMyCard] = useState<CardStats | null>(null);
    const [opponentCard, setOpponentCard] = useState<CardStats | null>(null);

    const [turnAddress, setTurnAddress] = useState<string | null>(null);
    const [selectedStat, setSelectedStat] = useState<StatType | null>(null);
    const [winner, setWinner] = useState<string | null>(null);

    // Watch for room joins
    useEffect(() => {
        if (!inLobby || !roomCode || !address) return;

        // Clean up previous channel
        if (channel) supabase.removeChannel(channel);

        const roomChannel = supabase.channel(`room-${roomCode}`, {
            config: {
                presence: { key: address },
                broadcast: { self: true },
            },
        });

        roomChannel
            .on('presence', { event: 'sync' }, () => {
                const state = roomChannel.presenceState();
                const totalPlayers = Object.keys(state).length;
                setPlayerCount(totalPlayers);

                // Start game if 2 players are here and we are the host
                if (totalPlayers === 2 && isHost && gamePhase === 'lobby') {
                    // Slight delay to ensure player 2 is fully subscribed before broadcasting
                    setTimeout(() => startGame(roomChannel, Object.keys(state)), 1000);
                }
            })
            .on('broadcast', { event: 'GAME_START' }, ({ payload }) => {
                console.log('GAME_START Broadcast Received', payload);

                // Which card is ours?
                if (payload.player1.address === address) {
                    setMyCard(payload.player1.card);
                    setOpponentCard(payload.player2.card);
                } else {
                    setMyCard(payload.player2.card);
                    setOpponentCard(payload.player1.card);
                }

                setTurnAddress(payload.turnAddress);
                setGamePhase('selecting_stat');
            })
            .on('broadcast', { event: 'STAT_SELECTED' }, ({ payload }) => {
                console.log('STAT_SELECTED Broadcast Received', payload);
                setSelectedStat(payload.stat);
                setGamePhase('revealing');

                // Reveal lasts for 3 seconds then resolve
                setTimeout(() => {
                    setGamePhase(prev => prev === 'revealing' ? 'game_over' : prev);
                }, 3000);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await roomChannel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        setChannel(roomChannel);

        return () => {
            roomChannel.untrack();
            supabase.removeChannel(roomChannel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inLobby, roomCode, address, isHost, gamePhase]);

    // Calculate winner logic locally once we reach 'game_over'
    useEffect(() => {
        if (gamePhase === 'game_over' && selectedStat && myCard && opponentCard) {
            const myValue = myCard[selectedStat] as number;
            const oppValue = opponentCard[selectedStat] as number;

            if (myValue > oppValue) {
                setWinner(address);
            } else if (oppValue > myValue) {
                setWinner(turnAddress === address ? 'opponent' : turnAddress); // Whoever wasn't 'me'
            } else {
                setWinner('draw');
            }
        }
    }, [gamePhase, selectedStat, myCard, opponentCard, address, turnAddress]);


    const startGame = (chan: RealtimeChannel, addresses: string[]) => {
        const p1Card = generateRandomCard();
        const p2Card = generateRandomCard();
        const firstTurn = addresses[Math.floor(Math.random() * addresses.length)];

        chan.send({
            type: 'broadcast',
            event: 'GAME_START',
            payload: {
                player1: { address: addresses[0], card: p1Card },
                player2: { address: addresses[1], card: p2Card },
                turnAddress: firstTurn
            }
        });
    };

    const handleSelectStat = (stat: StatType) => {
        if (!channel || turnAddress !== address) return;

        channel.send({
            type: 'broadcast',
            event: 'STAT_SELECTED',
            payload: { stat }
        });

        // Optimistically apply local state
        setSelectedStat(stat);
        setGamePhase('revealing');

        setTimeout(() => {
            setGamePhase('game_over');
        }, 3000);
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Wallet Disconnected</h2>
                <p className="mt-4 text-zinc-400">Connect to enter the battlefield.</p>
            </div>
        );
    }

    if (inLobby) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-12 text-center">
                <h2 className="text-4xl font-extrabold mb-4 text-white">Room: <span className="text-green-400 font-mono">{roomCode}</span></h2>

                {gamePhase === 'lobby' && (
                    <div className="animate-pulse text-zinc-400 mb-12">Waiting for opponent... ({playerCount}/2 Players)</div>
                )}

                {gamePhase !== 'lobby' && (
                    <div className="mb-12 h-16 flex items-center justify-center">
                        {gamePhase === 'selecting_stat' && (
                            <h3 className="text-2xl font-bold text-yellow-400">
                                {turnAddress === address ? 'Your Turn! Select a Stat to Battle.' : 'Opponent is choosing a stat...'}
                            </h3>
                        )}
                        {gamePhase === 'revealing' && (
                            <h3 className="text-2xl font-bold text-purple-400 animate-pulse">
                                Battles Stat: {selectedStat?.toUpperCase()}! Revealing cards...
                            </h3>
                        )}
                        {gamePhase === 'game_over' && (
                            <div className="animate-bounce">
                                {winner === address ? (
                                    <h3 className="text-4xl font-black text-green-500">🏆 YOU WIN!</h3>
                                ) : winner === 'draw' ? (
                                    <h3 className="text-4xl font-black text-yellow-500">🤝 IT'S A DRAW!</h3>
                                ) : (
                                    <h3 className="text-4xl font-black text-red-500">💀 YOU LOST!</h3>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-12 text-left">
                    {/* Player 1 (ME) */}
                    <div className={`bg-zinc-900 rounded-2xl p-8 border transition-all duration-300 ${turnAddress === address && gamePhase === 'selecting_stat' ? 'border-yellow-500 shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)]' : 'border-white/10'}`}>
                        <h3 className="text-xl font-bold mb-4 text-center">You</h3>

                        {myCard ? (
                            <div className={`bg-zinc-950 border border-white/5 rounded-xl p-6 shadow-inner transition-all ${winner === address ? 'ring-4 ring-green-500' : winner && winner !== 'draw' ? 'opacity-50 grayscale' : ''}`}>
                                <div className="text-6xl text-center mb-4">{myCard.emoji}</div>
                                <h4 className="text-lg font-bold text-white mb-6 text-center">{myCard.name} #{myCard.id}</h4>

                                <div className="space-y-4">
                                    {(['attack', 'defense', 'speed'] as StatType[]).map((stat) => (
                                        <button
                                            key={stat}
                                            disabled={turnAddress !== address || gamePhase !== 'selecting_stat'}
                                            onClick={() => handleSelectStat(stat)}
                                            className={`w-full flex justify-between items-center px-4 py-3 rounded-lg border transition-all
                                                ${selectedStat === stat ? 'bg-zinc-800 border-yellow-500' : 'bg-transparent border-white/10'}
                                                ${turnAddress === address && gamePhase === 'selecting_stat' && !selectedStat ? 'hover:bg-zinc-800 hover:border-white/30 cursor-pointer' : 'cursor-default'}
                                                ${gamePhase === 'selecting_stat' && turnAddress !== address ? 'opacity-80' : ''}
                                            `}
                                        >
                                            <span className="text-zinc-400 capitalize">{stat}</span>
                                            <span className={`font-mono font-bold text-lg 
                                                ${stat === 'attack' ? 'text-red-400' : stat === 'defense' ? 'text-blue-400' : 'text-yellow-400'}
                                            `}>
                                                {myCard[stat]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-zinc-800/50">
                                <p className="text-zinc-500">Staked NFT Ready</p>
                            </div>
                        )}
                    </div>

                    {/* Player 2 (OPPONENT) */}
                    <div className={`bg-zinc-900 rounded-2xl p-8 border transition-all duration-300 ${turnAddress !== address && gamePhase === 'selecting_stat' ? 'border-yellow-500 shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)]' : 'border-white/10'} ${playerCount >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                        <h3 className="text-xl font-bold mb-4 text-center">Opponent</h3>

                        {opponentCard ? (
                            <div className={`bg-zinc-950 border border-white/5 rounded-xl p-6 shadow-inner relative overflow-hidden transition-all ${winner && winner !== address && winner !== 'draw' ? 'ring-4 ring-green-500' : winner === address ? 'opacity-50 grayscale' : ''}`}>

                                {/* Hide the card during stat selection phase */}
                                {gamePhase === 'selecting_stat' && (
                                    <div className="absolute inset-0 z-10 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center border border-white/10 rounded-xl">
                                        <div className="text-4xl mb-4 text-zinc-600">🎴</div>
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Card Hidden</p>
                                    </div>
                                )}

                                <div className="text-6xl text-center mb-4">{opponentCard.emoji}</div>
                                <h4 className="text-lg font-bold text-white mb-6 text-center">{opponentCard.name} #{opponentCard.id}</h4>

                                <div className="space-y-4">
                                    {(['attack', 'defense', 'speed'] as StatType[]).map((stat) => (
                                        <div
                                            key={stat}
                                            className={`w-full flex justify-between items-center px-4 py-3 rounded-lg border transition-all
                                                ${selectedStat === stat ? 'bg-zinc-800 border-yellow-500' : 'bg-transparent border-white/10 opacity-80'}
                                            `}
                                        >
                                            <span className="text-zinc-400 capitalize">{stat}</span>
                                            <span className={`font-mono font-bold text-lg 
                                                ${stat === 'attack' ? 'text-red-400' : stat === 'defense' ? 'text-blue-400' : 'text-yellow-400'}
                                            `}>
                                                {opponentCard[stat]}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        ) : (
                            <div className="h-64 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                                {playerCount >= 2 ? (
                                    <p className="text-zinc-500">Opponent NFT Ready</p>
                                ) : (
                                    <svg className="animate-spin h-8 w-8 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {gamePhase === 'game_over' && (
                    <button
                        onClick={() => {
                            setGamePhase('lobby');
                            setMyCard(null);
                            setOpponentCard(null);
                            setSelectedStat(null);
                            setWinner(null);
                            // Need to leave and recreate room technically, but setting lobby is enough for purely UI reset.
                            window.location.reload();
                        }}
                        className="mt-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl transition-colors border border-white/10"
                    >
                        Return to Lobby
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <span className="text-2xl text-white">⚔️</span>
            </div>

            <h1 className="text-5xl font-extrabold mb-4 text-center">Enter the Arena</h1>
            <p className="text-zinc-400 text-center mb-12 max-w-lg">Stake your NFT in the Battle Escrow and risk it all in a game of Top-Trumps. The victor leaves with both cards.</p>

            <div className="w-full bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-6 items-center">

                <div className="flex-1 w-full space-y-4">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Join Private Room</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={4}
                            placeholder="4-DIGIT CODE"
                            className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-4 w-full text-center text-xl font-mono tracking-widest text-white uppercase focus:outline-none focus:border-blue-500 transition-colors"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />
                        <button
                            onClick={() => { if (roomCode.length === 4) { setInLobby(true); setIsHost(false); } }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-colors disabled:opacity-50"
                            disabled={roomCode.length !== 4}
                        >
                            Join
                        </button>
                    </div>
                </div>

                <div className="text-zinc-600 font-bold px-4">OR</div>

                <div className="flex-1 w-full space-y-4">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block">&nbsp;</label>
                    <button
                        onClick={() => {
                            setRoomCode(Math.floor(1000 + Math.random() * 9000).toString());
                            setIsHost(true);
                            setInLobby(true);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
                    >
                        Create New Room
                    </button>
                </div>

            </div>
        </div>
    );
}

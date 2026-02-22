'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';

export default function BattleLobby() {
    const { isConnected } = useAccount();
    const [roomCode, setRoomCode] = useState('');
    const [inLobby, setInLobby] = useState(false);

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
                <div className="animate-pulse text-zinc-400 mb-12">Waiting for opponent...</div>

                <div className="grid grid-cols-2 gap-12">
                    {/* Player 1 */}
                    <div className="bg-zinc-900 rounded-2xl p-8 border border-white/10 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]">
                        <h3 className="text-xl font-bold mb-4">You</h3>
                        <div className="h-64 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-zinc-800/50">
                            <p className="text-zinc-500">Staked NFT Ready</p>
                        </div>
                    </div>

                    {/* Player 2 */}
                    <div className="bg-zinc-900 rounded-2xl p-8 border border-white/5 opacity-50">
                        <h3 className="text-xl font-bold mb-4">Opponent</h3>
                        <div className="h-64 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
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
                            onClick={() => { if (roomCode.length === 4) setInLobby(true); }}
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

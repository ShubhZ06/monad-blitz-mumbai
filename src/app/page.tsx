'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import Grainient from '@/components/Grainient';

export default function Home() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically redirect connected users to the dashboard
  useEffect(() => {
    if (mounted && isConnected) {
      router.push('/dashboard');
    }
  }, [mounted, isConnected, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 relative overflow-hidden bg-[#ffcc00]">

      {/* Decorative Neo-Brutalism elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#33CCFF] border-4 border-black rounded-full shadow-[8px_8px_0_0_#000000] z-0 hidden md:block" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#FF3366] border-4 border-black shadow-[8px_8px_0_0_#000000] z-0 hidden md:block rotate-12" />

      <div className="z-10 text-center max-w-4xl mx-auto space-y-8 bg-white border-4 border-black p-12 shadow-[16px_16px_0_0_#000000] rounded-3xl relative mt-4">
        <div className="absolute -top-6 -left-6 bg-[#FF3366] text-white font-black text-2xl px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-10deg] uppercase tracking-widest">
          TCG!
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-black leading-tight pb-4 uppercase tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
          Unleash the Power of MonadMons
        </h1>

        <p className="text-xl md:text-2xl text-black font-bold max-w-2xl mx-auto leading-relaxed border-b-4 border-black pb-8 inline-block">
          The fastest on-chain Top-Trumps trading card game. Collect, Stake, and Battle your way to glory.
        </p>

        <div className="flex items-center justify-center pt-8">
          {!isConnected ? (
            <button
              onClick={openConnectModal}
              className="neo-button bg-[#FF3366] text-white text-xl md:text-2xl uppercase tracking-widest px-12 py-6 flex items-center gap-4"
            >
              <span>START ADVENTURE</span>
              <span className="text-3xl">🚀</span>
            </button>
          ) : (
            <div className="neo-badge bg-white text-black text-xl px-8 py-4 flex items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entering the Health Centre...
            </div>
          )}
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-[#33CCFF] border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-2deg] transition-transform hover:rotate-0">
            <h3 className="text-xl font-black text-black mb-2 uppercase">Lightning Fast</h3>
            <p className="text-sm text-black font-bold">Powered by Monad's parallel execution, experience instant battles.</p>
          </div>

          <div className="p-6 bg-[#34c759] border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[3deg] transition-transform hover:rotate-0">
            <h3 className="text-xl font-black text-black mb-2 uppercase">True Ownership</h3>
            <p className="text-sm text-black font-bold">Every MonadMon is a 100% on-chain NFT.</p>
          </div>

          <div className="p-6 bg-[#FF3366] border-4 border-black shadow-[4px_4px_0_0_#000000] rotate-[-1deg] text-white transition-transform hover:rotate-0">
            <h3 className="text-xl font-black mb-2 uppercase drop-shadow-[2px_2px_0_#000000]">Winner Takes All</h3>
            <p className="text-sm font-bold drop-shadow-[1px_1px_0_#000000]">PVP Top-Trumps mode. You lose the battle, you lose your card.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

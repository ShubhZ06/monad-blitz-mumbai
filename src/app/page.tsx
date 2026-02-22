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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Grainient
          color1="#2d8285"
          color2="#6fbe98"
          color3="#b7e4a1"
          timeSpeed={2}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2.55}
          grainAmount={0.07}
          grainScale={4.8}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      <div className="z-10 text-center max-w-4xl mx-auto space-y-8">
        <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-br from-teal-300 via-emerald-200 to-green-100 text-transparent bg-clip-text drop-shadow-sm leading-tight pb-4">
          Unleash the Power of MonadMons
        </h1>

        <p className="text-xl md:text-2xl text-emerald-50/80 font-light max-w-2xl mx-auto leading-relaxed">
          The fastest on-chain Top-Trumps trading card game. Collect, Stake, and Battle your way to glory on the Monad testnet.
        </p>

        <div className="flex items-center justify-center pt-12">
          {!isConnected ? (
            <button
              onClick={openConnectModal}
              className="group relative rounded-full p-px text-xl font-bold leading-6 text-white bg-gradient-to-r from-teal-500 to-emerald-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_-10px_rgba(45,130,133,0.7)]"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 transition-opacity group-hover:opacity-30"></span>
              <div className="relative flex items-center justify-center gap-2 rounded-full bg-teal-950/40 backdrop-blur-md px-16 py-6 transition-colors group-hover:bg-teal-900/40 min-w-[300px] border border-white/10">
                <span>START ADVENTURE</span>
                <span className="text-2xl ml-2">🚀</span>
              </div>
            </button>
          ) : (
            <div className="animate-pulse flex items-center gap-3 text-purple-400 font-bold text-xl">
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entering the Health Centre...
            </div>
          )}
        </div>

        <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left opacity-80">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Lightning Fast</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Powered by Monad's parallel execution, experience instant battles with zero latency.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">True Ownership</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Every MonadMon is a 100% on-chain ERC721 NFT. Stake them in high-risk escrow battles.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Winner Takes All</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">PVP Top-Trumps mode via Realtime Sync. You lose the battle, you lose your card.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

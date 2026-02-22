import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950 pointer-events-none"></div>

      <div className="z-10 text-center max-w-4xl mx-auto space-y-8">
        <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-500 text-transparent bg-clip-text drop-shadow-sm leading-tight pb-4">
          Unleash the Power of MonadMons
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
          The fastest on-chain Top-Trumps trading card game. Collect, Stake, and Battle your way to glory on the Monad testnet.
        </p>

        <div className="flex items-center justify-center gap-6 pt-8">
          <Link href="/shop" className="group relative rounded-full p-px text-sm font-semibold leading-6 text-white bg-gradient-to-r from-purple-500 to-indigo-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]">
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-20"></span>
            <div className="relative flex items-center gap-2 rounded-full bg-zinc-950/50 px-8 py-4 transition-colors group-hover:bg-transparent">
              Claim Free Starter
            </div>
          </Link>

          <Link href="/battle" className="group text-sm font-semibold text-zinc-300 hover:text-white transition-colors duration-200 py-4 px-8 border border-white/10 rounded-full hover:bg-white/5">
            Enter the Lobby &rarr;
          </Link>
        </div>

        <div className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Lightning Fast</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Powered by Monad's parallel execution, experience instant battles with zero latency.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">True Ownership</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Every MonadMon is a 100% on-chain ERC721 NFT. Stake them in high-risk escrow battles.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⚔️</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Winner Takes All</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">PVP Top-Trumps mode via Realtime Sync. You lose the battle, you lose your card.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

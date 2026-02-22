# PokeBattle

A Web3 Pokémon-style trading card game built on **Monad Testnet**. Collect cards, battle other players, and win their NFTs!

## What is PokeBattle?

PokeBattle is a **Top-Trumps style card game** where you:

1. **Collect Cards** - Get free starter cards, claim daily drops, or buy premium cards with MON tokens
2. **Battle Players** - Challenge others in 1v1 battles where the winner takes the loser's card
3. **Build Your Collection** - Every card is an on-chain NFT that you truly own

## How It Works

### Getting Cards
- **Starter Pack**: New players get a free Pikachu to begin their journey
- **Daily Drops**: Claim a random free card every 24 hours (Common & Uncommon tiers)
- **Premium Shop**: Buy powerful Rare, Epic, and Legendary cards with MON tokens

### Battling
1. Create or join a private room with a 4-digit code
2. Stake one of your cards in the battle
3. Take turns using Attack, Power, or Defense moves
4. The winner claims the opponent's staked card!

### Card Tiers
| Tier | Rarity | How to Get |
|------|--------|------------|
| Common | ⭐ | Daily claim, Starter |
| Uncommon | ⭐⭐ | Daily claim, Shop |
| Rare | ⭐⭐⭐ | Shop only |
| Epic | 💎 | Shop only |
| Legendary | 👑 | Shop only |

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Blockchain**: Monad Testnet (EVM-compatible)
- **Smart Contracts**: Solidity, Hardhat
- **Database**: Supabase (real-time multiplayer)
- **Wallet**: RainbowKit + wagmi

## Project Structure

```
├── src/
│   ├── app/           # Next.js pages (shop, battle, collection, dashboard)
│   ├── components/    # React components (Navbar, ProfilePopup, etc.)
│   └── lib/           # Utilities (cards catalog, inventory, supabase)
├── contracts/
│   ├── contracts/     # Solidity smart contracts
│   └── scripts/       # Deployment scripts
└── public/images/     # Pokémon card images
```

## Smart Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| PokeBattle | `0x356B7d7A8dBC2Aa628571cD659217e372dF98BDA` | ERC-721 NFT for cards |
| BattleEscrow | `0x1E02BEC9B46c7baAADc47Af592d248b336FEbdd5` | Handles battle stakes |

## Getting Started

### Prerequisites
- Node.js 18+
- A wallet with Monad Testnet MON tokens

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and keys

# Run the app
npm run dev
```

### Database Setup

Run the SQL in `supabase_setup.sql` in your Supabase SQL Editor to create the required tables:
- `rooms` - Battle sessions
- `player_cards` - Card ownership
- `user_profiles` - Player usernames

## Features

- **Neo-Brutalist UI** - Bold, colorful design with hard shadows
- **Real-time Battles** - Powered by Supabase real-time subscriptions
- **Profile System** - Create a username displayed across the app
- **Card Transfer** - Winner automatically receives loser's card after battle
- **On-chain Purchases** - Buy cards with real MON tokens

## Screenshots

The game features a retro Pokémon Center aesthetic with modern Web3 functionality.

## License

MIT

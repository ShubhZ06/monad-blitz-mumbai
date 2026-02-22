// ─── Card Catalog: Single source of truth for all MonadMons cards ───
// Tiers determine rarity, base stats, and trade value.
// Cards are acquired via: Shop (MON), Daily Claims, or Battle Wins.

export type CardTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Move {
    name: string;
    type: 'attack' | 'power' | 'defense';
    value: number;
    description: string;
}

export interface CardDefinition {
    id: string;
    name: string;
    image: string;
    type: string;
    color: string;        // Tailwind gradient classes
    textColor: string;    // Tailwind text color
    tier: CardTier;
    maxHp: number;
    moves: Move[];
    value: number;        // Trade value in points
    shopPrice: number;    // Price in MON (0 = not buyable, free claim only)
    dailyClaimable: boolean;
}

// Card tier multiplier for base stats
const TIER_CONFIG: Record<CardTier, { hpMultiplier: number; valueMultiplier: number; badge: string }> = {
    Common: { hpMultiplier: 1.0, valueMultiplier: 1, badge: '⭐' },
    Uncommon: { hpMultiplier: 1.15, valueMultiplier: 2, badge: '⭐⭐' },
    Rare: { hpMultiplier: 1.3, valueMultiplier: 5, badge: '⭐⭐⭐' },
    Epic: { hpMultiplier: 1.5, valueMultiplier: 10, badge: '💎' },
    Legendary: { hpMultiplier: 1.8, valueMultiplier: 25, badge: '👑' },
};

export const getTierConfig = (tier: CardTier) => TIER_CONFIG[tier];

export const TIER_COLORS: Record<CardTier, string> = {
    Common: 'text-zinc-400 bg-zinc-500/20 border-zinc-500/30',
    Uncommon: 'text-green-400 bg-green-500/20 border-green-500/30',
    Rare: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    Epic: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    Legendary: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
};

export const TIER_BORDER_GLOW: Record<CardTier, string> = {
    Common: 'border-zinc-700',
    Uncommon: 'border-green-500/40',
    Rare: 'border-blue-500/40 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]',
    Epic: 'border-purple-500/40 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]',
    Legendary: 'border-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]',
};

// ─── Full Card Catalog ───
export const CARD_CATALOG: CardDefinition[] = [
    // ── Common Tier (Daily Claimable) ──
    {
        id: 'pikachu',
        name: 'Pikachu',
        image: '/images/pikachu.png',
        type: 'Electric',
        color: 'from-yellow-400 to-amber-500',
        textColor: 'text-yellow-400',
        tier: 'Common',
        maxHp: 160,
        moves: [
            { name: 'Thunder Shock', type: 'attack', value: 30, description: 'A basic electric jolt.' },
            { name: 'Quick Attack', type: 'attack', value: 25, description: 'Strikes fast.' },
            { name: 'Double Team', type: 'defense', value: 15, description: 'Raises evasion.' }
        ],
        value: 100,
        shopPrice: 0,
        dailyClaimable: true,
    },

    // ── Uncommon Tier ──
    {
        id: 'venusaur',
        name: 'Venusaur',
        image: '/images/venasaur.png',
        type: 'Grass / Poison',
        color: 'from-green-500 to-emerald-600',
        textColor: 'text-green-400',
        tier: 'Uncommon',
        maxHp: 220,
        moves: [
            { name: 'Vine Whip', type: 'attack', value: 25, description: 'Lashes with vines.' },
            { name: 'Solar Beam', type: 'power', value: 60, description: 'Harnesses sunlight.' },
            { name: 'Synthesis', type: 'defense', value: 40, description: 'Recovers HP using sunlight.' }
        ],
        value: 200,
        shopPrice: 0.05,
        dailyClaimable: true,
    },

    // ── Rare Tier ──
    {
        id: 'blastoise',
        name: 'Blastoise',
        image: '/images/blastois.png',
        type: 'Water',
        color: 'from-blue-500 to-cyan-600',
        textColor: 'text-blue-400',
        tier: 'Rare',
        maxHp: 260,
        moves: [
            { name: 'Water Gun', type: 'attack', value: 30, description: 'A stream of water.' },
            { name: 'Hydro Pump', type: 'power', value: 65, description: 'Fires a massive water blast.' },
            { name: 'Shell Smash', type: 'defense', value: 30, description: 'Raises shield power.' }
        ],
        value: 500,
        shopPrice: 0.08,
        dailyClaimable: false,
    },

    // ── Epic Tier ──
    {
        id: 'charizard',
        name: 'Charizard',
        image: '/images/charizaed.png',
        type: 'Fire / Flying',
        color: 'from-orange-500 to-red-600',
        textColor: 'text-orange-400',
        tier: 'Epic',
        maxHp: 300,
        moves: [
            { name: 'Flamethrower', type: 'attack', value: 40, description: 'A scorching flame attack.' },
            { name: 'Fire Blast', type: 'power', value: 75, description: 'An intense blast of fire.' },
            { name: 'Smokescreen', type: 'defense', value: 20, description: 'Lowers accuracy.' }
        ],
        value: 1000,
        shopPrice: 0.1,
        dailyClaimable: false,
    },

    // ── Legendary Tier ──
    {
        id: 'mewtwo',
        name: 'Mewtwo',
        image: '/images/mewtwo.png',
        type: 'Psychic',
        color: 'from-purple-500 to-indigo-600',
        textColor: 'text-purple-400',
        tier: 'Legendary',
        maxHp: 360,
        moves: [
            { name: 'Psychic', type: 'attack', value: 50, description: 'A powerful psychic wave.' },
            { name: 'Shadow Ball', type: 'power', value: 85, description: 'Hurls a shadowy blob.' },
            { name: 'Barrier', type: 'defense', value: 35, description: 'Raises an unbreakable wall.' }
        ],
        value: 2500,
        shopPrice: 0.15,
        dailyClaimable: false,
    },
    {
        id: 'mew',
        name: 'Mew',
        image: '/images/mew.png',
        type: 'Psychic',
        color: 'from-pink-400 to-rose-500',
        textColor: 'text-pink-400',
        tier: 'Legendary',
        maxHp: 340,
        moves: [
            { name: 'Ancient Power', type: 'attack', value: 45, description: 'A prehistoric energy blast.' },
            { name: 'Aura Sphere', type: 'power', value: 80, description: 'Focused life energy.' },
            { name: 'Transform', type: 'defense', value: 30, description: 'Copies opponent abilities.' }
        ],
        value: 2500,
        shopPrice: 0.15,
        dailyClaimable: false,
    },
];

export const getCardById = (id: string): CardDefinition | undefined =>
    CARD_CATALOG.find(c => c.id === id);

export const getCardsByTier = (tier: CardTier): CardDefinition[] =>
    CARD_CATALOG.filter(c => c.tier === tier);

export const getDailyClaimableCards = (): CardDefinition[] =>
    CARD_CATALOG.filter(c => c.dailyClaimable);

export const getShopCards = (): CardDefinition[] =>
    CARD_CATALOG.filter(c => c.shopPrice > 0);

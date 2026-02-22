// ─── Player Inventory: Supabase-backed card ownership service ───
// Manages which cards each wallet owns, daily claims, and card transfers.

import { supabase } from './supabase';
import { CardDefinition, getCardById, getDailyClaimableCards } from './cards';

export interface OwnedCard {
    id: string;           // UUID from Supabase (unique ownership record)
    card_id: string;      // References CardDefinition.id
    owner_address: string;
    acquired_via: 'shop' | 'daily_claim' | 'battle_win' | 'starter';
    acquired_at: string;
}

// ─── Fetch all cards owned by wallet ───
export async function getPlayerCards(walletAddress: string): Promise<(OwnedCard & { card: CardDefinition })[]> {
    const { data, error } = await supabase
        .from('player_cards')
        .select('*')
        .eq('owner_address', walletAddress.toLowerCase())
        .order('acquired_at', { ascending: false });

    if (error) {
        console.error('Error fetching player cards:', error);
        return [];
    }

    return (data || [])
        .map(row => {
            const card = getCardById(row.card_id);
            if (!card) return null;
            return { ...row, card };
        })
        .filter(Boolean) as (OwnedCard & { card: CardDefinition })[];
}

// ─── Buy a card from Shop ───
export async function buyCard(walletAddress: string, cardId: string): Promise<{ success: boolean; error?: string }> {
    const card = getCardById(cardId);
    if (!card) return { success: false, error: 'Card not found in catalog.' };
    if (card.shopPrice <= 0) return { success: false, error: 'This card cannot be purchased from the shop.' };

    const { error } = await supabase
        .from('player_cards')
        .insert({
            card_id: cardId,
            owner_address: walletAddress.toLowerCase(),
            acquired_via: 'shop',
        });

    if (error) {
        console.error('Error buying card:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ─── Check if daily claim is available ───
export async function canClaimDaily(walletAddress: string): Promise<{ canClaim: boolean; nextClaimAt?: string }> {
    const { data } = await supabase
        .from('player_cards')
        .select('acquired_at')
        .eq('owner_address', walletAddress.toLowerCase())
        .eq('acquired_via', 'daily_claim')
        .order('acquired_at', { ascending: false })
        .limit(1);

    if (!data || data.length === 0) return { canClaim: true };

    const lastClaim = new Date(data[0].acquired_at);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now >= nextClaim) return { canClaim: true };

    return { canClaim: false, nextClaimAt: nextClaim.toISOString() };
}

// ─── Claim a daily card (random from claimable pool) ───
export async function claimDailyCard(walletAddress: string): Promise<{ success: boolean; card?: CardDefinition; error?: string }> {
    const { canClaim, nextClaimAt } = await canClaimDaily(walletAddress);
    if (!canClaim) {
        const remaining = nextClaimAt ? getTimeRemaining(nextClaimAt) : 'later';
        return { success: false, error: `Daily claim not available. Try again in ${remaining}.` };
    }

    const claimableCards = getDailyClaimableCards();
    if (claimableCards.length === 0) return { success: false, error: 'No daily claimable cards available.' };

    // Random pick from the claimable pool
    const randomCard = claimableCards[Math.floor(Math.random() * claimableCards.length)];

    const { error } = await supabase
        .from('player_cards')
        .insert({
            card_id: randomCard.id,
            owner_address: walletAddress.toLowerCase(),
            acquired_via: 'daily_claim',
        });

    if (error) {
        console.error('Error claiming daily card:', error);
        return { success: false, error: error.message };
    }

    return { success: true, card: randomCard };
}

// ─── Transfer card from loser to winner after battle ───
export async function transferCard(
    ownedCardId: string,
    fromAddress: string,
    toAddress: string
): Promise<{ success: boolean; error?: string }> {
    // First verify ownership
    const { data: card } = await supabase
        .from('player_cards')
        .select('*')
        .eq('id', ownedCardId)
        .eq('owner_address', fromAddress.toLowerCase())
        .single();

    if (!card) return { success: false, error: 'Card not found or not owned by this address.' };

    // Transfer by updating the owner
    const { error } = await supabase
        .from('player_cards')
        .update({
            owner_address: toAddress.toLowerCase(),
            acquired_via: 'battle_win',
            acquired_at: new Date().toISOString(),
        })
        .eq('id', ownedCardId);

    if (error) {
        console.error('Error transferring card:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ─── Give a starter card to a new player ───
export async function giveStarterCard(walletAddress: string): Promise<{ success: boolean; card?: CardDefinition; error?: string }> {
    // Check if player already has any cards
    const { data } = await supabase
        .from('player_cards')
        .select('id')
        .eq('owner_address', walletAddress.toLowerCase())
        .limit(1);

    if (data && data.length > 0) {
        return { success: false, error: 'You already have cards in your collection.' };
    }

    // Give the starter Pikachu
    const starterCard = getCardById('pikachu');
    if (!starterCard) return { success: false, error: 'Starter card not found.' };

    const { error } = await supabase
        .from('player_cards')
        .insert({
            card_id: starterCard.id,
            owner_address: walletAddress.toLowerCase(),
            acquired_via: 'starter',
        });

    if (error) {
        console.error('Error giving starter card:', error);
        return { success: false, error: error.message };
    }

    return { success: true, card: starterCard };
}

// ─── Helper: Format time remaining ───
function getTimeRemaining(isoString: string): string {
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return '0s';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

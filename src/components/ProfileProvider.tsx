'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

interface UserProfile {
    walletAddress: string;
    username: string;
    createdAt: string;
}

interface ProfileContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    showProfilePopup: boolean;
    setShowProfilePopup: (show: boolean) => void;
    saveProfile: (username: string) => Promise<{ success: boolean; error?: string }>;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { address, isConnected } = useAccount();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('wallet_address', address.toLowerCase())
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                return;
            }

            if (data) {
                setProfile({
                    walletAddress: data.wallet_address,
                    username: data.username,
                    createdAt: data.created_at,
                });
                setShowProfilePopup(false);
            } else {
                // No profile exists, show popup
                setProfile(null);
                setShowProfilePopup(true);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
            setHasCheckedProfile(true);
        }
    }, [address]);

    const refreshProfile = useCallback(async () => {
        await fetchProfile();
    }, [fetchProfile]);

    const saveProfile = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
        if (!address) {
            return { success: false, error: 'No wallet connected' };
        }

        try {
            // Check if username already exists (case-insensitive)
            const { data: existingUser } = await supabase
                .from('user_profiles')
                .select('wallet_address')
                .ilike('username', username)
                .neq('wallet_address', address.toLowerCase())
                .single();

            if (existingUser) {
                return { success: false, error: 'Username is already taken' };
            }

            // Upsert the profile
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    wallet_address: address.toLowerCase(),
                    username: username.trim(),
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'wallet_address'
                });

            if (error) {
                console.error('Error saving profile:', error);
                return { success: false, error: 'Failed to save profile' };
            }

            // Refresh profile after save
            await fetchProfile();
            return { success: true };
        } catch (error) {
            console.error('Error saving profile:', error);
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, [address, fetchProfile]);

    // Fetch profile when wallet connects
    useEffect(() => {
        if (isConnected && address) {
            fetchProfile();
        } else {
            setProfile(null);
            setShowProfilePopup(false);
            setHasCheckedProfile(false);
        }
    }, [isConnected, address, fetchProfile]);

    return (
        <ProfileContext.Provider
            value={{
                profile,
                isLoading,
                showProfilePopup,
                setShowProfilePopup,
                saveProfile,
                refreshProfile,
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
}

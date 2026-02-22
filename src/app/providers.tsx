'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '../lib/wagmi';
import { ProfileProvider } from '@/components/ProfileProvider';
import { ProfilePopup } from '@/components/ProfilePopup';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    <ProfileProvider>
                        {children}
                        <ProfilePopup />
                    </ProfileProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

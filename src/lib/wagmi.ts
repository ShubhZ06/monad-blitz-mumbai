import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

export const monadTestnet: Chain = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz/'] },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
    },
} as const;

export const config = getDefaultConfig({
    appName: 'MonadMons TCG',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo_project_id',
    chains: [monadTestnet],
    transports: {
        [monadTestnet.id]: http(),
    },
});

import React from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

import { WagmiProvider, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { RainbowKitProvider, getDefaultConfig, ConnectButton, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App'

const wagmiConfig = getDefaultConfig({
  appName: 'Time-Banked Marketplace',
  projectId: import.meta.env.VITE_WC_PROJECT_ID || 'demo',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
  },
  ssr: false,
})

const queryClient = new QueryClient()

function RootProviders() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <div style={{ minHeight: '100vh', padding: 24 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Time-Banked Marketplace</h1>
              <ConnectButton />
            </header>
            <main style={{ marginTop: 24 }}>
              <App />
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

const el = document.getElementById('root')!
createRoot(el).render(<RootProviders />)




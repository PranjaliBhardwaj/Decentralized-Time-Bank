import React from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from '../lib/abi'
import { CONTRACTS } from '../lib/contracts'
import { sepolia, polygonMumbai } from 'wagmi/chains'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const chainId = sepolia.id // default display
  const tokenAddress = CONTRACTS.sepolia.timeToken

  const { data: balance } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress as `0x${string}`,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: decimals } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress as `0x${string}`,
    functionName: 'decimals',
  })

  const { data: symbol } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress as `0x${string}`,
    functionName: 'symbol',
  })

  const formatted = React.useMemo(() => {
    if (balance == null || decimals == null) return '...'
    const d = Number(decimals)
    const factor = 10 ** d
    return (Number(balance) / factor).toLocaleString(undefined, { maximumFractionDigits: 6 })
  }, [balance, decimals])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      {isConnected ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <div className="text-sm text-neutral-400">Wallet</div>
            <div className="font-mono break-all">{address}</div>
          </div>
          <div className="card">
            <div className="text-sm text-neutral-400">TTK Balance</div>
            <div className="text-3xl font-semibold">{formatted} {symbol ?? 'TTK'}</div>
            <div className="text-xs text-neutral-400 mt-1">Contract: {tokenAddress.slice(0, 10)}…</div>
          </div>
        </div>
      ) : (
        <div className="card">Please connect your wallet.</div>
      )}
    </div>
  )
}



import { useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from '../lib/abi'
import { CONTRACTS } from '../lib/contracts'
import { AnimatedNumber } from '../components/AnimatedNumber'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
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

  const balanceValue = useMemo(() => {
    if (balance == null || decimals == null) return null
    const d = Number(decimals)
    const factor = 10 ** d
    return Number(balance) / factor
  }, [balance, decimals])

  return (
    <div className="space-y-6 page-enter">
      <h2 className="text-2xl font-semibold animate-fade-in">Dashboard</h2>
      {isConnected ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card animate-slide-in">
            <div className="text-sm text-neutral-400 mb-2">Wallet Address</div>
            <div className="font-mono break-all text-sm bg-neutral-900/50 p-2 rounded border border-neutral-700">
              {address}
            </div>
          </div>
          <div className="card animate-slide-in-right">
            <div className="text-sm text-neutral-400 mb-2">TTK Balance</div>
            <div className="text-4xl font-bold text-indigo-400 mb-2">
              {balanceValue !== null ? (
                <AnimatedNumber value={balanceValue} suffix={symbol ?? 'TTK'} decimals={6} />
              ) : (
                <span className="animate-pulse-slow">...</span>
              )}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Contract: {tokenAddress.slice(0, 10)}…</div>
          </div>
        </div>
      ) : (
        <div className="card animate-fade-in">Please connect your wallet.</div>
      )}
    </div>
  )
}



import React, { useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi'
import { erc20Abi, timeEscrowAbi } from '../lib/abi'
import { CONTRACTS } from '../lib/contracts'

function formatAmount(v?: bigint) {
  if (!v) return '0'
  return (Number(v) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 6 })
}

export default function EscrowPage() {
  const { address, isConnected } = useAccount()
  const config = useConfig()
  const [provider, setProvider] = useState('')
  const [amount, setAmount] = useState('1')
  const [escrowId, setEscrowId] = useState<string>('')

  const tokenAddress = CONTRACTS.sepolia.timeToken as `0x${string}`
  const escrowAddress = CONTRACTS.sepolia.timeEscrow as `0x${string}`

  const amountWei = useMemo(() => {
    try { return BigInt(Math.floor(Number(amount || '0') * 1e18)) } catch { return 0n }
  }, [amount])

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'allowance',
    args: address ? [address, escrowAddress] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: waiting } = useWaitForTransactionReceipt({ hash })

  const needsApprove = (allowance ?? 0n) < (amountWei ?? 0n)

  const onApprove = () => {
    if (!amountWei) return
    writeContract({ abi: erc20Abi, address: tokenAddress, functionName: 'approve', args: [escrowAddress, amountWei] })
  }

  const onCreate = () => {
    if (!amountWei || !provider) return
    writeContract({ abi: timeEscrowAbi, address: escrowAddress, functionName: 'createEscrow', args: [provider as `0x${string}`, amountWei] })
  }

  const onConfirm = () => {
    if (!escrowId) return
    writeContract({ abi: timeEscrowAbi, address: escrowAddress, functionName: 'confirm', args: [BigInt(escrowId)] })
  }

  const onCancel = () => {
    if (!escrowId) return
    writeContract({ abi: timeEscrowAbi, address: escrowAddress, functionName: 'cancel', args: [BigInt(escrowId)] })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Escrow</h2>
      {!isConnected ? (
        <div className="card">Please connect your wallet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <div className="text-sm text-neutral-400">Create Escrow</div>
            <label className="block text-sm">Provider address</label>
            <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="0x..." className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" />
            <label className="block text-sm">Amount (TTK)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" />
            <div className="text-xs text-neutral-400">Allowance: {formatAmount(allowance)} TTK</div>
            {needsApprove ? (
              <button className="btn-primary" disabled={isPending || waiting} onClick={onApprove}>Approve</button>
            ) : (
              <button className="btn-primary" disabled={isPending || waiting} onClick={onCreate}>Create Escrow</button>
            )}
            {hash && <div className="text-xs text-neutral-400 break-all">tx: {hash}</div>}
          </div>

          <div className="card space-y-3">
            <div className="text-sm text-neutral-400">Confirm / Cancel</div>
            <label className="block text-sm">Escrow ID</label>
            <input value={escrowId} onChange={(e) => setEscrowId(e.target.value)} className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={onConfirm} disabled={isPending || waiting}>Confirm</button>
              <button className="btn-primary" onClick={onCancel} disabled={isPending || waiting}>Cancel</button>
            </div>
            {hash && <div className="text-xs text-neutral-400 break-all">tx: {hash}</div>}
          </div>
        </div>
      )}
    </div>
  )
}



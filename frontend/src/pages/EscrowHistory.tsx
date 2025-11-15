import { useAccount } from 'wagmi'
import { useEscrowReputation } from '../state/reputation'

export default function EscrowHistory() {
  const { address } = useAccount()
  const { history, loading } = useEscrowReputation(address)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Escrow History</h2>
      <div className="card space-y-3">
        {loading ? (
          <div className="text-neutral-400 text-sm">Loading escrow events…</div>
        ) : history.length === 0 ? (
          <div className="text-neutral-400 text-sm">No escrows created yet.</div>
        ) : (
          <div className="space-y-2 text-sm">
            {history.slice(0, 50).map((item) => (
              <div key={item.id} className="border border-neutral-800 rounded px-3 py-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-neutral-200">Escrow #{item.id}</div>
                  <div className={`text-xs ${statusColor(item.status)}`}>{item.status}</div>
                </div>
                <div className="text-xs text-neutral-400">
                  Role: {item.role} · Hours: {item.hours.toFixed(2)} · Amount: {(Number(item.amountRaw) / 1e18).toFixed(2)} TTK
                </div>
                <div className="text-xs text-neutral-500">
                  Requester: {shorten(item.requester)} · Provider: {shorten(item.provider)}
                </div>
                <div className="text-xs text-neutral-500">
                  Created block: {formatBlock(item.createdBlock)}{item.completedBlock ? ` · Finalized: ${formatBlock(item.completedBlock)}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function statusColor(status: 'Completed' | 'Cancelled' | 'Pending') {
  switch (status) {
    case 'Completed':
      return 'text-green-400'
    case 'Cancelled':
      return 'text-red-400'
    default:
      return 'text-yellow-400'
  }
}

function formatBlock(block?: bigint) {
  if (!block) return 'n/a'
  return Number(block)
}

function shorten(address: string) {
  if (!address) return 'n/a'
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

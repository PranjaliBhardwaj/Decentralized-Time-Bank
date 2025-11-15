import { useMemo, useState } from 'react'
import { useEscrowReputation } from '../state/reputation'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { AnimatedProgressBar } from '../components/AnimatedProgressBar'

type LeaderboardEntry = {
  address: string
  hours: number
}

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { history, loading } = useEscrowReputation(undefined, refreshKey)

  const summary = useMemo(() => {
    const totals = {
      total: history.length,
      completed: 0,
      cancelled: 0,
      pending: 0,
      totalHours: 0,
      pendingHours: 0,
    }
    const providerMap = new Map<string, number>()
    const requesterMap = new Map<string, number>()
    const participants = new Set<string>()
    let latestBlock = 0n

    history.forEach((item) => {
      participants.add(item.requester.toLowerCase())
      participants.add(item.provider.toLowerCase())
      if (item.createdBlock && item.createdBlock > latestBlock) latestBlock = item.createdBlock
      if (item.completedBlock && item.completedBlock > latestBlock) latestBlock = item.completedBlock

      switch (item.status) {
        case 'Completed':
          totals.completed += 1
          totals.totalHours += item.hours
          providerMap.set(item.provider, (providerMap.get(item.provider) ?? 0) + item.hours)
          requesterMap.set(item.requester, (requesterMap.get(item.requester) ?? 0) + item.hours)
          break
        case 'Cancelled':
          totals.cancelled += 1
          break
        default:
          totals.pending += 1
          totals.pendingHours += item.hours
          break
      }
    })

    const completionRate = totals.total > 0 ? totals.completed / totals.total : 0

    const toLeaderboard = (map: Map<string, number>): LeaderboardEntry[] =>
      Array.from(map.entries())
        .map(([address, hours]) => ({
          address,
          hours,
        }))
        .sort((a, b) => b.hours - a.hours)

    return {
      totals,
      completionRate,
      uniqueParticipants: participants.size,
      latestBlock: Number(latestBlock),
      topProviders: toLeaderboard(providerMap).slice(0, 5),
      topRequesters: toLeaderboard(requesterMap).slice(0, 5),
    }
  }, [history])

  return (
    <div className="space-y-6 page-enter">
      <h2 className="text-2xl font-semibold animate-fade-in">Analytics & Reporting</h2>
      {loading ? (
        <div className="card text-neutral-400">Loading analytics…</div>
      ) : (
        <>
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-neutral-400">Overview</div>
              <button className="btn-primary" onClick={() => setRefreshKey((n) => n + 1)}>
                Refresh
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <Metric label="Total escrows" value={summary.totals.total} />
              <Metric label="Completed" value={summary.totals.completed} />
              <Metric label="Cancelled" value={summary.totals.cancelled} />
              <Metric label="Active escrows" value={summary.totals.pending} />
              <Metric label="Completion rate" value={(summary.completionRate * 100).toFixed(1) + '%'} />
              <Metric label="Unique participants" value={summary.uniqueParticipants} />
              <Metric label="Hours exchanged" value={summary.totals.totalHours.toFixed(2)} suffix="TTK" />
              <Metric label="Active hours locked" value={summary.totals.pendingHours.toFixed(2)} suffix="TTK" />
              <Metric
                label="Average hours per completed escrow"
                value={
                  summary.totals.completed > 0
                    ? (summary.totals.totalHours / summary.totals.completed).toFixed(2)
                    : '0.00'
                }
                suffix="TTK"
              />
            </div>
            <div className="text-xs text-neutral-500 mt-3">Latest block seen: {summary.latestBlock}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Leaderboard title="Top Providers (completed hours)" entries={summary.topProviders} />
            <Leaderboard title="Top Requesters (completed hours)" entries={summary.topRequesters} />
          </div>

          <div className="card space-y-2">
            <div className="text-sm text-neutral-400">Status breakdown</div>
            <ProgressRow label="Completed" fraction={summary.totals.completed} total={summary.totals.total} color="bg-green-500" />
            <ProgressRow label="Pending" fraction={summary.totals.pending} total={summary.totals.total} color="bg-yellow-500" />
            <ProgressRow label="Cancelled" fraction={summary.totals.cancelled} total={summary.totals.total} color="bg-red-500" />
          </div>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  const isPercentage = typeof value === 'string' && value.includes('%')
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value
  const decimals = typeof value === 'string' && value.includes('.') ? 2 : 0
  
  return (
    <div className="border border-neutral-800 rounded px-3 py-2 hover:border-indigo-500 transition-all duration-300 animate-fade-in">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-white text-xl font-semibold">
        {isPercentage ? (
          <AnimatedNumber value={numValue} suffix="%" decimals={1} />
        ) : (
          <AnimatedNumber value={numValue} suffix={suffix} decimals={decimals} />
        )}
      </div>
    </div>
  )
}

function Leaderboard({ title, entries }: { title: string; entries: LeaderboardEntry[] }) {
  return (
    <div className="card space-y-2 animate-slide-in">
      <div className="text-sm text-neutral-400">{title}</div>
      {entries.length === 0 ? (
        <div className="text-xs text-neutral-500">No completed escrows yet.</div>
      ) : (
        <div className="space-y-1 text-sm">
          {entries.map((entry, idx) => (
            <div
              key={entry.address}
              className="flex justify-between items-center border border-neutral-800 rounded px-3 py-2 hover:border-indigo-500 hover:bg-neutral-800/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div>
                <div className="text-neutral-200 font-semibold">
                  #{idx + 1} · {shorten(entry.address)}
                </div>
                <div className="text-xs text-neutral-500">{entry.address}</div>
              </div>
              <div className="text-neutral-300 font-semibold">
                <AnimatedNumber value={entry.hours} suffix="TTK" decimals={2} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProgressRow({ label, fraction, total, color }: { label: string; fraction: number; total: number; color: string }) {
  const percent = total > 0 ? (fraction / total) * 100 : 0
  return (
    <div className="animate-fade-in">
      <AnimatedProgressBar percent={percent} color={color} label={label} />
    </div>
  )
}

function shorten(address: string) {
  if (!address) return 'n/a'
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}


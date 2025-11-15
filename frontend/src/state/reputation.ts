import React from 'react'
import { usePublicClient } from 'wagmi'
import { CONTRACTS } from '../lib/contracts'
import { parseAbiItem } from 'viem'

type EscrowRecord = {
  id: bigint
  requester: string
  provider: string
  amount: bigint
  createdBlock?: bigint
  releasedBlock?: bigint
  cancelledBlock?: bigint
  released?: boolean
  cancelled?: boolean
}

export type ReputationStats = {
  created: number
  completed: number
  cancelled: number
  asRequesterCompleted: number
  asProviderCompleted: number
  hoursRequested: number
  hoursProvided: number
  score: number
  grade: string
}

export type EscrowHistoryItem = {
  id: string
  role: 'requester' | 'provider' | 'observer'
  status: 'Completed' | 'Cancelled' | 'Pending'
  hours: number
  amountRaw: bigint
  createdBlock?: bigint
  completedBlock?: bigint
  requester: string
  provider: string
}

const emptyStats: ReputationStats = {
  created: 0,
  completed: 0,
  cancelled: 0,
  asRequesterCompleted: 0,
  asProviderCompleted: 0,
  hoursRequested: 0,
  hoursProvided: 0,
  score: 100,
  grade: 'Rookie',
}

const escrowCreatedEvent = parseAbiItem(
  'event EscrowCreated(uint256 indexed escrowId, address indexed requester, address indexed provider, uint256 amount)'
)
const escrowCancelledEvent = parseAbiItem(
  'event EscrowCancelled(uint256 indexed escrowId)'
)
const escrowReleasedEvent = parseAbiItem(
  'event Released(uint256 indexed escrowId, address indexed provider, uint256 amount)'
)

export function useEscrowReputation(address?: string, refreshKey = 0) {
  const client = usePublicClient()
  const publicClient = client
  const [stats, setStats] = React.useState(emptyStats)
  const [history, setHistory] = React.useState<EscrowHistoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const escrowAddress = CONTRACTS.sepolia.timeEscrow as `0x${string}`
  const lower = address?.toLowerCase()

  React.useEffect(() => {
    if (!publicClient) {
      setStats(emptyStats)
      setHistory([])
      setLoading(false)
      return
    }
    let ignore = false
    const clientInstance = publicClient
    async function load() {
      try {
        setLoading(true)
        const fromBlock = 0n
        const [createdLogs, releasedLogs, cancelledLogs] = await Promise.all([
          clientInstance.getLogs({ address: escrowAddress, event: escrowCreatedEvent, fromBlock }),
          clientInstance.getLogs({ address: escrowAddress, event: escrowReleasedEvent, fromBlock }),
          clientInstance.getLogs({ address: escrowAddress, event: escrowCancelledEvent, fromBlock }),
        ])

        const map = new Map<bigint, EscrowRecord>()

        createdLogs.forEach((log) => {
          const args = log.args
          if (!args) return
          const id = args.escrowId as bigint
          map.set(id, {
            id,
            requester: (args.requester as string).toLowerCase(),
            provider: (args.provider as string).toLowerCase(),
            amount: args.amount as bigint,
            createdBlock: log.blockNumber,
          })
        })

        releasedLogs.forEach((log) => {
          const args = log.args
          if (!args) return
          const id = args.escrowId as bigint
          const entry = map.get(id) ?? {
            id,
            requester: '',
            provider: '',
            amount: args.amount as bigint,
          }
          entry.released = true
          entry.releasedBlock = log.blockNumber
          entry.provider = (args.provider as string).toLowerCase()
          entry.amount = args.amount as bigint
          map.set(id, entry)
        })

        cancelledLogs.forEach((log) => {
          const args = log.args
          if (!args) return
          const id = args.escrowId as bigint
          const entry = map.get(id) ?? {
            id,
            requester: '',
            provider: '',
            amount: 0n,
          }
          entry.cancelled = true
          entry.cancelledBlock = log.blockNumber
          map.set(id, entry)
        })

        if (ignore) return

        const aggregated = { ...emptyStats }
        const historyItems: EscrowHistoryItem[] = []

        const amountToHours = (amount: bigint) =>
          Number(amount) / 1e18

        map.forEach((entry) => {
          const role: EscrowHistoryItem['role'] =
            lower && entry.requester === lower
              ? 'requester'
              : lower && entry.provider === lower
              ? 'provider'
              : 'observer'

          const status: EscrowHistoryItem['status'] = entry.released
            ? 'Completed'
            : entry.cancelled
            ? 'Cancelled'
            : 'Pending'

          const hours = amountToHours(entry.amount)

          historyItems.push({
            id: entry.id.toString(),
            role,
            status,
            hours,
            amountRaw: entry.amount,
            createdBlock: entry.createdBlock,
          completedBlock: entry.releasedBlock,
          requester: entry.requester,
          provider: entry.provider,
          })

          if (!lower) return
          const isRequester = entry.requester === lower
          const isProvider = entry.provider === lower

          if (isRequester) {
            aggregated.created += 1
          }
          if (entry.released && (isRequester || isProvider)) {
            aggregated.completed += 1
          }
          if (isRequester && entry.released) {
            aggregated.asRequesterCompleted += 1
            aggregated.hoursRequested += hours
          }
          if (isProvider && entry.released) {
            aggregated.asProviderCompleted += 1
            aggregated.hoursProvided += hours
          }
          if (isRequester && entry.cancelled) {
            aggregated.cancelled += 1
          }
        })

        if (lower) {
          const baseScore = 100
          const score =
            baseScore +
            aggregated.completed * 10 +
            aggregated.asProviderCompleted * 5 -
            aggregated.cancelled * 5
          aggregated.score = Math.max(0, Math.round(score))
          aggregated.grade =
            aggregated.score >= 170
              ? 'Expert'
              : aggregated.score >= 130
              ? 'Pro'
              : aggregated.score >= 100
              ? 'Rookie'
              : 'Newcomer'
        }

        historyItems.sort((a, b) => Number((b.createdBlock ?? 0n) - (a.createdBlock ?? 0n)))

        setHistory(historyItems)
        setStats(aggregated)
      } catch (err) {
        console.error('Failed to load escrow reputation', err)
        setHistory([])
        setStats(emptyStats)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [publicClient, escrowAddress, lower, refreshKey])

  return { loading, stats, history }
}


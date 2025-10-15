import React, { useMemo } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { CONTRACTS } from '../lib/contracts'

export default function EscrowHistory() {
  const { address } = useAccount()
  const client = usePublicClient()
  const escrow = CONTRACTS.sepolia.timeEscrow as `0x${string}`

  const [logs, setLogs] = React.useState<any[]>([])

  React.useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const topicsCreated = [
          // keccak256("EscrowCreated(uint256,address,address,uint256)")
          '0x0f12b9648d4996a0bce9c1f177f9b9c22a98c1e4e7ef6f3f9b9737b25bf9e8a7'
        ]
        const topicsReleased = [
          // keccak256("Released(uint256,address,uint256)")
          '0xe9d7f9c1c500c2acb1f8d3c6a19e50405f9bb499f7e98a3d8620a4a9e5a3b0a9'
        ]
        const topicsCancelled = [
          // keccak256("EscrowCancelled(uint256)")
          '0x8c21f1c8f9b278ad8d67e8a4b7f0b6127fef3f65b3f6f0b4b9d0de9c1e45d4f2'
        ]

        const fromBlock = '0x0'
        const [created, released, cancelled] = await Promise.all([
          client.getLogs({ address: escrow, fromBlock, topics: [topicsCreated] }),
          client.getLogs({ address: escrow, fromBlock, topics: [topicsReleased] }),
          client.getLogs({ address: escrow, fromBlock, topics: [topicsCancelled] }),
        ])

        const all = [...created, ...released, ...cancelled].sort((a,b)=> Number(a.blockNumber) - Number(b.blockNumber))
        if (!ignore) setLogs(all)
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { ignore = true }
  }, [client, escrow])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Escrow History</h2>
      <div className="card">
        {logs.length === 0 ? (
          <div className="text-neutral-400 text-sm">No events yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={`${l.blockHash}-${l.transactionHash}-${l.logIndex}`} className="text-sm flex items-center justify-between gap-3">
                <div className="font-mono truncate">{l.topics[0].slice(0,10)}…</div>
                <a className="link-nav" target="_blank" href={`https://sepolia.etherscan.io/tx/${l.transactionHash}`}>View on Etherscan</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



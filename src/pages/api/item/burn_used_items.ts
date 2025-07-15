// pages/api/item/burn_used_items.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { publicClient } from '@/lib/walletClient'
import { walletClient } from '@/lib/walletClient.server'
import gameItemAbi from '@/abi/GameItem.json'

const GAME_ITEM_ADDRESS = process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { address, usedItems } = req.body as {
      address: `0x${string}`
      usedItems: { tokenId: number; uses: number }[]
    }

    if (!address || !Array.isArray(usedItems)) {
      return res.status(400).json({ error: 'Missing address or usedItems[]' })
    }

    const burnResults = []

    for (const { tokenId, uses } of usedItems) {
      try {
        const balance = await publicClient.readContract({
          address: GAME_ITEM_ADDRESS,
          abi: gameItemAbi.abi,
          functionName: 'balanceOf',
          args: [address, BigInt(tokenId)],
        })
    
        const burnAmount = BigInt(Math.min(Number(balance), uses))
    
        if (burnAmount > 0n) {
          const txHash = await walletClient.writeContract({
            address: GAME_ITEM_ADDRESS,
            abi: gameItemAbi.abi,
            functionName: 'burn',
            args: [address, BigInt(tokenId), burnAmount],
          })
    
          await publicClient.waitForTransactionReceipt({ hash: txHash })
    
          burnResults.push({ tokenId, status: 'burned', amount: burnAmount.toString(), txHash })
        } else {
          burnResults.push({ tokenId, status: 'skipped (no balance or zero uses)' })
        }
      } catch (burnErr: any) {
        console.error(`Burn error for token ${tokenId}:`, burnErr)
        burnResults.push({ tokenId, status: 'error', error: burnErr.message })
      }
    }    

    res.status(200).json({ success: true, results: burnResults })
  } catch (err: any) {
    console.error('Burn handler error:', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

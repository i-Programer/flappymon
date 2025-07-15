// pages/api/shop/buy.ts
import { parseSignature, parseUnits } from 'viem'
import type { NextApiRequest, NextApiResponse } from 'next'
import { publicClient } from '@/lib/walletClient'
import {walletClient } from '@/lib/walletClient.server'
import gameItemAbi from '@/abi/GameItem.json'

const GAME_ITEM_ADDRESS = process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { address, id, amount, permit } = req.body

    if (!address || id == null || !amount || !permit) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { deadline, signature } = permit
    const { v, r, s } = parseSignature(signature)

    const flapCost = parseUnits('80', 18) * BigInt(amount)

    // ✅ Step 1: Call buyItemWithPermit instead of separate permit + buy
    const txHash = await walletClient.writeContract({
      address: GAME_ITEM_ADDRESS,
      abi: gameItemAbi.abi,
      functionName: 'buyItemWithPermit',
      args: [
        BigInt(id),
        BigInt(amount),
        flapCost,
        BigInt(deadline),
        v,
        r,
        s,
      ],
    })

    // Optional: wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash })

    res.status(200).json({ success: true, txHash })
  } catch (err: any) {
    console.error('Buy error:', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

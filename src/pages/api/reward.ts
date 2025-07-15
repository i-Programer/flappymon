// pages/api/reward.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { walletClient } from '@/lib/walletClient.server'
import { parseUnits } from 'viem'
import flapAbi from '@/abi/FLAPTOKEN.json'

const FLAP_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const REWARD_RATE = 0.5 // 0.5 FLAP per point

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { score, address } = req.body

  if (!address || typeof score !== 'number' || score <= 0) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const flapAmount = parseUnits((score * REWARD_RATE).toString(), 18)

  try {
    const txHash = await walletClient.writeContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'mint',
      args: [address, flapAmount],
    })

    return res.status(200).json({ success: true, txHash })
  } catch (err: any) {
    console.error('[Reward Error]', err)
    return res.status(500).json({ error: err.message || 'Reward mint failed' })
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFlappymons, getUserSkills, getUserItems } from '@/lib/nft'
import { publicClient } from '@/lib/viemClient'
import { flapTokenAbi, flapTokenAddress } from '@/lib/contracts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address, type } = req.query

  // Validate address
  if (typeof address !== 'string' || !address.startsWith('0x')) {
    return res.status(400).json({ error: 'Invalid or missing address' })
  }

  try {
    const wallet = address as `0x${string}`

    // Type not passed → fetch all
    if (!type) {
      const [flappymons, skills, items, balanceRaw] = await Promise.all([
        getUserFlappymons(wallet),
        getUserSkills(wallet),
        getUserItems(wallet),
        publicClient.readContract({
          address: flapTokenAddress,
          abi: flapTokenAbi.abi,
          functionName: 'balanceOf',
          args: [wallet],
        }) as Promise<bigint>,
      ])

      return res.status(200).json({ flappymons, skills, items, balance: balanceRaw.toString() })
    }

    // Type passed → only return specific
    switch (type) {
      case 'flappymon': {
        const flappymons = await getUserFlappymons(wallet)
        return res.status(200).json({ flappymons })
      }
      case 'skills': {
        const skills = await getUserSkills(wallet)
        return res.status(200).json({ skills })
      }
      case 'items': {
        const items = await getUserItems(wallet)
        return res.status(200).json({ items })
      }
      default:
        return res.status(400).json({ error: 'Invalid type. Must be one of: flappymon, skills, items' })
    }
  } catch (err: any) {
    console.error(`[nft/user.ts] Failed to fetch ${type || 'all'} data for ${address}:`, err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

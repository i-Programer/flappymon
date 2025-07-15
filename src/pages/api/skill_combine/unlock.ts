// pages/api/skill_combine/unlock.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import { getSkillMetadata, burnSkillNFT, mintSkillNFT } from '@/lib/web3'

type Rarity = 'common' | 'rare' | 'epic'

const SKILL_POOLS: Record<Rarity, number[]> = {
  common: [0, 4], // Dash, Floating
  rare: [1, 2],   // Disappear, Gap Manipulation
  epic: [3],      // Pipe Destroyer
}

const NEXT_RARITY: Partial<Record<Rarity, Rarity>> = {
  common: 'rare',
  rare: 'epic',
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const { address, tokenIds, signature } = req.body

    if (!address || !tokenIds || tokenIds.length !== 2 || !signature) {
      return res.status(400).json({ error: 'Missing or invalid parameters' })
    }

    const message = `Unlock skill: ${tokenIds[0]}, ${tokenIds[1]}`
    const isValid = await verifyMessage({ address, message, signature })
    if (!isValid) return res.status(401).json({ error: 'Invalid signature' })

    const metaA = await getSkillMetadata(tokenIds[0])
    const metaB = await getSkillMetadata(tokenIds[1])

    if (metaA.skillType === metaB.skillType) {
      return res.status(400).json({ error: 'Skills must be different type' })
    }

    const rarityA = getRarity(metaA.skillType)
    const rarityB = getRarity(metaB.skillType)

    if (rarityA !== rarityB) {
      return res.status(400).json({ error: 'Skills must be same rarity' })
    }

    const nextRarity = NEXT_RARITY[rarityA]
    if (!nextRarity) {
      return res.status(400).json({ error: 'Cannot unlock from this rarity' })
    }

    const pool = SKILL_POOLS[nextRarity]
    const newSkillType = pool[Math.floor(Math.random() * pool.length)]

    // Burn old NFTs
    await burnSkillNFT(tokenIds[0])
    await burnSkillNFT(tokenIds[1])

    // Mint new skill at level 1
    const txHash = await mintSkillNFT(address, newSkillType, 1)

    return res.status(200).json({
      success: true,
      unlockedSkillType: newSkillType,
      rarity: nextRarity,
      txHash,
    })
  } catch (err: any) {
    console.error('[Skill Unlock Error]', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

// Helper for rarity detection
function getRarity(skillType: number): 'common' | 'rare' | 'epic' {
  if ([0, 4].includes(skillType)) return 'common'
  if ([1, 2].includes(skillType)) return 'rare'
  return 'epic'
}

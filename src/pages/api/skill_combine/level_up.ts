// pages/api/skill_combine/level_up.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import { getSkillMetadata, burnSkillNFT, mintSkillNFT } from '@/lib/web3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const { address, tokenIds, signature } = req.body

    if (!address || !tokenIds || tokenIds.length !== 2 || !signature) {
      return res.status(400).json({ error: 'Missing or invalid parameters' })
    }

    const message = `Level up skills: ${tokenIds[0]}, ${tokenIds[1]}`
    const isValid = await verifyMessage({ address, message, signature })
    if (!isValid) return res.status(401).json({ error: 'Invalid signature' })

    const metaA = await getSkillMetadata(tokenIds[0])
    const metaB = await getSkillMetadata(tokenIds[1])

    if (metaA.skillType !== metaB.skillType || metaA.skillLevel !== metaB.skillLevel) {
      return res.status(400).json({ error: 'Skills must be same type and level' })
    }

    await burnSkillNFT(tokenIds[0])
    await burnSkillNFT(tokenIds[1])

    const newLevel = metaA.skillLevel + 1
    const txHash = await mintSkillNFT(address, metaA.skillType, newLevel)

    return res.status(200).json({
      success: true,
      skillType: metaA.skillType,
      newLevel,
      txHash,
    })
  } catch (err: any) {
    console.error('[Skill Level Up Error]', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

import { NextApiRequest, NextApiResponse } from 'next'
import { walletClient } from '@/lib/walletClient.server'
import skillMarketplaceABI from '@/abi/SkillMarketplace.json'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tokenId } = req.body

    const txHash = await walletClient.writeContract({
      address: process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`,
      abi: skillMarketplaceABI.abi,
      functionName: 'cancelListing',
      args: [BigInt(tokenId)],
    })

    res.status(200).json({ txHash })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

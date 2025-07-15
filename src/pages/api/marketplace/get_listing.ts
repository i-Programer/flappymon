import { NextApiRequest, NextApiResponse } from 'next'
import { publicClient } from '@/lib/walletClient.server'
import skillMarketplaceABI from '@/abi/SkillMarketplace.json'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tokenId } = req.query

    const result = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`,
        abi: skillMarketplaceABI.abi,
        functionName: 'getListing',
        args: [BigInt(tokenId as string)],
      }) as [string, bigint];
      
      const [seller, price] = result;      

    res.status(200).json({ seller, price: price.toString() })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

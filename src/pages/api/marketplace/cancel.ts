import { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import { walletClient } from '@/lib/walletClient.server'
import skillMarketplaceAbi from '@/abi/SkillMarketplace.json'

const SKILL_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tokenId, address, signature, message } = req.body
  if (!tokenId || !address || !signature || !message) {
    return res.status(400).json({ error: 'Missing parameters' })
  }

  const valid = await verifyMessage({ address, message, signature })
  if (!valid) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  try {
    const txHash = await walletClient.writeContract({
      address: SKILL_MARKETPLACE_ADDRESS,
      abi: skillMarketplaceAbi.abi,
      functionName: 'cancelListing',
      args: [tokenId]
    })

    return res.status(200).json({ txHash })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

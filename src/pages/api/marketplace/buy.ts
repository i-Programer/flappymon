import { parseSignature, parseUnits, UserRejectedRequestError } from 'viem'
import { NextApiRequest, NextApiResponse } from 'next'
import { walletClient, publicClient } from '@/lib/walletClient.server'

import flapAbi from '@/abi/FLAPTOKEN.json'
import skillMarketplaceAbi from '@/abi/SkillMarketplace.json'

const FLAP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { address, tokenId, permit, price } = req.body

    if (!address || !tokenId || !permit || !permit.signature || !permit.deadline || !price) {
      return res.status(400).json({ error: 'Missing required permit fields' })
    }
       

    if (!price || isNaN(price)) {
      return res.status(400).json({ error: 'Invalid price' })
    }    

    // ✅ Step 2: Parse signature into v, r, s
    const { v, r, s } = parseSignature(permit.signature)

    // ✅ Step 3: Call permit()
    const permitTxHash = await walletClient.writeContract({
      address: FLAP_TOKEN_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'permit',
      args: [
        address,
        MARKETPLACE_ADDRESS,
        BigInt(permit.value),
        BigInt(permit.deadline),
        v,
        r,
        s,
      ],
    })
    

    // ✅ Step 4: Wait for permit tx to be mined
    await publicClient.waitForTransactionReceipt({ hash: permitTxHash })

    // ✅ Step 5: Call buySkill()
    const txHash = await walletClient.writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: skillMarketplaceAbi.abi,
      functionName: 'buySkill',
      args: [BigInt(tokenId)],
    })

    return res.status(200).json({ success: true, txHash })

  } catch (err: any) {
    console.error('[Marketplace Buy Error]', err)

    if (err instanceof UserRejectedRequestError || err?.name === 'UserRejectedRequestError') {
      return res.status(400).json({ error: 'User rejected the transaction' })
    }

    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

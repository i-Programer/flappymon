import { NextApiRequest, NextApiResponse } from 'next'
import { walletClient, publicClient, backendAccount } from '@/lib/walletClient.server'
import skillNFTAbi from '@/abi/SkillNFT.json'
import skillMarketplaceAbi from '@/abi/SkillMarketplace.json'
import { parseEther } from 'viem'

const SKILLNFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tokenId, price } = req.body
    if (!tokenId || !price) {
      return res.status(400).json({ error: 'Missing tokenId or price' })
    }

    const tokenIdBig = BigInt(tokenId)
    const priceInWei = parseEther(price.toString())

    // === Step 1: Check ownership
    const owner = await publicClient.readContract({
      address: SKILLNFT_ADDRESS,
      abi: skillNFTAbi.abi,
      functionName: 'ownerOf',
      args: [tokenIdBig],
    }) as `0x${string}`

    if (owner.toLowerCase() !== backendAccount.address.toLowerCase()) {
      return res.status(400).json({ error: 'Backend wallet does not own this skill NFT.' })
    }

    // === Step 2: Check approval
    const approved = await publicClient.readContract({
      address: SKILLNFT_ADDRESS,
      abi: skillNFTAbi.abi,
      functionName: 'getApproved',
      args: [tokenIdBig],
    }) as `0x${string}`

    if (approved.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase()) {
      console.log('[Approval] Approving marketplace for token', tokenId)

      const approvalTx = await walletClient.writeContract({
        address: SKILLNFT_ADDRESS,
        abi: skillNFTAbi.abi,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, tokenIdBig],
        account: backendAccount,
      })

      console.log('[Approval] TX hash:', approvalTx)
      await publicClient.waitForTransactionReceipt({ hash: approvalTx })
    } else {
      console.log('[Approval] Already approved.')
    }

    // === Step 3: List the skill
    const txHash = await walletClient.writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: skillMarketplaceAbi.abi,
      functionName: 'listSkill',
      args: [tokenIdBig, priceInWei],
      account: backendAccount,
    })

    console.log('[Listing] TX hash:', txHash)
    res.status(200).json({ txHash })

  } catch (err: any) {
    console.error('[List Error]', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

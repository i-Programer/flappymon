import { NextApiRequest, NextApiResponse } from 'next'
import { walletClient, publicClient, backendAccount } from '@/lib/walletClient.server'
import skillNFTAbi from '@/abi/SkillNFT.json'
import skillMarketplaceAbi from '@/abi/SkillMarketplace.json'
import { parseEther,recoverMessageAddress } from 'viem'

const SKILLNFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tokenId, price, address, signature } = req.body

    if (!tokenId || !price || !address || !signature) {
      return res.status(400).json({ error: 'Missing parameters' })
    }

    const tokenIdBig = BigInt(tokenId)
    const priceInWei = parseEther(price.toString())

    // === Step 1: Verify signature ===
    const message = `Sell skill NFT ${tokenId} for ${price} FLAP`
    const recovered = await recoverMessageAddress({
      message,
      signature,
    })

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // === Step 2: Ensure user owns the NFT ===
    const currentOwner = await publicClient.readContract({
      address: SKILLNFT_ADDRESS,
      abi: skillNFTAbi.abi,
      functionName: 'ownerOf',
      args: [tokenIdBig],
    }) as string

    if (currentOwner.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Not your NFT' })
    }

    // === Step 3: Check if already approved to marketplace ===
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
    } else {
      console.log('[Approval] Already approved.')
    }

    // === Step 4: List the skill ===
    const txHash = await walletClient.writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: skillMarketplaceAbi.abi,
      functionName: 'listSkill',
      args: [address, tokenIdBig, priceInWei],
      account: backendAccount,
    })

    console.log('[Listing] TX hash:', txHash)
    res.status(200).json({ txHash })

  } catch (err: any) {
    console.error('[List Error]', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

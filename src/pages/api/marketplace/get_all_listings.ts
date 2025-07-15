import type { NextApiRequest, NextApiResponse } from 'next'
import { publicClient } from '@/lib/walletClient.server'
import { parseAbi } from 'viem'

const SKILL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
const SKILL_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`

const skillNFTABI = parseAbi([
  'function nextTokenId() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getSkillData(uint256 tokenId) view returns (uint8 skillType, uint8 skillLevel)',
  'function tokenURI(uint256 tokenId) view returns (string)',
])

const skillMarketplaceABI = parseAbi([
  'function getListing(uint256 tokenId) view returns (address seller, uint256 price)'
])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const nextTokenId = await publicClient.readContract({
      address: SKILL_NFT_ADDRESS,
      abi: skillNFTABI,
      functionName: 'nextTokenId',
    }) as bigint

    const listings = []

    for (let i = 0n; i < nextTokenId; i++) {
      const tokenId = i

      try {
        const [owner, [skillType, skillLevel], tokenURI, [seller, price]] = await Promise.all([
          publicClient.readContract({
            address: SKILL_NFT_ADDRESS,
            abi: skillNFTABI,
            functionName: 'ownerOf',
            args: [tokenId],
          }),
          publicClient.readContract({
            address: SKILL_NFT_ADDRESS,
            abi: skillNFTABI,
            functionName: 'getSkillData',
            args: [tokenId],
          }),
          publicClient.readContract({
            address: SKILL_NFT_ADDRESS,
            abi: skillNFTABI,
            functionName: 'tokenURI',
            args: [tokenId],
          }),
          publicClient.readContract({
            address: SKILL_MARKETPLACE_ADDRESS,
            abi: skillMarketplaceABI,
            functionName: 'getListing',
            args: [tokenId],
          }),
        ])

        listings.push({
          tokenId: Number(tokenId),
          owner: owner as string,
          skillType: Number(skillType),
          skillLevel: Number(skillLevel),
          image: tokenURI as string,
          listed: BigInt(price) > 0n,
          seller: seller as string,
          price: price.toString(),
        })
      } catch (err) {
        // Token belum dimint / error — lewatin aja
        continue
      }
    }

    res.status(200).json(listings)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

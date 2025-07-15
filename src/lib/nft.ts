import { publicClient } from '@/lib/viemClient'
import flappymonAbi from '@/abi/Flappymon.json'
import skillNftAbi from '@/abi/SkillNFT.json'

const FLAPPY_ADDRESS = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`
const SKILL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`

export async function getUserFlappymons(address: `0x${string}`) {
  // ✅ Directly fetch all tokenIds using tokensOfOwner()
  const tokenIds = await publicClient.readContract({
    address: FLAPPY_ADDRESS,
    abi: flappymonAbi.abi,
    functionName: 'tokensOfOwner',
    args: [address],
  }) as bigint[]
  // console.log(tokenIds)

  const metadataList = await Promise.all(
    tokenIds.map(async (id) => {
      const rarity = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenRarity',
        args: [id],
      }) as number
      
      const tokenUri = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenURI',
        args: [id],
      }) as string

      console.log(tokenUri)

      const res = await fetch(tokenUri)
      const metadata = await res.json()
    
      return { tokenId: Number(id), rarity, ...metadata }
    })
  )

  return metadataList
}


export async function getUserSkills(address: `0x${string}`) {
  const owned: {
    tokenId: number
    skillType: number
    skillLevel: number
  }[] = []

  // naive scan from 0 to nextTokenId (on-chain)
  const nextTokenId = await publicClient.readContract({
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'nextTokenId',
  }) as bigint

  for (let i = 0n; i < nextTokenId; i++) {
    try {
      const owner = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'ownerOf',
        args: [i],
      }) as `0x${string}`

      if (owner.toLowerCase() !== address.toLowerCase()) continue

      const skillType = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'skillType',
        args: [i],
      }) as number

      const skillLevel = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'skillLevel',
        args: [i],
      }) as number

      owned.push({
        tokenId: Number(i),
        skillType,
        skillLevel,
      })
    } catch (e) {
      // probably not minted, skip
      continue
    }
  }

  return owned
}

import { publicClient } from '@/lib/viemClient'
import flappymonAbi from '@/abi/Flappymon.json'

const FLAPPY_ADDRESS = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`

export async function getUserFlappymons(address: `0x${string}`) {
  // ✅ Directly fetch all tokenIds using tokensOfOwner()
  const tokenIds = await publicClient.readContract({
    address: FLAPPY_ADDRESS,
    abi: flappymonAbi.abi,
    functionName: 'tokensOfOwner',
    args: [address],
  }) as bigint[]

  const metadataList = await Promise.all(
    tokenIds.map(async (id) => {
      const tokenUri = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenURI',
        args: [id],
      }) as string

      const res = await fetch(tokenUri)
      const metadata = await res.json()

      const rarity = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenRarity',
        args: [id],
      }) as number
      

      return { tokenId: Number(id), rarity, ...metadata }
    })
  )

  return metadataList
}

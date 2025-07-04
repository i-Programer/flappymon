import { publicClient } from '@/lib/viemClient'
import flappymonAbi from '@/abi/Flappymon.json'

const FLAPPY_ADDRESS = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`

export async function getUserFlappymons(address: `0x${string}`) {
  const balance = await publicClient.readContract({
    address: FLAPPY_ADDRESS,
    abi: flappymonAbi.abi,
    functionName: 'balanceOf',
    args: [address],
  }) as bigint

  const tokenIds: number[] = []
  for (let i = 0n; i < balance; i++) {
    const tokenId = await publicClient.readContract({
      address: FLAPPY_ADDRESS,
      abi: flappymonAbi.abi,
      functionName: 'tokenOfOwnerByIndex',
      args: [address, i],
    }) as bigint
    tokenIds.push(Number(tokenId))
  }

  const metadataList = await Promise.all(
    tokenIds.map(async (id) => {
      const tokenUri = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenURI',
        args: [BigInt(id)],
      }) as string

      const res = await fetch(tokenUri)
      const metadata = await res.json()

      return { tokenId: id, ...metadata }
    })
  )

  return metadataList
}

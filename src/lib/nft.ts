import { publicClient } from '@/lib/walletClient'
import flappymonAbi from '@/abi/Flappymon.json'
import skillNftAbi from '@/abi/SkillNFT.json'
import gameItemAbi from '@/abi/GameItem.json'

const FLAPPY_ADDRESS = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`
const SKILL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
const GAME_ITEM_ADDRESS = process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`

const ALL_ITEM_IDS = [0, 1, 2, 3] // update this list if needed

const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'] // adjust if needed
export async function getUserFlappymons(address: `0x${string}`) {
  const tokenIds = await publicClient.readContract({
    address: FLAPPY_ADDRESS,
    abi: flappymonAbi.abi,
    functionName: 'tokensOfOwner',
    args: [address],
  }) as bigint[]

  const metadataList = await Promise.all(
    tokenIds.map(async (id) => {
      const rarity = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenRarity',
        args: [id],
      }) as number

      const rarityName = RARITY_NAMES[rarity] ?? 'Unknown'

      const tokenUri = await publicClient.readContract({
        address: FLAPPY_ADDRESS,
        abi: flappymonAbi.abi,
        functionName: 'tokenURI',
        args: [id],
      }) as string

      const res = await fetch(tokenUri)
      const metadata = await res.json()

      return {
        tokenId: Number(id),
        rarity,
        rarityName,
        ...metadata,
      }
    })
  )

  return metadataList
}

const skillNames = [
  "Dash",
  "Disappear",
  "Gap Manipulation",
  "Pipe Destroyer",
  "Floating"
];
export async function getUserSkills(address: `0x${string}`) {
  const owned: {
    tokenId: number
    skillType: number
    skillLevel: number
    name: string
  }[] = [];

  const nextTokenId = await publicClient.readContract({
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'nextTokenId',
  }) as bigint;

  for (let i = 0n; i < nextTokenId; i++) {
    try {
      const owner = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'ownerOf',
        args: [i],
      }) as `0x${string}`;

      if (owner.toLowerCase() !== address.toLowerCase()) continue;

      const skillType = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'skillType',
        args: [i],
      }) as number;

      const skillLevel = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'skillLevel',
        args: [i],
      }) as number;

      owned.push({
        tokenId: Number(i),
        skillType,
        skillLevel,
        name: skillNames[skillType] ?? 'Unknown', // ← Injected here
      });
    } catch (e) {
      continue;
    }
  }

  return owned;
}

export async function getUserItems(address: `0x${string}`) {
  const balances = await Promise.all(
    ALL_ITEM_IDS.map(async (id) => {
      const balance = await publicClient.readContract({
        address: GAME_ITEM_ADDRESS,
        abi: gameItemAbi.abi,
        functionName: 'balanceOf',
        args: [address, BigInt(id)],
      });

      return {
        tokenId: id,
        uses: Number(balance),
      }
    })
  )

  return balances.filter(item => item.uses > 0) // Optional: filter out 0 balances
}
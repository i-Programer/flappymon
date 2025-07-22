export const flapTokenAddress = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
export const flappymonAddress = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`
export const gameItemAddress = process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`
export const skillNFTAddress = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
export const skillMarketplaceAddress = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`

export { default as gameItemAbi } from "@/abi/GameItem.json"
export { default as flapTokenAbi } from "@/abi/FLAPTOKEN.json"
export { default as skillNFTAbi } from "@/abi/SkillNFT.json"
export { default as flappymonAbi } from "@/abi/Flappymon.json"
export { default as skillMarketplaceAbi } from "@/abi/SkillMarketplace.json"
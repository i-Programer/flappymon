export const flapTokenAddress = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
export const flappymonAddress = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`
export const gameItemAddress = process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`

export { default as gameItemAbi } from "@/abi/GameItem.json"
export { default as flapTokenAbi } from "@/abi/FLAPTOKEN.json"
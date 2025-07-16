// src/lib/web3.ts
import { createWalletClient, http, parseUnits } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

import { publicClient } from '@/lib/viemClient' // you'll define this once for reading
import flapAbi from '@/abi/FLAPTOKEN.json'
import flappymonAbi from '@/abi/Flappymon.json'
import skillNftAbi from '@/abi/SkillNFT.json'

// === ENV CONFIG ===
const FLAP_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const FLAPPYMON_ADDRESS = process.env.NEXT_PUBLIC_FLAPPYMON_ADDRESS as `0x${string}`
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
const SKILL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`

// Backend wallet
const backendAccount = privateKeyToAccount(PRIVATE_KEY)

const walletClient = createWalletClient({
  account: backendAccount,
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
})

// === HELPERS ===

// 1. Get $FLAP balance of user
export async function getFlapBalance(user: `0x${string}`): Promise<bigint> {
    const result = await publicClient.readContract({
        address: FLAP_ADDRESS,
        abi: flapAbi.abi,
        functionName: 'balanceOf',
        args: [user],
      })
    
      return result as bigint
}

// 2. Transfer $FLAP from user to backend (backend must be approved first)
export async function transferFlapFromUser(user: `0x${string}`, amount: bigint) {
  return walletClient.writeContract({
    address: FLAP_ADDRESS,
    abi: flapAbi.abi,
    functionName: 'transferFrom',
    args: [user, backendAccount.address, amount],
  })
}

// 3. Mint Flappymon NFT
export async function mintNFT(to: `0x${string}`, rarity: number): Promise<string> {
    const { request } = await publicClient.simulateContract({
      account: backendAccount,
      address: FLAPPYMON_ADDRESS,
      abi: flappymonAbi.abi,
      functionName: 'safeMint',
      args: [to, rarity],
    })
  
    const hash = await walletClient.writeContract(request)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
    return receipt.transactionHash
  }
  
// Mint $FLAP to user (from backend wallet)
export async function mintFlap(to: `0x${string}`, amount: bigint): Promise<string> {
  const { request } = await publicClient.simulateContract({
    account: backendAccount,
    address: FLAP_ADDRESS,
    abi: flapAbi.abi,
    functionName: 'mint',
    args: [to, amount],
  })

  const txHash = await walletClient.writeContract(request)
  return txHash
}

export async function mintSkillNFT(to: `0x${string}`, skillType: number, skillLevel: number) {
  const txHash = await walletClient.writeContract({
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'safeMint',
    args: [to, skillType, skillLevel],
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

export async function getSkillMetadata(tokenId: number): Promise<{ skillType: number; skillLevel: number }> {
  const [skillType, skillLevel] = await publicClient.readContract({
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'getSkillData', // ensure your contract supports this
    args: [tokenId],
  }) as [number, number]

  return { skillType, skillLevel }
}

export async function burnSkillNFT(tokenId: number): Promise<string> {
  const txHash = await walletClient.writeContract({
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'burn',
    args: [tokenId],
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

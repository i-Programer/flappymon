// utils/skillNftApproval.ts
import { readContract, writeContract } from '@wagmi/core'
import skillNftAbi from '@/abi/SkillNFT.json'
import { config } from '@/lib/wagmi' // make sure you have your wagmi config here

const SKILL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS as `0x${string}`

// 1. Check approval status
export async function isApprovedForAll(owner: `0x${string}`): Promise<boolean> {
  return readContract(config, {
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'isApprovedForAll',
    args: [owner, BACKEND_WALLET],
  }) as Promise<boolean>
}

// 2. Ask user to approve backend wallet
export async function approveBackendOperator(): Promise<`0x${string}`> {
  return writeContract(config, {
    address: SKILL_NFT_ADDRESS,
    abi: skillNftAbi.abi,
    functionName: 'setApprovalForAll',
    args: [BACKEND_WALLET, true],
  })
}

import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
export const backendAccount = privateKeyToAccount(PRIVATE_KEY)

export const walletClient = createWalletClient({
  account: backendAccount,
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
})

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
})

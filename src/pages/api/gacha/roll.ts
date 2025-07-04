// pages/api/gacha/roll.ts
import { verifyMessage, parseUnits, parseSignature, UserRejectedRequestError } from 'viem'
import { mintNFT, transferFlapFromUser } from '@/lib/web3'
import type { NextApiRequest, NextApiResponse } from 'next'

import flapAbi from '@/abi/FLAPTOKEN.json'
import { walletClient, publicClient } from '@/lib/walletClient'

const FLAP_COST = parseUnits('50', 18) // 50 $FLAP
const FLAP_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  console.log('[DEBUG] BACKEND_WALLET in API:', BACKEND_WALLET)
  console.log('[DEBUG] Wallet client account:', walletClient.account.address)

  try {
    const { address, signature, timestamp, permit } = req.body

    if (!address || !signature || !timestamp || !permit) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const message = `Roll gacha at ${timestamp}`
    const isValid = await verifyMessage({ address, message, signature })

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // ✅ Step 1: Parse permit signature
    const { v, r, s } = parseSignature(permit.signature)

    console.log('[PERMIT] Calling permit with:', {
      owner: address,
      spender: BACKEND_WALLET,
      value: FLAP_COST.toString(),
      deadline: permit.deadline.toString(),
      v,
      r,
      s,
    })

    // ✅ Step 2: Call permit() to approve backend to spend 50 $FLAP
    const permitTxHash = await walletClient.writeContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'permit',
      args: [
        address,
        BACKEND_WALLET,
        FLAP_COST,
        BigInt(permit.deadline),
        v,
        r,
        s,
      ],
    })

    // ✅ Step 3: Wait for permit tx to be mined
    await publicClient.waitForTransactionReceipt({ hash: permitTxHash })

    // ✅ Step 4: Transfer 50 $FLAP from player to backend
    await transferFlapFromUser(address, FLAP_COST)

    // ✅ Step 5: Random rarity
    const rarity = Math.floor(Math.random() * 4)

    // ✅ Step 6: Mint NFT
    const txHash = await mintNFT(address, rarity)

    return res.status(200).json({
      success: true,
      rarity,
      txHash,
    })

  } catch (err: any) {
    console.error('[Gacha Error]', err)
  
    // === Detect if user rejected the MetaMask request ===
    if (err instanceof UserRejectedRequestError || err?.name === 'UserRejectedRequestError') {
      return res.status(400).json({ error: 'User rejected the transaction' })
    }
  
    // fallback for other errors
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

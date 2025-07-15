// pages/api/skill_gacha/roll.ts
import { verifyMessage, parseSignature, parseUnits, UserRejectedRequestError } from 'viem'
import type { NextApiRequest, NextApiResponse } from 'next'

import { walletClient, publicClient } from '@/lib/walletClient.server'
import { transferFlapFromUser, mintSkillNFT } from '@/lib/web3'

import flapAbi from '@/abi/FLAPTOKEN.json'

const FLAP_COST = parseUnits('80', 18) // Cost per roll
const FLAP_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`

// 🔧 Customize the allowed skills here (based on your SkillNFT.sol enum or ID mapping)
const ALLOWED_SKILLS = [0, 4] // Example: Dash, Gap Manipulation, Pipe Destroyer

// 🔒 Lock the level to always be 1 for gacha
const FIXED_LEVEL = 1

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { address, signature, timestamp, permit } = req.body

    if (!address || !signature || !timestamp || !permit) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const message = `Roll skill gacha at ${timestamp}`
    const isValid = await verifyMessage({ address, message, signature })
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const { v, r, s } = parseSignature(permit.signature)

    // Approve backend to spend FLAP
    const permitTx = await walletClient.writeContract({
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

    await publicClient.waitForTransactionReceipt({ hash: permitTx })

    // Transfer FLAP from player to backend
    await transferFlapFromUser(address, FLAP_COST)

    // 🎲 Roll a random skill from the allowed list
    const skillType = ALLOWED_SKILLS[Math.floor(Math.random() * ALLOWED_SKILLS.length)]
    const level = FIXED_LEVEL

    // Mint the Skill NFT
    const txHash = await mintSkillNFT(address, skillType, level)

    return res.status(200).json({
      success: true,
      skillType,
      level,
      txHash,
    })

  } catch (err: any) {
    console.error('[Skill Gacha Error]', err)

    if (err instanceof UserRejectedRequestError || err?.name === 'UserRejectedRequestError') {
      return res.status(400).json({ error: 'User rejected the transaction' })
    }

    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

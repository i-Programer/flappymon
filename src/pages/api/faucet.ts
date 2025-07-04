import { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import { mintFlap } from '@/lib/web3'

const FAUCET_AMOUNT = 500n * 10n ** 18n // 500 FLAP
const CLAIMED_ADDRESSES = new Set<string>() // Temporary in-memory store

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { address, signature, timestamp } = req.body

  if (!address || !signature || !timestamp) {
    return res.status(400).json({ error: 'Missing parameters' })
  }

  // Protect against replay attacks
  const now = Date.now()
  if (Math.abs(now - timestamp) > 1000 * 60 * 5) {
    return res.status(400).json({ error: 'Signature expired' })
  }

  const message = `Claim faucet at ${timestamp}`

  const valid = await verifyMessage({
    address,
    message,
    signature,
  })

  if (!valid) return res.status(401).json({ error: 'Invalid signature' })

  // Prevent double claim
  if (CLAIMED_ADDRESSES.has(address)) {
    return res.status(403).json({ error: 'Already claimed' })
  }

  try {
    const txHash = await mintFlap(address, FAUCET_AMOUNT)
    CLAIMED_ADDRESSES.add(address)

    return res.status(200).json({ success: true, txHash })
  } catch (err: any) {
    console.error('[Faucet Error]', err)
    return res.status(500).json({ error: 'Mint failed' })
  }
}

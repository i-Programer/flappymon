'use client'

import { useEffect, useRef, useState } from 'react'
import { createPhaserGame } from './game/main'
import { WalletOptions } from './components/walletOptions'
import { Account } from './components/account'
import { StoreModal } from './components/storeModal'
import { flapTokenAbi, } from './lib/contracts'

import {
  useAccount,
  useSignMessage,
  useSignTypedData,
} from 'wagmi'

import { parseUnits } from 'viem'
import flapAbi from '@/abi/FLAPTOKEN.json'
import { publicClient } from '@/lib/viemClient'
import { getUserFlappymons } from '@/lib/nft'
import { useFlappymonStore } from '@/store/flappymonStore'
import { loadInventory } from './lib/loadInventory'
import { loadSkills } from './lib/loadSkills'
import { encodeFunctionData } from 'viem'
import skillNftAbi from '@/abi/SkillNFT.json'
import { createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'
import skillMarketplaceAbi from '@/abi/SkillMarketplace.json'

const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom((window as any).ethereum),
})

const FLAP_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`
const SKILL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_ADDRESS as `0x${string}`
const SKILL_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`
const FLAP_COST = parseUnits('50', 18)

export default function GameCanvas() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const { address, chain } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { signTypedDataAsync } = useSignTypedData()
  const [faucetClaimed, setFaucetClaimed] = useState(false)
  const [faucetLoading, setFaucetLoading] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)

  const equippedOnce = useRef(false)

  // Auto-equip the first NFT
  useEffect(() => {
    if (!address || equippedOnce.current) return

    equippedOnce.current = true
    ;(async () => {
      const flappymons = await getUserFlappymons(address)
      if (flappymons.length > 0) {
        useFlappymonStore.getState().setSelected(flappymons[0])
        console.log('[Auto-Equip] First Flappymon selected:', flappymons[0])
      }
    })()
  }, [address])

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if(!canvas) return
  
    if (storeOpen){
      canvas.classList.add('ui-blocked')
    } else {
      canvas.classList.remove('ui-blocked')
    }
  }, [storeOpen])

  useEffect(() => {
    if (!address) return 

    loadInventory(address)
    loadSkills(address)

    const canvas = document.querySelector('canvas')
    if(!canvas) return
  
    if (storeOpen){
      canvas.classList.add('ui-blocked')
    } else {
      canvas.classList.remove('ui-blocked')
    }
  }, [address])
  
  useEffect(() => {
    if (!address || !signMessageAsync) return
  
    ;(window as any).__wallet = {
      address,
      signMessageAsync,
      request: (window as any).ethereum?.request
    }
  }, [address, signMessageAsync])
  

  // Initialize Phaser
  useEffect(() => {
    if (gameContainerRef.current) {
      const w = window as any;
      w.rollGacha = rollGacha;
      w.rollSkillGacha = rollSkillGacha;
      w.levelUpSkills = levelUpSkills
      w.unlockSkills = unlockSkills
      w.sellSkill = sellSkill
      w.buySkill = buySkill 
      w.cancelListing = cancelListing 

      const game = createPhaserGame(gameContainerRef.current.id)
      return () => {
        delete (window as any).rollGacha
        delete (window as any).rollSkillGacha;
        delete (window as any).levelUpSkills;
        delete (window as any).unlockSkills;
        delete (window as any).sellSkill;
        delete (window as any).buySkill;
        delete (window as any).cancelListing;
        game.destroy(true)
      }
    }
  }, [address])
  
  async function rollGacha() {
    if (!address || !signMessageAsync || !signTypedDataAsync) return

    const balance = await publicClient.readContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint

    if (balance < FLAP_COST) {
      alert('Not enough $FLAP to roll gacha! You need at least 50 $FLAP.')
      return
    }

    const timestamp = Date.now()
    const message = `Roll gacha at ${timestamp}`

    let signature: string
    try {
      signature = await signMessageAsync({ message })
    } catch (err: any) {
      if (err.name === 'UserRejectedRequestError') {
        alert('You rejected the signature request.')
        return
      }
      alert('Failed to sign message.')
      return
    }

    const nonce = await publicClient.readContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'nonces',
      args: [address],
    }) as bigint

    const deadline = Math.floor(Date.now() / 1000) + 3600

    let signatureTyped: string
    try {
      signatureTyped = await signTypedDataAsync({
        domain: {
          name: 'FLAPTOKEN',
          version: '1',
          chainId: chain?.id ?? 11155111,
          verifyingContract: FLAP_ADDRESS,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        message: {
          owner: address,
          spender: BACKEND_WALLET,
          value: FLAP_COST,
          nonce: BigInt(nonce),
          deadline: BigInt(deadline),
        },
        primaryType: 'Permit',
      })
    } catch (err: any) {
      if (err.name === 'UserRejectedRequestError') {
        alert('You rejected the permit signature.')
        return
      }
      alert('Failed to sign permit.')
      return
    }

    const res = await fetch('/api/gacha/roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        signature,
        timestamp,
        permit: {
          owner: address,
          spender: BACKEND_WALLET,
          value: FLAP_COST.toString(),
          deadline,
          signature: signatureTyped,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert('Something went wrong: ' + data.error)
      return
    }

    const successEvent = new CustomEvent('gacha:result', { detail: data })
    window.dispatchEvent(successEvent)
  }

  async function rollSkillGacha() {
    if (!address || !signMessageAsync || !signTypedDataAsync) return
  
    const balance = await publicClient.readContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint
  
    const cost = parseUnits('80', 18)
    if (balance < cost) {
      alert('Not enough $FLAP! You need at least 80 $FLAP for skill gacha.')
      return
    }
  
    const timestamp = Date.now()
    const message = `Roll skill gacha at ${timestamp}`
  
    let signature: string
    try {
      signature = await signMessageAsync({ message })
    } catch (err: any) {
      if (err.name === 'UserRejectedRequestError') {
        alert('You rejected the signature request.')
        return
      }
      alert('Failed to sign message.')
      return
    }
  
    const nonce = await publicClient.readContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'nonces',
      args: [address],
    }) as bigint
  
    const deadline = Math.floor(Date.now() / 1000) + 3600
  
    let signatureTyped: string
    try {
      signatureTyped = await signTypedDataAsync({
        domain: {
          name: 'FLAPTOKEN',
          version: '1',
          chainId: chain?.id ?? 11155111,
          verifyingContract: FLAP_ADDRESS,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        message: {
          owner: address,
          spender: BACKEND_WALLET,
          value: cost,
          nonce: BigInt(nonce),
          deadline: BigInt(deadline),
        },
        primaryType: 'Permit',
      })
    } catch (err: any) {
      if (err.name === 'UserRejectedRequestError') {
        alert('You rejected the permit signature.')
        return
      }
      alert('Failed to sign permit.')
      return
    }
  
    const res = await fetch('/api/skill_gacha/roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        signature,
        timestamp,
        permit: {
          owner: address,
          spender: BACKEND_WALLET,
          value: cost.toString(),
          deadline,
          signature: signatureTyped,
        },
      }),
    })
  
    const data = await res.json()
  
    if (!res.ok) {
      const failEvent = new CustomEvent('skillgacha:fail', { detail: data?.error || 'Unknown error' })
      window.dispatchEvent(failEvent)
      return
    }
  
    const successEvent = new CustomEvent('skillgacha:result', { detail: data })
    window.dispatchEvent(successEvent)
  }

  async function ensureSkillApproval(): Promise<boolean> {
    if (!address) return false
  
    try {
      const isApproved = await publicClient.readContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'isApprovedForAll',
        args: [address, BACKEND_WALLET],
      }) as boolean
  
      if (isApproved) return true
  
      const hash = await walletClient.writeContract({
        address: SKILL_NFT_ADDRESS,
        abi: skillNftAbi.abi,
        functionName: 'setApprovalForAll',
        args: [BACKEND_WALLET, true],
        account: address,
      })
  
      console.log('[Approval Sent] Tx:', hash)
  
      // Optional: wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      console.log('[Approval Confirmed]')
  
      return true
    } catch (err: any) {
      console.error('[Approval Error]', err)
      alert('Failed to approve backend wallet. Please try again.')
      return false
    }
  }
  
  async function levelUpSkills(tokenIds: [number, number]) {
    if (!address || !signMessageAsync) {
      alert('Wallet not connected')
      return
    }
  
    const approved = await ensureSkillApproval()
    if (!approved) return // BLOCK jika belum approve
  
    const message = `Level up skills: ${tokenIds[0]}, ${tokenIds[1]}`
    let signature: string
  
    try {
      signature = await signMessageAsync({ message })
    } catch (err: any) {
      alert('Signature failed or rejected')
      return
    }
  
    const res = await fetch('/api/skill_combine/level_up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        tokenIds,
        signature,
      }),
    })
  
    const data = await res.json()
  
    if (!res.ok) {
      alert('Level up failed: ' + data.error)
      return
    }
  
    const event = new CustomEvent('skill:levelup:success', { detail: data })
    window.dispatchEvent(event)
  }
  
  async function unlockSkills(tokenIds: [number, number]) {
    if (!address || !signMessageAsync) {
      alert('Wallet not connected')
      return
    }
  
    const approved = await ensureSkillApproval()
    if (!approved) return // stop kalau belum approve
  
    const message = `Unlock skill: ${tokenIds[0]}, ${tokenIds[1]}`
    let signature: string
  
    try {
      signature = await signMessageAsync({ message })
    } catch (err: any) {
      alert('Signature rejected')
      return
    }
  
    const res = await fetch('/api/skill_combine/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        tokenIds,
        signature,
      }),
    })
  
    const data = await res.json()
  
    if (!res.ok) {
      alert('Unlock failed: ' + data.error)
      return
    }
  
    const event = new CustomEvent('skill:unlock:success', { detail: data })
    window.dispatchEvent(event)
  }

  async function buySkill(tokenId: number, price: string) {
    if (!address || !signTypedDataAsync) {
      throw new Error('Wallet not connected')
    }
  
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10)
    const value = BigInt(price)
    const chainId = chain?.id 
  
    let signature: string | undefined
  
    try {
      const nonce = await publicClient.readContract({
        address: FLAP_ADDRESS,
        abi: flapTokenAbi.abi,
        functionName: 'nonces',
        args: [address],
      }) as bigint
  
      signature = await signTypedDataAsync({
        domain: {
          name: 'FLAPTOKEN',
          version: '1',
          chainId,
          verifyingContract: FLAP_ADDRESS,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: SKILL_MARKETPLACE_ADDRESS,
          value,
          nonce,
          deadline,
        },
      })
  
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          tokenId,
          price,
          permit: {
            signature,
            deadline,
          },
        }),
      })
  
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to buy skill')
      }
  
      return true
    } catch (err: any) {
      console.error('[BUY_SKILL_ERROR]', err)
      throw new Error(err.message || 'Unknown error')
    }
  }
 
  async function cancelListing(tokenId: number) {
    const address = (window as any).__wallet?.address
    if (!address) throw new Error('Wallet not connected')

    return await walletClient.writeContract({
      address: SKILL_MARKETPLACE_ADDRESS,
      abi: skillMarketplaceAbi.abi,
      functionName: 'cancelListing',
      args: [tokenId],
      account: address, // ✅ PENTING: harus user wallet
    })
  }
  
  useEffect(() => {
    ;(window as any).cancelListing = cancelListing
  }, [address, signMessageAsync])
  
  
  async function sellSkill(tokenId: number, priceInFLAP: string) {
    if (!address || !signMessageAsync) {
      alert('Wallet not connected')
      return
    }
  
    // Step 1: Check approval to backend
    const isApproved = await publicClient.readContract({
      address: SKILL_NFT_ADDRESS,
      abi: skillNftAbi.abi,
      functionName: 'isApprovedForAll',
      args: [address, BACKEND_WALLET],
    })
  
    if (!isApproved) {
      alert('Please approve the backend wallet to manage your Skill NFTs first.')
      return
    }
  
    // Step 2: Sign message
    const message = `Sell skill NFT ${tokenId} for ${priceInFLAP} FLAP`
    let signature: string
    try {
      signature = await signMessageAsync({ message })
    } catch (err: any) {
      alert('Signature failed or rejected')
      return
    }
  
    // Step 3: Send to backend
    const res = await fetch('/api/marketplace/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        tokenId,
        price: priceInFLAP,
        signature,
      }),
    })
  
    const data = await res.json()
  
    if (!res.ok) {
      alert('Listing failed: ' + data.error)
      return
    }
  
    const event = new CustomEvent('skill:sell:success', { detail: data })
    window.dispatchEvent(event)
  }

  async function claimFaucet() {
    if (!address || !signMessageAsync) return

    try {
      setFaucetLoading(true)
      const timestamp = Date.now()
      const message = `Claim faucet at ${timestamp}`
      const signature = await signMessageAsync({ message })

      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, timestamp }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert('Failed to claim: ' + data.error)
      } else {
        alert('Claim Successfuly')
        setFaucetClaimed(true)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to claim.')
    } finally {
      setFaucetLoading(false)
    }
  }

  return (
    <>
      <div className={`w-screen h-screen fixed z-10 ${address ? 'hidden' : 'flex'} justify-center items-center bg-slate-900`}>
        <WalletOptions />
      </div>

      {address && <Account />}

      {address && !faucetClaimed && (
        <div className="fixed top-4 right-4 z-50 bg-sky-900 text-white px-4 py-2 rounded shadow">
          <button onClick={claimFaucet} disabled={faucetLoading}>
            {faucetLoading ? 'Claiming...' : 'Claim 500 $FLAP'}
          </button>
        </div>
      )}

      <div id="phaser-game" ref={gameContainerRef} className="w-screen h-screen" />

      {/* 🛒 Store Button */}
      {address && (
        <button
          onClick={() => setStoreOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg shadow"
        >
          🛍️ Store
        </button>
      )}

      {/* 🏪 Store Modal (modular) */}
      {storeOpen && <StoreModal onClose={() => setStoreOpen(false)} />}
    </>
  )
}

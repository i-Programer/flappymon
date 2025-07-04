'use client'

import { useEffect, useRef, useState } from 'react'
import { createPhaserGame } from './game/main'
import { WalletOptions } from './components/walletOptions'
import { Account } from './components/account'

import {
  useAccount,
  useSignMessage,
  useSignTypedData,
  useReadContract,
} from 'wagmi'

import { parseUnits, } from 'viem'
import flapAbi from '@/abi/FLAPTOKEN.json'
import { publicClient } from '@/lib/viemClient'

const FLAP_ADDRESS = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`
const FLAP_COST = parseUnits('50', 18)

export default function GameCanvas() {
    
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const { address, chain } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { signTypedDataAsync } = useSignTypedData()

  const [faucetClaimed, setFaucetClaimed] = useState(false)
  const [faucetLoading, setFaucetLoading] = useState(false)

  useEffect(() => {
    if (gameContainerRef.current) {
      // Assign early so Phaser picks it up immediately
      (window as any).rollGacha = rollGacha
  
      const game = createPhaserGame(gameContainerRef.current.id)
      return () => {
        delete (window as any).rollGacha // Clean up on unmount
        game.destroy(true)
      }
    }
  }, [address])
  
  async function rollGacha() {
    if (!address || !signMessageAsync || !signTypedDataAsync) return
  
    console.log('[Gacha] Starting roll')
  
    const timestamp = Date.now()
    const message = `Roll gacha at ${timestamp}`
    const signature = await signMessageAsync({ message })
  
    console.log('[Gacha] Got message signature:', signature)
  
    const nonce = await publicClient.readContract({
      address: FLAP_ADDRESS,
      abi: flapAbi.abi,
      functionName: 'nonces',
      args: [address],
    }) as bigint
  
    const deadline = Math.floor(Date.now() / 1000) + 3600
    console.log('[Gacha] Nonce:', nonce, 'Deadline:', deadline)

    console.log('[Gacha] About to sign typed data:', {
      domain: {
        name: 'FLAPTOKEN',
        version: '1',
        chainId: chain?.id ?? 11155111,
        verifyingContract: FLAP_ADDRESS,
      },
      message: {
        owner: address,
        spender: BACKEND_WALLET,
        value: FLAP_COST,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      }
    })    

    if (!FLAP_ADDRESS || !BACKEND_WALLET || !address) {
      console.error('[Gacha] Invalid EIP-2612 addresses:', { FLAP_ADDRESS, BACKEND_WALLET, address })
      return
    }    
  
    const signatureTyped = await signTypedDataAsync({
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
  
    console.log('[Gacha] Got typed signature:', signatureTyped)
  
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
  
    console.log('[Gacha] Sent fetch request to /api/gacha/roll')
  
    const data = await res.json()
    console.log('[Gacha] Got response:', data)
  
    if (!res.ok) {
      const errorEvent = new CustomEvent('gacha:fail', { detail: data.error })
      window.dispatchEvent(errorEvent)
      return
    }
  
    const successEvent = new CustomEvent('gacha:result', { detail: data })
    window.dispatchEvent(successEvent)
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
        alert('Gagal klaim faucet: ' + data.error)
      } else {
        alert('Berhasil klaim 500 $FLAP!')
        setFaucetClaimed(true)
      }
    } catch (err) {
      console.error(err)
      alert('Klaim faucet gagal.')
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
    </>
  )
}

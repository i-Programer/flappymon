import { useAccount } from 'wagmi'
import { useWalletStore } from '@/store/walletStore'
import { useEffect } from 'react'

export function Account() {
  const { address } = useAccount()
  const setAddress = useWalletStore((state) => state.setAddress)

  useEffect(() => {
    setAddress(address ?? null)
  }, [address, setAddress])

  return null
}
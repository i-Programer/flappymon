// src/store/walletStore.ts
import { create } from 'zustand'

type WalletState = {
  address: `0x${string}` | null
  setAddress: (address: `0x${string}` | null) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  setAddress: (address) => set({ address }),
}))

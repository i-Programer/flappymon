import { create } from 'zustand'

interface Flappymon {
  tokenId: number
  name: string
  image: string
  [key: string]: any
}

interface FlappymonStore {
  selected?: Flappymon
  setSelected: (nft: Flappymon) => void
}

export const useFlappymonStore = create<FlappymonStore>((set) => ({
  selected: undefined,
  setSelected: (nft) => set({ selected: nft }),
}))

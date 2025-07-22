import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Flappymon {
  tokenId: number
  name: string
  [key: string]: any
}

interface FlappymonStore {
  selected?: Flappymon
  setSelected: (nft: Flappymon) => void
}

// export const useFlappymonStore = create<FlappymonStore>((set) => ({
//   selected: undefined,
//   setSelected: (nft) => set({ selected: nft }),
// }))

export const useFlappymonStore = create<FlappymonStore>()(
  persist(
    (set) => ({
      selected: undefined,
      setSelected: (nft) => set({ selected: nft }),
    }),
    {
      name: 'flappymon-storage',
    }
  )
)
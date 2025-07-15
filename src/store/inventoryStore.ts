// src/store/useInventoryStore.ts
import { create } from 'zustand'

export interface GameItem {
  tokenId: number
  uses: number
  metadata: {
    name: string
    description: string
    attributes: { trait_type: string; value: string }[]
  }
}

interface InventoryStore {
  items: GameItem[]
  usedItemsThisSession: Record<number, number> // track usage in-session
  setItems: (items: GameItem[]) => void
  addItem: (item: GameItem) => void
  consumeItem: (tokenId: number) => void
  removeItem: (tokenId: number) => void
  resetUsedItems: () => void
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  usedItemsThisSession: {},

  setItems: (items) => set({ items }),

  addItem: (newItem) =>
    set((state) => {
      const existing = state.items.find(i => i.tokenId === newItem.tokenId)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.tokenId === newItem.tokenId
              ? { ...i, uses: i.uses + newItem.uses }
              : i
          )
        }
      } else {
        return {
          items: [...state.items, newItem]
        }
      }
    }),

    consumeItem: (tokenId) =>
      set((state) => {
        const existing = state.items.find(i => i.tokenId === tokenId)
        if (!existing) return state
    
        const newUsedItems = {
          ...state.usedItemsThisSession,
          [tokenId]: (state.usedItemsThisSession[tokenId] || 0) + 1,
        }
    
        if (existing.uses > 1) {
          return {
            items: state.items.map(i =>
              i.tokenId === tokenId ? { ...i, uses: i.uses - 1 } : i
            ),
            usedItemsThisSession: newUsedItems,
          }
        } else {
          return {
            items: state.items.filter(i => i.tokenId !== tokenId),
            usedItemsThisSession: newUsedItems,
          }
        }
      }),

  removeItem: (tokenId) =>
    set((state) => ({
      items: state.items.filter(i => i.tokenId !== tokenId),
    })),

    resetUsedItems: () =>
      set({ usedItemsThisSession: {} }),
}))


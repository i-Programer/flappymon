// src/lib/loadInventory.ts
import { useInventoryStore } from '../store/inventoryStore'

export async function loadInventory(address: string) {
  try {
    const res = await fetch(`/api/shop/balance?address=${address}`)
    const json = await res.json()
    useInventoryStore.getState().setItems(json.items)
    console.log('[Inventory] Loaded:', json.items)
  } catch (err) {
    console.error('[Inventory] Failed to fetch:', err)
  }
}

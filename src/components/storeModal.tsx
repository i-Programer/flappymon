'use client'

import { StoreItemCard } from './storeItemCard'

export function StoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg w-[95%] max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🛍️ Flappymon Item Shop</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            &times;
          </button>
        </div>

        <StoreItemCard />
      </div>
    </div>
  )
}

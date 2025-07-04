export function getRandomRarity(): number {
    const roll = Math.random() * 100
  
    if (roll < 65) return 0 // Common
    if (roll < 90) return 1 // Rare
    if (roll < 98) return 2 // Epic
    return 3                // Legendary
  }
  
// src/app/lib/loadSkills.ts
import { getUserSkills } from '@/lib/nft'
import { useSkillStore } from '@/store/skillStore'

export async function loadSkills(address: `0x${string}`) {
  const skillNFTs = await getUserSkills(address)

  useSkillStore.getState().setSkills(skillNFTs)
  console.log('[SkillStore] Loaded skills:', skillNFTs)
}

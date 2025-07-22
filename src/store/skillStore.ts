// src/store/skillStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SkillNFT {
  tokenId: number
  skillType: number   // 0 = Dash, 1 = Disappear, etc.
  skillLevel: number  // 1 to 10
  image?: string      // Optional for future use
}

interface SkillStore {
  skills: SkillNFT[]
  selected?: SkillNFT
  setSkills: (skills: SkillNFT[]) => void
  setSelected: (skill: SkillNFT) => void
  addSkill: (skill: SkillNFT) => void
  removeSkill: (tokenId: number) => void
}

// export const useSkillStore = create<SkillStore>((set) => ({
//   skills: [],
//   selected: undefined,

//   setSkills: (skills) => set({ skills }),
//   setSelected: (skill) => set({ selected: skill }),

//   addSkill: (skill) =>
//     set((state) => ({ skills: [...state.skills, skill] })),

//   removeSkill: (tokenId) =>
//     set((state) => ({
//       skills: state.skills.filter((s) => s.tokenId !== tokenId),
//     })),
// }))

export const useSkillStore = create<SkillStore>()(
  persist(
    (set) => ({
      skills: [],
      selected: undefined,
      setSkills: (skills) => set({ skills }),
      setSelected: (skill) => set({ selected: skill }),
      addSkill: (skill) =>
        set((state) => ({ skills: [...state.skills, skill] })),
      removeSkill: (tokenId) =>
        set((state) => ({
          skills: state.skills.filter((s) => s.tokenId !== tokenId),
        })),
    }),
    {
      name: 'skill-storage', // key in localStorage
    }
  )
)
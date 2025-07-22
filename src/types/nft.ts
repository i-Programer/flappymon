// src/types/nft.ts

export type SkillNFT = {
    tokenId: number;
    skillType: number;
    skillLevel: number;
    name: string;
  };
  
export type FlappymonNFT = {
  tokenId: number;
  rarity: number;
  rarityName: string;
  name: string;
  description: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
};

export type UserWallet = {
  address: `0x${string}` | undefined;
  flapBalance: string;
};
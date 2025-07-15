import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SkillMarketplaceModule = buildModule("SkillMarketplaceModule", (m) => {
  // 🔗 Replace with your deployed contract addresses
  const skillNFTAddress = "0xb4C5AD5d18F6c362794FA90130755902397a6D1d";
  const flapTokenAddress = "0x416A0DB4cD78A4d822FBbD998e51199b1927aa0C";

  const marketplace = m.contract("SkillMarketplace", [skillNFTAddress, flapTokenAddress]);

  return { marketplace };
});

export default SkillMarketplaceModule;

// ignition/modules/SkillNFTModule.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('SkillNFTModuleV4', (m) => {
  const deployer = m.getAccount(0);

  const skillNFT = m.contract('SkillNFT', [
    deployer,
    'https://harlequin-fun-wolverine-462.mypinata.cloud/ipfs/bafybeidosc6uwcrafbrbnc5sjtkso4pjywj72uta3e2cfyddmaju2psvju/', // ← replace this
  ]);

  return { skillNFT };
});

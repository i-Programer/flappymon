// ignition/modules/FlappymonModule.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('FlappymonModuleV3', (m) => {
  const deployer = m.getAccount(0);

  const flappymon = m.contract('Flappymon', [
    deployer,
    'https://harlequin-fun-wolverine-462.mypinata.cloud/ipfs/bafybeieaajsoipwe772zfpq4ncb5r5k34zq32hrxjteiqvjsf5yxmztymm/',
  ]);

  return { flappymon };
});

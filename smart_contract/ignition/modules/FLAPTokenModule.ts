import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('FLAPTokenModuleV2', (m) => {
  const deployer = m.getAccount(0);

  const flapToken = m.contract('FLAPTOKEN', [
    deployer,     // recipient of initial supply
    deployer,     // initial owner
  ]);

  return { flapToken };
});

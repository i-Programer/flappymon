// ignition/modules/flappymon.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FlappymonModule = buildModule("FlappymonModule", (m) => {
  const deployer = m.getAccount(0);

  const flappymon = m.contract("Flappymon", [deployer]);

  return { flappymon };
});

export default FlappymonModule;

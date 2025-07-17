import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GameItemModuleV4", (m) => {
  const admin = m.getAccount(0);
  const minter = "0xECe8D2186b8C75d0AAa2764D349DD95cF960F69b";
  const flapToken = "0x416A0DB4cD78A4d822FBbD998e51199b1927aa0C";
  const treasury = admin;

  const baseURI = "https://harlequin-fun-wolverine-462.mypinata.cloud/ipfs/bafybeibahqx3nxp3brlv3qg2mjcmd2nendehesplauyodns57tpfoxdjaa/";

  const gameItem = m.contract("GameItem", [
    admin,
    minter,
    flapToken,
    treasury,
    baseURI,
  ]);

  return { gameItem };
});

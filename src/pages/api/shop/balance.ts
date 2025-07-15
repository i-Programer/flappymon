import { NextApiRequest, NextApiResponse } from "next";
import { publicClient } from "@/lib/walletClient";
import { gameItemAbi, gameItemAddress } from "@/lib/contracts";

const ALL_ITEM_IDS = [0, 1, 2, 3];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address, id } = req.query;

  if (typeof address !== "string" || !address.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid or missing address" });
  }

  // Mode 1: Fetch specific item if `id` is provided
  if (typeof id === "string") {
    const idNum = Number(id);
    if (isNaN(idNum) || idNum < 0) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    try {
      const balance = await publicClient.readContract({
        address: gameItemAddress,
        abi: gameItemAbi.abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`, BigInt(idNum)],
      });

      return res.status(200).json({
        item: { tokenId: idNum, uses: Number(balance) },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Mode 2: Fetch all items if `id` is NOT provided
  try {
    const balances = await Promise.all(
      ALL_ITEM_IDS.map(async (tokenId) => {
        const balance = await publicClient.readContract({
          address: gameItemAddress,
          abi: gameItemAbi.abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`, BigInt(tokenId)],
        });

        return { tokenId, uses: Number(balance) };
      })
    );

    return res.status(200).json({ items: balances });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

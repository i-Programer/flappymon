"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { parseUnits, formatUnits, parseSignature } from "viem";
import { publicClient } from "@/lib/walletClient";
import { flapTokenAbi } from "@/lib/contracts";
import { loadInventory } from "@/lib/loadInventory";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { gameItemAbi } from "@/lib/contracts";

// const walletClient = createWalletClient({
//   chain: sepolia,
//   transport: custom((window as any).ethereum),
// })

const FLAP_COST = parseUnits("80", 18);
const FLAP_TOKEN_ADDRESS = process.env
    .NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`;
const GAME_ITEM_ADDRESS = process.env
    .NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`;

export function BuyItemButton({
    address,
    id,
    quantity = 1,
    refresh,
    walletClient,
}: {
    address: `0x${string}`;
    id: number;
    quantity?: number;
    refresh?: () => void;
    walletClient: any;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { chain } = useAccount();
    const { signTypedDataAsync } = useSignTypedData();

    async function buyItem() {
        setLoading(true);
        setError(null);

        try {
            if (!address || !chain?.id || !signTypedDataAsync) {
                throw new Error("Wallet not connected or chain not detected.");
            }

            const deadline = Math.floor(Date.now() / 1000) + 60 * 60;
            const nonce = (await publicClient.readContract({
                address: FLAP_TOKEN_ADDRESS,
                abi: flapTokenAbi.abi,
                functionName: "nonces",
                args: [address],
            })) as bigint;

            const totalCost = FLAP_COST * BigInt(quantity);

            const signature = await signTypedDataAsync({
                domain: {
                    name: "FLAPTOKEN",
                    version: "1",
                    chainId: chain.id,
                    verifyingContract: FLAP_TOKEN_ADDRESS,
                },
                types: {
                    Permit: [
                        { name: "owner", type: "address" },
                        { name: "spender", type: "address" },
                        { name: "value", type: "uint256" },
                        { name: "nonce", type: "uint256" },
                        { name: "deadline", type: "uint256" },
                    ],
                },
                primaryType: "Permit",
                message: {
                    owner: address,
                    spender: GAME_ITEM_ADDRESS,
                    value: totalCost,
                    nonce,
                    deadline: BigInt(deadline),
                },
            });

            const { v, r, s } = parseSignature(signature);

            await walletClient.writeContract({
                address: GAME_ITEM_ADDRESS,
                abi: gameItemAbi.abi,
                functionName: "buyItemWithPermit",
                args: [
                    BigInt(id),
                    BigInt(quantity),
                    totalCost,
                    BigInt(deadline),
                    v,
                    r,
                    s,
                ],
                account: address, // penting!
            });

            await loadInventory(address);

            refresh?.();
        } catch (err: any) {
            console.error("[BUY ERROR]", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="text-right">
            <p className="text-green-600 font-bold text-sm">
                {formatUnits(FLAP_COST * BigInt(quantity), 18)} $FLAP
            </p>
            <button
                onClick={buyItem}
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-500 text-sm mt-2 px-3 py-1 rounded"
            >
                {loading ? "Buying..." : `Buy x${quantity}`}
            </button>
            {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>
    );
}


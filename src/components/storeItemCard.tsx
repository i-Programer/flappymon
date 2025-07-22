"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { BuyItemButton } from "./buyItemButton";

export function StoreItemCard() {
    const DOUBLE_POINT_ID = 0;
    const [balance, setBalance] = useState<number>(0);
    const [qty, setQty] = useState<number>(1);
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

    async function fetchBalance() {
        if (!address) return;
        try {
            const res = await fetch(
                `/api/shop/balance?address=${address}&id=${DOUBLE_POINT_ID}`
            );
            const json = await res.json();
            setBalance(json.item.uses || 0);
        } catch (err) {
            console.error("Failed to fetch balance", err);
        }
    }

    useEffect(() => {
        fetchBalance();
    }, [address]);

    if (!address) return null;

    return (
        <div className="border p-4 rounded-lg flex justify-between items-center">
            <div>
                <h3 className="font-medium">🎯 Double Point</h3>
                <p className="text-sm text-gray-500">
                    Double score for 4 pipes. Stackable.
                </p>
                <p className="text-xs mt-1 text-gray-400">You own: {balance}</p>
                <label className="block text-sm mt-2 mb-1 font-semibold text-slate-700">
                    Qty
                </label>
                <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm bg-slate-700 text-white border border-slate-500 rounded"
                />
            </div>

            <BuyItemButton
                walletClient={walletClient}
                address={address}
                id={DOUBLE_POINT_ID}
                quantity={qty}
                refresh={fetchBalance}
            />
        </div>
    );
}


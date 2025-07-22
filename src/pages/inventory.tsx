import NavbarMarketplace from "@/components/website/marketplace/NavbarMarketplace";
import React, { useEffect, useState } from "react";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
import { FlappymonNFT, SkillNFT, UserWallet } from "@/types/nft";
import { useSkillStore } from "@/store/skillStore";
import { useFlappymonStore } from "@/store/flappymonStore";
import { formatEther } from "viem";
import { publicClient } from "@/lib/viemClient";
import {
    skillNFTAbi,
    skillNFTAddress,
    skillMarketplaceAbi,
    skillMarketplaceAddress,
} from "@/lib/contracts";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { StoreModal } from "@/components/storeModal";

const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`;

// const walletClient = createWalletClient({
//     chain: sepolia,
//     transport: custom((window as any).ethereum),
// });

const ITEM_METADATA: Record<number, { name: string; icon: string }> = {
    0: { name: "Double Points", icon: "/assets/items/double_points.png" },
    1: { name: "Shield", icon: "/assets/items/shield.png" },
    2: { name: "Speed Boost", icon: "/assets/items/speed.png" },
    3: { name: "Extra Life", icon: "/assets/items/extra_life.png" },
};

interface GameItem {
    tokenId: number;
    uses: number;
}

const inventory = () => {
    const page = "Inventory";
    const [mounted, setMounted] = useState(false);
    const { data: walletClient } = useWalletClient();
    const { address, isConnected } = useAccount();
    const [allSkill, setAllSkill] = useState<SkillNFT[]>([]);
    const [allFlappymon, setAllFlappymon] = useState<FlappymonNFT[]>([]);
    const [items, setItems] = useState<GameItem[]>([]);
    const [userWallet, setUserWallet] = useState<UserWallet>({
        address,
        flapBalance: "0.0",
    });

    const { setSelected: setSelectedSkill } = useSkillStore();
    const { setSelected: setSelectedFlappymon } = useFlappymonStore();
    const [listedTokenIds, setListedTokenIds] = useState<Set<number>>(
        new Set()
    );

    const [storeOpen, setStoreOpen] = useState(false);
    const { signMessageAsync } = useSignMessage();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!address) return;
        fetch(`/api/shop/balance?address=${address}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.items)
                    setItems(data.items.filter((i: GameItem) => i.uses > 0));
            });
    }, [address]);

    useEffect(() => {
        const fetchWalletData = async () => {
            if (!address) return;

            try {
                const res = await fetch(
                    `/api/wallet/overview?address=${address}`
                );
                const data = await res.json();
                console.log(data);

                setUserWallet({
                    address,
                    flapBalance: formatEther(BigInt(data.balance || 0)),
                });

                setAllSkill(data.skills || []);
                setAllFlappymon(data.flappymons || []);
            } catch (err) {
                console.error("Failed to fetch wallet data:", err);
            }
        };

        fetchWalletData();
    }, [address]);

    useEffect(() => {
        const fetchListings = async () => {
            if (!allSkill || allSkill.length === 0) return;

            const results = await Promise.all(
                allSkill.map(async (skill) => {
                    try {
                        const res = await fetch(
                            `/api/marketplace/get_listing?tokenId=${skill.tokenId}`
                        );
                        const data = await res.json();

                        const isListed =
                            data?.seller &&
                            data.seller !==
                                "0x0000000000000000000000000000000000000000";
                        return isListed ? skill.tokenId : null;
                    } catch (err) {
                        console.error(
                            `Failed to fetch listing for skill ${skill.tokenId}`,
                            err
                        );
                        return null;
                    }
                })
            );

            const listed = new Set(
                results.filter((id): id is number => id !== null)
            );
            setListedTokenIds(listed);
        };

        fetchListings();
    }, [allSkill]);

    if (!mounted) return null;

    const shortenAddress = (addr: string | undefined) => {
        if (!addr) return "No wallet";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    function handleEquipSkill(tokenId: number) {
        const skill = allSkill.find((s) => s.tokenId === tokenId);
        if (skill) {
            setSelectedSkill(skill);
            console.log("Equipped skill:", skill);
            // Optionally trigger Phaser logic here
        }

        console.log(useSkillStore.getState().selected);
    }

    function handleEquipFlappymon(tokenId: number) {
        const mon = allFlappymon.find((m) => m.tokenId === tokenId);
        if (mon) {
            setSelectedFlappymon(mon);
            console.log("Equipped Flappymon:", mon);
            // Optionally trigger Phaser logic here
        }

        console.log(useFlappymonStore.getState().selected);
    }

    async function sellSkill(tokenId: number, priceInFLAP: string) {
        if (!address || !signMessageAsync) {
            alert("Wallet not connected");
            return;
        }

        const isApproved = await publicClient.readContract({
            address: skillNFTAddress,
            abi: skillNFTAbi.abi,
            functionName: "isApprovedForAll",
            args: [address, BACKEND_WALLET],
        });

        if (!isApproved) {
            alert(
                "Please approve the backend wallet to manage your Skill NFTs first."
            );
            return;
        }

        const message = `Sell skill NFT ${tokenId} for ${priceInFLAP} FLAP`;
        let signature: string;
        try {
            signature = await signMessageAsync({ message });
        } catch (err: any) {
            alert("Signature failed or rejected");
            return;
        }

        const res = await fetch("/api/marketplace/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                tokenId,
                price: priceInFLAP,
                signature,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Listing failed: " + data.error);
            return;
        }

        const event = new CustomEvent("skill:sell:success", { detail: data });
        window.dispatchEvent(event);
    }

    function handleSellSkill(tokenId: number) {
        const price = prompt("Enter $FLAP price:");
        if (price) sellSkill(tokenId, price);
    }

    const cancelListing = async (tokenId: number) => {
        if (!walletClient || !isConnected || !address) {
            alert("Wallet not connected");
            return;
        }

        try {
            const txHash = await walletClient.writeContract({
                address: skillMarketplaceAddress,
                abi: skillMarketplaceAbi.abi,
                functionName: "cancelListing",
                args: [tokenId],
                account: address,
            });

            alert(`Listing cancelled!\nTx: ${txHash}`);
            return txHash;
        } catch (err: any) {
            console.error("[cancelListing] Error:", err);
            alert(`Cancel failed: ${err.shortMessage || err.message}`);
        }
    };

    const handleCancelListing = async (tokenId: number) => {
        try {
            const txHash = await cancelListing(tokenId);

            console.log(`Cancelled listing. Tx hash: ${txHash}`);

            // Update state to remove token from listed
            setListedTokenIds((prev) => {
                const updated = new Set(prev);
                updated.delete(tokenId);
                return updated;
            });
        } catch (err: any) {
            console.error("Cancel failed:", err.message || err);
            // Optionally: setErrorMessage(err.message) or update some UI state here
        }
    };

    console.log(items);

    return (
        <>
            <div className="bg-zinc-900">
                <NavbarMarketplace
                    isConnected={isConnected}
                    address={address}
                    page={page}
                />
            </div>
            <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center p-6">
                {/* 🛒 Store Button */}
                {address && (
                    <button
                        onClick={() => setStoreOpen(true)}
                        className="fixed bottom-4 right-4 z-50 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg shadow"
                    >
                        🛍️ Store
                    </button>
                )}

                {/* 🏪 Store Modal (modular) */}
                {storeOpen && (
                    <StoreModal onClose={() => setStoreOpen(false)} />
                )}
                {/* Top Box (Summary) */}
                <div className="w-3/5 bg-zinc-800 rounded-t-3xl p-6 shadow-2xl z-10">
                    <h2 className="text-lg font-semibold mb-1 text-center">
                        Inventory Summary
                    </h2>
                    <p className="text-sm text-zinc-400 text-center">
                        Overview of your owned skills and items
                    </p>

                    <div className="mt-4 text-center text-sm text-zinc-300">
                        <p>
                            <span className="text-zinc-400">Wallet:</span>{" "}
                            {shortenAddress(userWallet.address)}
                        </p>
                        <p>
                            <span className="text-zinc-400">$FLAP:</span>{" "}
                            {userWallet.flapBalance}
                        </p>
                    </div>
                </div>

                {/* Bottom Box (Inventory) */}
                <div className="w-full bg-zinc-700 rounded-t-3xl pt-16 pb-8 px-8 shadow-inner -mt-6 min-h-screen flex flex-col">
                    <h3 className="text-xl font-bold mb-4">Your Inventory</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Render Skills */}
                        {allSkill.map((skill) => (
                            <div
                                key={`skill-${skill.tokenId}`}
                                className="bg-zinc-800 rounded-xl p-4 flex flex-col items-center"
                            >
                                <img
                                    src={`/assets/skills_icon/${skill.skillType}.png`}
                                    alt={skill.name}
                                    className="w-20 h-20 object-contain mb-2"
                                />
                                <span className="text-white font-semibold">
                                    {skill.name}
                                </span>
                                <span className="text-amber-400 text-sm">
                                    Lv. {skill.skillLevel}
                                </span>

                                {/* Buttons */}
                                <div className="mt-2 flex gap-2">
                                    {!listedTokenIds.has(skill.tokenId) ? (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleEquipSkill(
                                                        skill.tokenId
                                                    )
                                                }
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                            >
                                                Equip
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleSellSkill(
                                                        skill.tokenId
                                                    )
                                                }
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                            >
                                                Sell
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                handleCancelListing(
                                                    skill.tokenId
                                                )
                                            }
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                                        >
                                            Cancel Listing
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Render Flappymon */}
                        {allFlappymon.map((mon) => (
                            <div
                                key={`flappy-${mon.tokenId}`}
                                className="bg-zinc-800 rounded-xl p-4 flex flex-col items-center"
                            >
                                <img
                                    src={`/assets/flappymons_sprite/${mon.rarity}.png`}
                                    alt={mon.name}
                                    className="w-20 h-20 object-contain mb-2"
                                />
                                <span className="text-white font-semibold">
                                    {mon.name}
                                </span>
                                <span className="text-blue-400 text-sm">
                                    Rarity: {mon.rarityName}
                                </span>

                                {/* Equip Button */}
                                <button
                                    onClick={() =>
                                        handleEquipFlappymon(mon.tokenId)
                                    }
                                    className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                >
                                    Equip
                                </button>
                            </div>
                        ))}

                        {/* Render Items */}
                        {items.map((item) => (
                            <div
                                key={`item-${item.tokenId}`}
                                className="bg-zinc-800 rounded-xl p-4 flex flex-col items-center justify-between"
                            >
                                <img
                                    src={`/assets/items/${item.tokenId}.png`} // Make sure your item icons are stored like 0.png, 1.png, etc.
                                    alt={`Item ${item.tokenId}`}
                                    className="w-20 h-20 object-contain mb-2"
                                />
                                <span className="text-white font-semibold">
                                    Item #{item.tokenId}
                                </span>
                                <span className="text-lime-400 text-sm">
                                    Qty: {item.uses}
                                </span>

                                {/* Open Shop Button (if you want to make this an entry point) */}
                                <button
                                    onClick={() => setStoreOpen(true)} // your handler to open the shop modal
                                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                                >
                                    Open Shop
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default inventory;


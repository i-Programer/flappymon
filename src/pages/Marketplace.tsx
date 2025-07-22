import React from "react";
import { useEffect, useState } from "react";
import { useAccount, useSignTypedData, useWalletClient } from "wagmi";
import NavbarMarketplace from "@/components/website/marketplace/NavbarMarketplace";
import { formatEther, parseSignature } from "viem";
import {
    skillNFTAbi,
    skillNFTAddress,
    skillMarketplaceAbi,
    skillMarketplaceAddress,
    flapTokenAddress,
    flapTokenAbi,
} from "@/lib/contracts";
import { publicClient } from "@/lib/viemClient";
import Image from "next/image";

const Marketplace = () => {
    const page = "Marketplace";
    const [mounted, setMounted] = useState(false);
    const { data: walletClient } = useWalletClient();
    const { address, isConnected, chain } = useAccount();
    const [walletData, setWalletData] = useState(null);
    const [listings, setListings] = useState<any[]>([]);
    const [listedTokenIds, setListedTokenIds] = useState<Set<number>>(
        new Set()
    );
    const { signTypedDataAsync } = useSignTypedData();
    const skillNames = [
        "Dash",
        "Disappear",
        "Gap Manipulation",
        "Pipe Destroyer",
        "Floating",
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchWalletData = async () => {
            if (!address) return;

            try {
                const res = await fetch(
                    `/api/wallet/overview?address=${address}`
                );
                const data = await res.json();
                setWalletData(data);
            } catch (err) {
                console.error("Failed to fetch wallet data:", err);
            }
        };

        fetchWalletData();
    }, [address]);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const res = await fetch("/api/marketplace/get_all_listings");
                const data = await res.json();
                setListings(data.filter((item: any) => item.listed)); // only show listed items
            } catch (err) {
                console.error("Failed to fetch marketplace listings:", err);
            }
        };

        fetchListings();
    }, []);

    if (!mounted) return null;

    const buySkill = async (tokenId: number, price: string) => {
        if (!address || !signTypedDataAsync || !walletClient || !chain) {
            throw new Error("Wallet not connected");
        }

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 min
        const value = BigInt(price);
        const chainId = chain.id;

        try {
            const nonce = (await publicClient.readContract({
                address: flapTokenAddress,
                abi: flapTokenAbi.abi,
                functionName: "nonces",
                args: [address],
            })) as bigint;

            const signature = await signTypedDataAsync({
                domain: {
                    name: "FLAPTOKEN",
                    version: "1",
                    chainId,
                    verifyingContract: flapTokenAddress,
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
                    spender: skillMarketplaceAddress,
                    value,
                    nonce,
                    deadline,
                },
            });

            const { v, r, s } = parseSignature(signature);

            const txHash = await walletClient.writeContract({
                address: skillMarketplaceAddress,
                abi: skillMarketplaceAbi.abi,
                functionName: "buySkillWithPermit",
                args: [BigInt(tokenId), value, deadline, v, r, s],
                account: address,
            });

            return txHash;
        } catch (err: any) {
            console.error("[BUY_SKILL_ERROR]", err);
            throw new Error(err.shortMessage || err.message || "Unknown error");
        }
    };

    const handleBuy = async (tokenId: number, price: string) => {
        try {
            const txHash = await buySkill(tokenId, price);
            alert(`Purchase successful!\nTx: ${txHash}`);

            // Optional: update state or reload
            location.reload();
        } catch (err: any) {
            console.error("Buy failed:", err.message || err);
            alert(`Buy failed: ${err.message || "Unknown error"}`);
        }
    };

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
            throw err;
        }
    };

    const handleCancelListing = async (tokenId: number) => {
        try {
            const txHash = await cancelListing(tokenId);

            console.log(`Cancelled listing. Tx hash: ${txHash}`);

            // Optional: if you're managing a visible list
            setListedTokenIds((prev) => {
                const updated = new Set(prev);
                updated.delete(tokenId);
                return updated;
            });

            // Or just reload
            location.reload();
        } catch (err: any) {
            console.error("Cancel failed:", err.message || err);
        }
    };

    console.log(listings);
    return (
        <>
            <div className="bg-zinc-700">
                <NavbarMarketplace
                    isConnected={isConnected}
                    address={address}
                    page={page}
                />

                <div className="bg-zinc-700 min-h-screen text-white flex">
                    {/* Sidebar */}
                    <aside className="w-full max-w-xs bg-zinc-800 p-6 space-y-6 shadow-lg">
                        {/* Search Bar */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-white">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Enter skill name"
                                className="w-full px-4 py-2 rounded bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>

                        <hr className="border-zinc-600" />

                        {/* Price Range */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-white">
                                Price Range ($FLAP)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-1/2 px-3 py-2 rounded bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-1/2 px-3 py-2 rounded bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Skill Type */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-white">
                                Skill Type
                            </label>
                            <select className="w-full px-4 py-2 rounded bg-zinc-700 text-white focus:outline-none">
                                <option value="">All Types</option>
                                <option value="attack">Attack</option>
                                <option value="defense">Defense</option>
                                <option value="utility">Utility</option>
                            </select>
                        </div>

                        {/* Skill Level */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-white">
                                Skill Level
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-neutral-400 mt-1">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="pt-4">
                            <button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded transition">
                                🔍 Search
                            </button>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 p-6 space-y-6">
                        {/* Filter Sort Bar */}
                        <div className="flex flex-wrap items-center justify-between bg-zinc-800 px-4 py-3 rounded shadow">
                            <h2 className="text-xl font-semibold">
                                Skill Listings
                            </h2>
                            <select className="bg-zinc-700 text-white px-4 py-2 rounded focus:outline-none">
                                <option value="lowToHigh">
                                    💸 Price: Low to High
                                </option>
                                <option value="highToLow">
                                    💰 Price: High to Low
                                </option>
                                <option value="newest">🆕 Newest</option>
                                <option value="oldest">📜 Oldest</option>
                            </select>
                        </div>

                        {/* Sample Skill Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.length === 0 ? (
                                <p className="text-center col-span-full text-neutral-400">
                                    No skills listed on the marketplace.
                                </p>
                            ) : (
                                listings.map((listing) => (
                                    <div
                                        key={`market-skill-${listing.tokenId}`}
                                        className="bg-zinc-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition"
                                    >
                                        <div className="w-full h-40 bg-zinc-600 rounded mb-4 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`/assets/skills_icon/${listing.skillType}.png`}
                                                alt={`Skill ${listing.tokenId}`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <h3 className="text-lg font-bold mb-1 text-white">
                                            {skillNames[listing.skillType]} #
                                            {listing.tokenId}
                                        </h3>
                                        <p className="text-sm text-zinc-400 mb-1">
                                            Type: {listing.skillType} | Level:{" "}
                                            {listing.skillLevel}
                                        </p>
                                        <p className="text-amber-400 font-semibold mb-2">
                                            Price:{" "}
                                            {formatEther(BigInt(listing.price))}{" "}
                                            $FLAP
                                        </p>

                                        {listing.seller.toLowerCase() ===
                                        address?.toLowerCase() ? (
                                            <button
                                                onClick={() =>
                                                    handleCancelListing(
                                                        listing.tokenId
                                                    )
                                                }
                                                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
                                            >
                                                Cancel Listing
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleBuy(
                                                        listing.tokenId,
                                                        listing.price
                                                    )
                                                }
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
                                            >
                                                Buy
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default Marketplace;


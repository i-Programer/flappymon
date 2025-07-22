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

const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`;

// const walletClient = createWalletClient({
//     chain: sepolia,
//     transport: custom((window as any).ethereum),
// });

const skill = () => {
    const page = "Inventory";
    const [mounted, setMounted] = useState(false);
    const { data: walletClient } = useWalletClient();
    const { address, isConnected } = useAccount();
    const [allSkill, setAllSkill] = useState<SkillNFT[]>([]);
    const [allFlappymon, setAllFlappymon] = useState<FlappymonNFT[]>([]);
    const [userWallet, setUserWallet] = useState<UserWallet>({
        address,
        flapBalance: "0.0",
    });
    const [selectedSkills, setSelectedSkills] = useState<SkillNFT[]>([]);

    const { setSelected: setSelectedSkill } = useSkillStore();
    const { setSelected: setSelectedFlappymon } = useFlappymonStore();
    const [listedTokenIds, setListedTokenIds] = useState<Set<number>>(
        new Set()
    );

    const { signMessageAsync } = useSignMessage();

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

    async function ensureSkillApproval(): Promise<boolean> {
        if (!address) return false;

        try {
            const isApproved = (await publicClient.readContract({
                address: skillNFTAddress,
                abi: skillNFTAbi.abi,
                functionName: "isApprovedForAll",
                args: [address, BACKEND_WALLET],
            })) as boolean;

            if (isApproved) return true;

            const hash = await walletClient?.writeContract({
                address: skillNFTAddress,
                abi: skillNFTAbi.abi,
                functionName: "setApprovalForAll",
                args: [BACKEND_WALLET, true],
                account: address,
            });

            if (!hash) {
                alert("Failed to send approval transaction.");
                return false;
            }

            console.log("[Approval Sent] Tx:", hash);

            // Optional: wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash });
            console.log("[Approval Confirmed]");

            return true;
        } catch (err: any) {
            console.error("[Approval Error]", err);
            alert("Failed to approve backend wallet. Please try again.");
            return false;
        }
    }

    async function levelUpSkills(tokenIds: [number, number]) {
        if (!address || !signMessageAsync) {
            alert("Wallet not connected");
            return;
        }

        const approved = await ensureSkillApproval();
        if (!approved) return; // BLOCK jika belum approve

        const message = `Level up skills: ${tokenIds[0]}, ${tokenIds[1]}`;
        let signature: string;

        try {
            signature = await signMessageAsync({ message });
        } catch (err: any) {
            alert("Signature failed or rejected");
            return;
        }

        const res = await fetch("/api/skill_combine/level_up", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                tokenIds,
                signature,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Level up failed: " + data.error);
            return;
        }

        const event = new CustomEvent("skill:levelup:success", {
            detail: data,
        });
        window.dispatchEvent(event);
    }

    async function unlockSkills(tokenIds: [number, number]) {
        if (!address || !signMessageAsync) {
            alert("Wallet not connected");
            return;
        }

        const approved = await ensureSkillApproval();
        if (!approved) return; // stop kalau belum approve

        const message = `Unlock skill: ${tokenIds[0]}, ${tokenIds[1]}`;
        let signature: string;

        try {
            signature = await signMessageAsync({ message });
        } catch (err: any) {
            alert("Signature rejected");
            return;
        }

        const res = await fetch("/api/skill_combine/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                tokenIds,
                signature,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Unlock failed: " + data.error);
            return;
        }

        const event = new CustomEvent("skill:unlock:success", { detail: data });
        window.dispatchEvent(event);
    }

    const handleLevelUp = async (tokenIds: [number, number]) => {
        try {
            await levelUpSkills(tokenIds);
            console.log(`Successfully leveled up skills: ${tokenIds}`);
        } catch (err: any) {
            console.error("Level up failed:", err.message || err);
            alert("Level up failed");
        }
    };

    const handleUnlock = async (tokenIds: [number, number]) => {
        try {
            await unlockSkills(tokenIds);
            console.log(`Successfully unlocked skills: ${tokenIds}`);
        } catch (err: any) {
            console.error("Unlock failed:", err.message || err);
            alert("Unlock failed");
        }
    };

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
                {/* Combination Station */}
                <div className="w-full flex justify-center">
                    <div className="w-80 bg-zinc-800 rounded-2xl p-6 my-6 shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-center text-white">
                            Combination Station
                        </h3>

                        {/* Skill Slot Boxes */}
                        <div className="flex justify-between gap-4 mb-6">
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className="w-32 h-32 bg-zinc-700 rounded-xl flex items-center justify-center"
                                >
                                    {selectedSkills[i] ? (
                                        <img
                                            src={`/assets/skills_icon/${selectedSkills[i].skillType}.png`}
                                            alt={selectedSkills[i].name}
                                            className="w-16 h-16 object-contain"
                                        />
                                    ) : (
                                        <span className="text-zinc-500">
                                            Empty
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-4">
                            {selectedSkills.length === 2 &&
                            selectedSkills[0].skillType ===
                                selectedSkills[1].skillType &&
                            selectedSkills[0].skillLevel ===
                                selectedSkills[1].skillLevel ? (
                                <button
                                    onClick={() =>
                                        handleLevelUp([
                                            selectedSkills[0].tokenId,
                                            selectedSkills[1].tokenId,
                                        ])
                                    }
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
                                >
                                    Level Up
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        handleUnlock([
                                            selectedSkills[0].tokenId,
                                            selectedSkills[1].tokenId,
                                        ])
                                    }
                                    className="w-full bg-green-600 hover:bg-green-700 py-2 rounded text-white font-semibold"
                                >
                                    Unlock Skill
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedSkills([])}
                                className="w-full bg-red-600 hover:bg-red-700 py-2 rounded text-white font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

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
                    <h3 className="text-xl font-bold mb-4">Your Skills</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Render Skills */}
                        {allSkill
                            .filter(
                                (skill) => !listedTokenIds.has(skill.tokenId)
                            ) // Filter out listed
                            .map((skill) => {
                                const isSelected = selectedSkills.some(
                                    (s) => s.tokenId === skill.tokenId
                                );
                                return (
                                    <div
                                        key={`skill-${skill.tokenId}`}
                                        className={`bg-zinc-800 rounded-xl p-4 flex flex-col items-center cursor-pointer border-2 ${
                                            isSelected
                                                ? "border-amber-400"
                                                : "border-transparent hover:border-zinc-500"
                                        }`}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedSkills((prev) =>
                                                    prev.filter(
                                                        (s) =>
                                                            s.tokenId !==
                                                            skill.tokenId
                                                    )
                                                );
                                            } else if (
                                                selectedSkills.length < 2
                                            ) {
                                                setSelectedSkills((prev) => [
                                                    ...prev,
                                                    skill,
                                                ]);
                                            }
                                        }}
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
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default skill;


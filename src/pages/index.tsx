// pages/index.tsx
import Navbar from "@/components/website/Navbar";
import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { useAccount, useSignMessage, useSignTypedData } from "wagmi";
import { Dice5, MoveUpRight, Target } from "lucide-react";
import { FlappymonNFT, SkillNFT } from "@/types/nft";
import { flapTokenAbi, flapTokenAddress } from "@/lib/contracts";
import { parseUnits } from "viem";
import { publicClient } from "@/lib/viemClient";

const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`;
const FLAP_COST = parseUnits("50", 18);

export default function Home() {
    const page = "Homepage";

    const [mounted, setMounted] = useState(false);
    const { address, isConnected, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { signTypedDataAsync } = useSignTypedData();

    const [equippedSkill, setEquippedSkill] = useState<SkillNFT | null>(null);
    const [equippedFlappymon, setEquippedFlappymon] =
        useState<FlappymonNFT | null>(null);

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

                if (data.flappymons && data.flappymons.length > 0) {
                    setEquippedFlappymon(data.flappymons[0]);
                }

                if (data.skills && data.skills.length > 0) {
                    setEquippedSkill(data.skills[0]);
                }
            } catch (err) {
                console.error("Failed to fetch wallet data:", err);
            }
        };

        fetchWalletData();
    }, [address]);

    if (!mounted) return null;

    async function rollGacha() {
        if (!address || !signMessageAsync || !signTypedDataAsync) return;

        const balance = (await publicClient.readContract({
            address: flapTokenAddress,
            abi: flapTokenAbi.abi,
            functionName: "balanceOf",
            args: [address],
        })) as bigint;

        if (balance < FLAP_COST) {
            alert(
                "Not enough $FLAP to roll gacha! You need at least 50 $FLAP."
            );
            return;
        }

        const timestamp = Date.now();
        const message = `Roll gacha at ${timestamp}`;

        let signature: string;
        try {
            signature = await signMessageAsync({ message });
        } catch (err: any) {
            if (err.name === "UserRejectedRequestError") {
                alert("You rejected the signature request.");
                return;
            }
            alert("Failed to sign message.");
            return;
        }

        const nonce = (await publicClient.readContract({
            address: flapTokenAddress,
            abi: flapTokenAbi.abi,
            functionName: "nonces",
            args: [address],
        })) as bigint;

        const deadline = Math.floor(Date.now() / 1000) + 3600;

        let signatureTyped: string;
        try {
            signatureTyped = await signTypedDataAsync({
                domain: {
                    name: "FLAPTOKEN",
                    version: "1",
                    chainId: chain?.id ?? 11155111,
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
                message: {
                    owner: address,
                    spender: BACKEND_WALLET,
                    value: FLAP_COST,
                    nonce: BigInt(nonce),
                    deadline: BigInt(deadline),
                },
                primaryType: "Permit",
            });
        } catch (err: any) {
            if (err.name === "UserRejectedRequestError") {
                alert("You rejected the permit signature.");
                return;
            }
            alert("Failed to sign permit.");
            return;
        }

        const res = await fetch("/api/gacha/roll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                signature,
                timestamp,
                permit: {
                    owner: address,
                    spender: BACKEND_WALLET,
                    value: FLAP_COST.toString(),
                    deadline,
                    signature: signatureTyped,
                },
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Something went wrong: " + data.error);
            return;
        }

        const successEvent = new CustomEvent("gacha:result", { detail: data });
        window.dispatchEvent(successEvent);
    }

    async function rollSkillGacha() {
        if (!address || !signMessageAsync || !signTypedDataAsync) return;

        const balance = (await publicClient.readContract({
            address: flapTokenAddress,
            abi: flapTokenAbi.abi,
            functionName: "balanceOf",
            args: [address],
        })) as bigint;

        const cost = parseUnits("80", 18);
        if (balance < cost) {
            alert(
                "Not enough $FLAP! You need at least 80 $FLAP for skill gacha."
            );
            return;
        }

        const timestamp = Date.now();
        const message = `Roll skill gacha at ${timestamp}`;

        let signature: string;
        try {
            signature = await signMessageAsync({ message });
        } catch (err: any) {
            if (err.name === "UserRejectedRequestError") {
                alert("You rejected the signature request.");
                return;
            }
            alert("Failed to sign message.");
            return;
        }

        const nonce = (await publicClient.readContract({
            address: flapTokenAddress,
            abi: flapTokenAbi.abi,
            functionName: "nonces",
            args: [address],
        })) as bigint;

        const deadline = Math.floor(Date.now() / 1000) + 3600;

        let signatureTyped: string;
        try {
            signatureTyped = await signTypedDataAsync({
                domain: {
                    name: "FLAPTOKEN",
                    version: "1",
                    chainId: chain?.id ?? 11155111,
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
                message: {
                    owner: address,
                    spender: BACKEND_WALLET,
                    value: cost,
                    nonce: BigInt(nonce),
                    deadline: BigInt(deadline),
                },
                primaryType: "Permit",
            });
        } catch (err: any) {
            if (err.name === "UserRejectedRequestError") {
                alert("You rejected the permit signature.");
                return;
            }
            alert("Failed to sign permit.");
            return;
        }

        const res = await fetch("/api/skill_gacha/roll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                signature,
                timestamp,
                permit: {
                    owner: address,
                    spender: BACKEND_WALLET,
                    value: cost.toString(),
                    deadline,
                    signature: signatureTyped,
                },
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            const failEvent = new CustomEvent("skillgacha:fail", {
                detail: data?.error || "Unknown error",
            });
            window.dispatchEvent(failEvent);
            return;
        }

        const successEvent = new CustomEvent("skillgacha:result", {
            detail: data,
        });
        window.dispatchEvent(successEvent);
    }

    function handleRollGacha() {
        rollGacha().catch((err) => {
            console.error("Gacha roll failed:", err);
            alert("Something went wrong during gacha roll.");
        });
    }

    function handleRollSkillGacha() {
        rollSkillGacha().catch((err) => {
            console.error("Skill gacha roll failed:", err);
            alert("Something went wrong during skill gacha roll.");
        });
    }

    return (
        <>
            <Navbar isConnected={isConnected} address={address} />
            <div className="w-full h-full overflow-hidden relative">
                {/* Header Section */}
                <div className="w-full h-[45rem] overflow-hidden relative">
                    <div
                        className="w-full h-full flex justify-center items-center relative bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: "url('/assets/bg_2.png')",
                            backgroundAttachment: "fixed",
                        }}
                    >
                        {/* <div className="absolute inset-0 scrolling-bg z-[10]" /> */}

                        <div className="w-full h-full grid grid-cols-2 z-[11]">
                            {/* Left Side */}
                            <div className="flex flex-col items-center justify-start gap-3 p-5">
                                <span className="text-5xl font-bold uppercase">
                                    Flappymon
                                </span>
                                <div className="w-full flex-1">
                                    <video
                                        controls
                                        className="w-full h-full object-cover rounded-2xl shadow-xl"
                                        poster="/assets/poster_video_demo.png"
                                    >
                                        <source
                                            src="/assets/video/flappymon_web3_demo.mp4"
                                            type="video/mp4"
                                        />
                                    </video>
                                </div>
                            </div>

                            {/* Right Side */}
                            <div className="flex flex-col items-center justify-end gap-6 relative py-4">
                                {/* Flappymon standing on the pipe */}
                                {isConnected ? (
                                    <>
                                        <div className="relative flex flex-col items-center justify-centers w-full gap-y-3">
                                            <div className="flex gap-4 mt-4">
                                                <button
                                                    onClick={handleRollGacha}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition flex flex-row justify-start items-center gap-2"
                                                >
                                                    <Dice5
                                                        size={24}
                                                        color="white"
                                                    />
                                                    <span>Gacha Flappymon</span>
                                                </button>
                                                <button
                                                    onClick={
                                                        handleRollSkillGacha
                                                    }
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition flex flex-row justify-start items-center gap-2"
                                                >
                                                    <Target
                                                        size={24}
                                                        color="white"
                                                    />
                                                    <span>Gacha Skills</span>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 w-[70%] rounded-md p-3 font-bold text-white text-xl uppercase bg-slate-400/50">
                                                <span className="text-xl font-bold text-black">
                                                    Flappymon
                                                </span>{" "}
                                                <span className="text-xl font-bold text-black">
                                                    :
                                                </span>{" "}
                                                <span className="text-lg text-black">
                                                    {equippedFlappymon?.name ||
                                                        "Gacha First in Inventory"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 w-[70%] rounded-md p-3 font-bold text-white text-xl uppercase bg-slate-400/50">
                                                <span className="text-xl font-bold text-black">
                                                    Equipped Skill
                                                </span>{" "}
                                                <span className="text-xl font-bold text-black">
                                                    :
                                                </span>{" "}
                                                <span className="text-lg text-black">
                                                    {equippedSkill?.name ||
                                                        "Gacha First in Inventory"}
                                                </span>
                                            </div>
                                            {/* <div className="grid grid-cols-3 w-[70%] rounded-md p-3 font-bold text-white text-xl uppercase bg-slate-400/50">
                                                <span className="text-xl font-bold text-black">
                                                    Available Item
                                                </span>{" "}
                                                <span className="text-xl font-bold text-black">
                                                    :
                                                </span>{" "}
                                                <span className="text-lg text-black">
                                                    {}
                                                </span>
                                            </div> */}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative flex flex-col items-center justify-centers w-full gap-y-3 px-3">
                                            <div className="w-[100%] h-[100%] rounded-md p-3 py-20 font-bold text-white text-xl uppercase bg-slate-400/50 text-center">
                                                <span>
                                                    Connect Your Wallet First
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="relative flex items-end justify-center h-[70%] w-full">
                                    <img
                                        src="/assets/pipe.png"
                                        alt="pipe"
                                        className="absolute bottom-0 z-[10] h-[70%]"
                                    />
                                    <img
                                        src={`/assets/flappymons_sprite/${
                                            equippedFlappymon?.rarity ?? 0
                                        }.png`}
                                        alt="flappymon"
                                        className="relative z-[20] mb-[calc(40%)] w-[20%]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Whitepaper Section */}
                <section
                    className="w-full px-6 md:px-20 py-48 bg-white dark:bg-neutral-900 text-center bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg.png')",
                    }}
                >
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-black">
                            What is Flappymon?
                        </h2>
                        <p className="text-lg md:text-xl text-black dark:text-black mb-10">
                            <strong>Flappymon</strong> is a Web3-powered arcade
                            battler where gameplay meets NFTs. You collect,
                            trade, and level up your <em>Flappymons</em>, equip
                            them with powerful skills, and dominate the arena —
                            all while fully owning your in-game assets. It's
                            fast-paced, skill-based, and economically driven
                            through our native token <code>$FLAP</code>.
                        </p>
                        <a
                            href="/whitepaper"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-2xl shadow-lg transition duration-200"
                        >
                            📄 Read the Whitepaper
                        </a>
                    </div>
                </section>

                {/* Marketplace Section */}
                <section
                    className="w-full px-6 md:px-20 py-36 bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-400 dark:to-yellow-600 text-center bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-6">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-neutral-900">
                            Visit the Skill Marketplace
                        </h2>
                        <p className="text-lg md:text-xl text-neutral-700 dark:text-neutral-800 max-w-2xl">
                            Trade, buy, and sell Skill NFTs to power up your
                            Flappymon team. Each skill is unique — boost your
                            stats, unlock special moves, and gain the edge in
                            battle.
                        </p>
                        <a
                            href="/marketplace"
                            className="inline-block bg-black hover:bg-neutral-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition duration-200"
                        >
                            🛒 Go to Marketplace
                        </a>
                    </div>
                </section>

                {/* Navigation Hub Section */}
                <section
                    className="w-full flex justify-center items-center px-6 py-26 bg-sky-900/90 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="w-full max-w-4xl bg-white dark:bg-neutral-900/70 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-10 flex flex-col gap-6 text-start">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                            More Services
                        </h2>

                        {/* Marketplace */}
                        <a
                            href="/marketplace"
                            className="group flex flex-col gap-1 w-full hover:text-yellow-500 transition duration-150"
                        >
                            <div
                                className="flex justify-between items-center text-4xl font-black"
                                style={{
                                    color: "black",
                                    textShadow:
                                        "1px 1px 0 white, -1px -1px 0 white, -1px 1px 0 white, 1px -1px 0 white",
                                }}
                            >
                                Marketplace
                                <MoveUpRight
                                    className="text-slate-400/75 group-hover:text-yellow-500"
                                    size={30}
                                />
                            </div>
                            <p className="text-md text-neutral-500 dark:text-neutral-400">
                                Browse and purchase new skill NFTs from other
                                players.
                            </p>
                        </a>

                        <hr className="border-t border-neutral-300 dark:border-neutral-700" />

                        {/* Inventory */}
                        <a
                            href="/inventory"
                            className="group flex flex-col gap-1 w-full hover:text-yellow-500 transition duration-150"
                        >
                            <div
                                className="flex justify-between items-center text-4xl font-black"
                                style={{
                                    color: "black",
                                    textShadow:
                                        "1px 1px 0 white, -1px -1px 0 white, -1px 1px 0 white, 1px -1px 0 white",
                                }}
                            >
                                Inventory
                                <MoveUpRight
                                    className="text-slate-400/75 group-hover:text-yellow-500"
                                    size={30}
                                />
                            </div>
                            <p className="text-md text-neutral-500 dark:text-neutral-400">
                                View, equip, and manage your owned skill NFTs.
                            </p>
                        </a>

                        <hr className="border-t border-neutral-300 dark:border-neutral-700" />

                        {/* Whitepaper */}
                        <a
                            href="/whitepaper"
                            className="group flex flex-col gap-1 w-full hover:text-yellow-500 transition duration-150"
                        >
                            <div
                                className="flex justify-between items-center text-4xl font-black"
                                style={{
                                    color: "black",
                                    textShadow:
                                        "1px 1px 0 white, -1px -1px 0 white, -1px 1px 0 white, 1px -1px 0 white",
                                }}
                            >
                                Whitepaper
                                <MoveUpRight
                                    className="text-slate-400/75 group-hover:text-yellow-500"
                                    size={30}
                                />
                            </div>
                            <p className="text-md text-neutral-500 dark:text-neutral-400">
                                Dive into the technical design and economic
                                model behind the game.
                            </p>
                        </a>
                    </div>
                </section>

                {/* Community Section */}
                <section
                    className="w-full bg-neutral-100 dark:bg-neutral-900 py-16 px-6 flex flex-col items-center text-center bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <h2 className="text-3xl font-bold text-neutral-800 dark:text-white mb-6">
                        🚀 Join Our Community
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-10 max-w-xl">
                        Connect with other Flappymon trainers, share your
                        progress, and get the latest updates.
                    </p>
                    <div className="flex gap-6 flex-wrap justify-center">
                        <a
                            href="mailto:support@flappymon.com"
                            className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-white text-2xl hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
                            aria-label="Email"
                        ></a>
                        <a
                            href="https://discord.gg/your-server"
                            className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl hover:bg-indigo-600 transition"
                            aria-label="Discord"
                        ></a>
                        <a
                            href="https://x.com/yourusername"
                            className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl hover:bg-neutral-800 transition"
                            aria-label="X"
                        ></a>
                    </div>
                </section>
            </div>
        </>
    );
}


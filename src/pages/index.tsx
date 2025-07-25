// pages/index.tsx
import Navbar from "@/components/website/Navbar";
import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { useAccount, useSignMessage, useSignTypedData } from "wagmi";
import {
    Dice5,
    Linkedin,
    Mail,
    MoveUpRight,
    Target,
    Youtube,
} from "lucide-react";
import { FlappymonNFT, SkillNFT } from "@/types/nft";
import { flapTokenAbi, flapTokenAddress } from "@/lib/contracts";
import { parseUnits } from "viem";
import { publicClient } from "@/lib/viemClient";
import Image from "next/image";
import Link from "next/link";
import { WalletOptions } from "@/components/walletOptions";
import { useFlappymonStore } from "@/store/flappymonStore";
import { useSkillStore } from "@/store/skillStore";

const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`;
const FLAP_COST = parseUnits("50", 18);

export default function Home() {
    const page = "Homepage";

    const [mounted, setMounted] = useState(false);
    const { address, isConnected, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { signTypedDataAsync } = useSignTypedData();
    const [faucetLoading, setFaucetLoading] = useState(false);
    const [faucetClaimed, setFaucetClaimed] = useState(false);

    const [equippedSkill, setEquippedSkill] = useState<SkillNFT | null>(null);
    const [equippedFlappymon, setEquippedFlappymon] =
        useState<FlappymonNFT | null>(null);

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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
                    useFlappymonStore
                        .getState()
                        .setSelected(data.flappymons[0]);
                }

                if (data.skills && data.skills.length > 0) {
                    setEquippedSkill(data.skills[0]);
                    useSkillStore.getState().setSelected(data.skills[0]);
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

        setLoading(true);
        setShowSuccess(false);
        try {
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

            const signature = await signMessageAsync({ message });

            const nonce = (await publicClient.readContract({
                address: flapTokenAddress,
                abi: flapTokenAbi.abi,
                functionName: "nonces",
                args: [address],
            })) as bigint;

            const deadline = Math.floor(Date.now() / 1000) + 3600;

            const signatureTyped = await signTypedDataAsync({
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

            const successEvent = new CustomEvent("gacha:result", {
                detail: data,
            });
            window.dispatchEvent(successEvent);
            setShowSuccess(true); // ✅ Show success modal
        } catch (err) {
            console.error("Gacha roll failed:", err);
            alert("Something went wrong during gacha roll.");
        } finally {
            setLoading(false);
        }
    }

    async function rollSkillGacha() {
        if (!address || !signMessageAsync || !signTypedDataAsync) return;

        setLoading(true);
        setShowSuccess(false);

        try {
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
            setShowSuccess(true); // ✅ Show success modal
        } catch (err) {
            console.error("Gacha roll failed:", err);
            alert("Something went wrong during gacha roll.");
        } finally {
            setLoading(false);
        }
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

    async function claimFaucet() {
        if (!address || !signMessageAsync) return;

        try {
            setFaucetLoading(true);
            const timestamp = Date.now();
            const message = `Claim faucet at ${timestamp}`;
            const signature = await signMessageAsync({ message });

            const res = await fetch("/api/faucet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, signature, timestamp }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert("Failed to claim: " + data.error);
            } else {
                alert("Claim Successfuly");
                setFaucetClaimed(true);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to claim.");
        } finally {
            setFaucetLoading(false);
        }
    }

    return (
        <>
            <Navbar isConnected={isConnected} address={address} />
            {/* Fullscreen Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center text-white text-2xl">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mb-6"></div>
                    Rolling the gacha
                </div>
            )}

            {/* Fullscreen Success Modal */}
            {showSuccess && !loading && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center text-white text-center px-6">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold mb-2">Gacha Success!</h2>
                    <p className="text-xl mb-6">
                        Check your inventory to see what you got.
                    </p>
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="mt-4 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                    >
                        Close
                    </button>
                </div>
            )}
            <div className="w-full h-full overflow-hidden relative">
                {/* Header Section */}
                {address && !faucetClaimed && (
                    <>
                        <div className="absolute top-4 right-4 z-50 flex flex-col justify-center items-center">
                            <button
                                onClick={claimFaucet}
                                disabled={faucetLoading}
                                className="bg-sky-900 text-white px-4 py-2 rounded shadow"
                            >
                                {faucetLoading
                                    ? "Claiming..."
                                    : "Claim 500 $FLAP"}
                            </button>
                            <div className="flex flex-col gap-4 mt-4">
                                <button
                                    onClick={handleRollGacha}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition flex flex-row justify-start items-center gap-2 w-54"
                                >
                                    <Dice5 size={24} color="white" />
                                    <span>Gacha Flappymon</span>
                                </button>
                                <button
                                    onClick={handleRollSkillGacha}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition flex flex-row justify-start items-center gap-2 w-54"
                                >
                                    <Target size={24} color="white" />
                                    <span>Gacha Skills</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
                <section
                    id="main-section-home"
                    className="w-full py-12 px-4 text-white bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {/* LEFT AREA */}
                        <div className="flex flex-col justify-between gap-8 h-[100%]">
                            <div className="flex flex-col">
                                <h2 className="text-4xl font-bold text-black">
                                    Welcome to the Flappymon Universe
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <div className="text-sm text-black">
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipiscing elit. Sed do eiusmod tempor
                                        incididunt ut labore et dolore magna
                                        aliqua.
                                    </div>
                                </div>
                            </div>

                            {/* Replaced Swiper with Video */}
                            <div className="relative w-full bg-black rounded-lg overflow-hidden">
                                <video
                                    className="w-full h-full object-cover"
                                    controls
                                    muted
                                    playsInline
                                    src="/assets/video/flappymon_web3_demo.mp4"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </div>

                        {/* RIGHT AREA */}
                        <div className="flex flex-col gap-6">
                            <div className=" p-6 rounded-lg flex flex-col items-center text-center gap-4">
                                {!isConnected && (
                                    <>
                                        <span className="text-sm text-black">
                                            Connect your wallet to customize
                                            your character!
                                        </span>
                                        <WalletOptions />
                                    </>
                                )}
                                <div>
                                    <img
                                        src={`/assets/flappymons_sprite/${
                                            equippedFlappymon?.rarity ?? 0
                                        }.png`}
                                        alt="avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* <div className="w-20">
                                    <img
                                        src="/images/main/section_a/floor.png"
                                        alt="floor icon"
                                        className="w-full"
                                    />
                                </div> */}
                            </div>

                            {/* NEWS LIST */}
                            <div className="px-6 pt-6 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-black">
                                        NEWS
                                    </h2>
                                </div>
                                <ul className="flex flex-col gap-4 text-sm">
                                    {[
                                        {
                                            title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius.",
                                            date: "2025.06.25",
                                        },
                                        {
                                            title: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.",
                                            date: "2025.07.23",
                                        },
                                        {
                                            title: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
                                            date: "2025.07.17",
                                        },
                                    ].map((news, idx) => (
                                        <li
                                            key={idx}
                                            className="border border-gray-700 bg-gray-700 rounded-xl p-4 hover:border-blue-400 transition-all"
                                        >
                                            <a className="flex flex-col hover:text-blue-400">
                                                <span className="font-medium">
                                                    {news.title}
                                                </span>
                                                <time className="text-gray-400 text-xs mt-1">
                                                    {news.date}
                                                </time>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Whitepaper Section */}
                <section
                    className="w-full px-6 md:px-20 py-10 bg-white dark:bg-neutral-900 text-center bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="max-w-5xl mx-auto rounded-xl bg-white/80 dark:bg-white/90 shadow-xl p-10 backdrop-blur-md">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-black">
                            What is Flappymon?
                        </h2>
                        <p className="text-lg md:text-xl text-black dark:text-black mb-10">
                            <strong>Flappymon</strong> is a Web3-powered arcade
                            battler where gameplay meets NFTs. You collect,
                            trade, and level up your <em>Flappymons</em>, equip
                            them with powerful skills, and dominate the arena —
                            all while fully owning your in-game assets. It’s
                            fast-paced, skill-based, and economically driven
                            through our native token <code>$FLAP</code>.
                        </p>
                        <a
                            href="https://flappymonwhitepaper.javakoding.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-2xl shadow-lg transition duration-200"
                        >
                            📄 Read the Whitepaper
                        </a>
                    </div>
                </section>

                {/* Featured App */}
                <section
                    className="w-full px-6 md:px-26 py-10 bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-400 dark:to-yellow-600 text-center bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="mx-auto bg-white rounded-lg shadow-lg p-10 px-9 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                        {/* Left Side */}
                        <div className="flex-1 space-y-6">
                            <h2 className="text-xl font-extrabold text-neutral-900">
                                Featured App
                            </h2>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900">
                                Flappymon
                            </h2>
                            <p className="text-lg md:text-xl text-neutral-700">
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua. Ut
                                enim ad minim veniam, quis nostrud exercitation
                                ullamco laboris nisi ut aliquip ex ea commodo
                                consequat. Duis aute irure dolor in
                                reprehenderit in voluptate velit esse cillum
                                dolore eu fugiat nulla pariatur. Excepteur sint
                                occaecat cupidatat non proident, sunt in culpa
                                qui officia deserunt mollit anim id est laborum.
                            </p>
                            <div className="flex flex-col justify-start items-start space-y-2">
                                <ul className="text-left space-y-1 text-lg text-neutral-800">
                                    <li className="flex">
                                        <span className="w-24 font-semibold">
                                            Language:
                                        </span>
                                        <span>English</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-semibold">
                                            Platform:
                                        </span>
                                        <span>Web</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-semibold">
                                            Genre:
                                        </span>
                                        <span>Web3 Auto-Battler</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-semibold">
                                            Currency:
                                        </span>
                                        <span>$FLAP</span>
                                    </li>
                                </ul>
                            </div>

                            <Link
                                href="/Game"
                                className="inline-block bg-black hover:bg-neutral-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition duration-200"
                            >
                                PLAY NOW
                            </Link>
                        </div>

                        {/* Right Side (Placeholder image or content block) */}
                        <div className="flex-1 flex justify-center">
                            <img
                                src="/assets/flappymon_thumbnail.png"
                                alt="Game Preview"
                                className="w-full max-w-xl rounded-xl shadow-md"
                            />
                        </div>
                    </div>
                </section>

                {/* Marketplace Section */}
                <section
                    className="w-full px-6 md:px-26 py-10 bg-gradient-to-br text-center bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="mx-auto">
                        <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-lg p-10 py-10 flex flex-col items-center justify-center gap-6">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900">
                                Flappymon Marketplace
                            </h2>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                Smoother trades, better skills.
                            </h2>
                            <p className="text-lg md:text-xl text-neutral-700 max-w-2xl">
                                Trade, buy, and sell Skill NFTs to power up your
                                Flappymon team. Each skill is unique — boost
                                your stats, unlock special moves, and gain the
                                edge in battle.
                            </p>
                            <Link
                                href="/marketplace"
                                className="inline-block bg-black hover:bg-neutral-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition duration-200"
                            >
                                🛒 Go to Marketplace
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Navigation Hub Section */}
                <section
                    className="w-full flex justify-center items-center px-26 py-10 bg-sky-900/90 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/assets/bg_2.png')",
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="w-full bg-white dark:bg-neutral-900/70 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-10 flex flex-col gap-6 text-start px-66">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                            More Services
                        </h2>

                        {/* Marketplace */}
                        <Link
                            href="/marketplace"
                            className="group flex flex-col gap-1 w-full hover:text-yellow-500 transition duration-150"
                        >
                            <div
                                className="flex justify-between items-center text-7xl font-black"
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
                        </Link>

                        <hr className="border-t border-neutral-300 dark:border-neutral-700" />

                        {/* Inventory */}
                        <Link
                            href="/inventory"
                            className="group flex flex-col gap-1 w-full hover:text-yellow-500 transition duration-150"
                        >
                            <div
                                className="flex justify-between items-center text-7xl font-black"
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
                        </Link>

                        <hr className="border-t border-neutral-300 dark:border-neutral-700" />

                        {/* Whitepaper */}
                        <Link
                            href="/whitepaper"
                            className="group flex flex-col gap-1 w-full hover:text-yellow-500 transition duration-150"
                        >
                            <div
                                className="flex justify-between items-center text-7xl font-black"
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
                        </Link>
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
                    <h2 className="text-5xl font-bold text-neutral-800  mb-6">
                        Connect with Me
                    </h2>
                    <p className="text-lg text-neutral-600 mb-10 max-w-xl">
                        Connect with other Flappymon trainers, share your
                        progress, and get the latest updates.
                    </p>
                    <div className="flex gap-6 flex-wrap justify-center">
                        <a
                            href="mailto:ashof.z73@gmail.com"
                            className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-white text-2xl hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
                            aria-label="Email"
                        >
                            <Mail />
                        </a>
                        {/* <a
                            href="https://x.com/yourusername"
                            className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl hover:bg-neutral-800 transition"
                            aria-label="X"
                        ></a> */}
                        <a
                            href="https://www.linkedin.com/in/ashof-zulkarnaen-a0863b349/"
                            className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl hover:bg-neutral-800 transition"
                            aria-label="Linkedin"
                        >
                            <Linkedin />
                        </a>
                        <a
                            href="https://www.youtube.com/@javakodingdotcom"
                            className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl hover:bg-neutral-800 transition"
                            aria-label="Youtube"
                        >
                            <Youtube />
                        </a>
                    </div>
                </section>

                <section className="flex justify-center items-center px-[10%] bg-zinc-800 pt-5 w-full">
                    <div className="flex flex-row justify-center items-stretch w-full gap-5">
                        {/* Left Section */}
                        <div className="rounded-tr-md bg-gradient-to-l from-zinc-700 to-zinc-800 p-6 w-[20%] flex flex-col justify-between">
                            <Link
                                href="/"
                                className="text-white text-2xl font-bold mb-6"
                            >
                                Flappymon
                            </Link>

                            <div className="flex flex-col justify-start gap-4">
                                <div className="flex gap-4 text-white text-lg">
                                    <a href="mailto:ashof.z73@gmail.com">
                                        <Mail size={24} />
                                    </a>
                                    <a href="https://www.linkedin.com/in/ashof-zulkarnaen-a0863b349/">
                                        <Linkedin size={24} />
                                    </a>
                                    <a href="https://www.youtube.com/@javakodingdotcom">
                                        <Youtube size={24} />
                                    </a>
                                </div>
                                <span className="text-base text-gray-400">
                                    © {new Date().getFullYear()} Flappymon. All
                                    rights reserved.
                                </span>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="w-[80%] flex flex-col justify-between text-white py-4 text-lg">
                            <div className="flex justify-between w-full mb-4">
                                <span className="font-semibold">News</span>
                                <span className="font-semibold">Navigator</span>
                            </div>

                            <div className="w-full h-px bg-gray-700 mb-4"></div>

                            <div className="flex flex-wrap gap-4 text-gray-300 mb-6 text-lg">
                                <a
                                    href="https://flappymonwhitepaper.javakoding.com/"
                                    className="cursor-pointer hover:text-white flex flex-row justify-start items-center gap-1"
                                >
                                    WhitePaper
                                    <MoveUpRight
                                        size={15}
                                        className="text-slate-400/75 group-hover:text-yellow-500"
                                    />
                                </a>
                                <Link
                                    href="/Marketplace"
                                    className="cursor-pointer hover:text-white flex flex-row justify-start items-center gap-1"
                                >
                                    Marketplace
                                    <MoveUpRight
                                        size={15}
                                        className="text-slate-400/75 group-hover:text-yellow-500"
                                    />
                                </Link>
                                <Link
                                    href="/Inventory"
                                    className="cursor-pointer hover:text-white flex flex-row justify-start items-center gap-1"
                                >
                                    Inventory
                                    <MoveUpRight
                                        size={15}
                                        className="text-slate-400/75 group-hover:text-yellow-500"
                                    />
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-base text-gray-400">
                                <span className="hover:text-white cursor-pointer">
                                    Terms of Use
                                </span>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <span className="hover:text-white cursor-pointer">
                                    Privacy Policy
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}


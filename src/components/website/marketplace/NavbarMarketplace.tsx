import React, { useEffect, useRef, useState } from "react";
import {
    AlignJustifyIcon,
    BookMarked,
    MessageSquareText,
    Package,
    Store,
    Target,
} from "lucide-react";
import { WalletOptions } from "@/components/walletOptions";
import Link from "next/link";

interface NavbarProps {
    isConnected: boolean | null;
    address: `0x${string}` | undefined;
    page: string | null;
}

const NavbarMarketplace: React.FC<NavbarProps> = ({
    isConnected,
    address,
    page,
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full p-3 text-white bg-white shadow">
            <div className="flex items-center justify-between px-8">
                {/* Left section: Burger and Brand */}
                <div className="flex items-center gap-x-4 text-black relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="p-2 rounded-md hover:bg-gray-200 transition"
                    >
                        <AlignJustifyIcon />
                    </button>

                    {dropdownOpen && (
                        <div
                            ref={dropdownRef}
                            className="absolute top-full left-0 mt-2 bg-white shadow-lg border rounded-3xl p-1 z-50"
                        >
                            <ul className="flex flex-col gap-y-2 p-4">
                                <li>
                                    <Link
                                        href="/Marketplace"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <Store size={30} /> Marketplace
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/Inventory"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <Package size={30} /> Inventory
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="https://flappymon-whitepaper.vercel.app/"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <BookMarked size={30} /> Whitepaper
                                    </a>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <MessageSquareText size={30} />{" "}
                                        Community
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Brand title - clickable */}
                    <Link href="/">
                        <span className="text-3xl font-bold cursor-pointer hover:text-blue-600 transition">
                            Flappymon
                        </span>
                    </Link>
                </div>

                {/* Center Nav Links */}
                <div className="hidden md:flex gap-x-8 text-black font-semibold text-lg">
                    <Link
                        href="/Marketplace"
                        className="hover:text-blue-600 transition flex flex-row justify-center items-center gap-1"
                    >
                        <Store size={25} /> Marketplace
                    </Link>
                    <Link
                        href="/Inventory"
                        className="hover:text-blue-600 transition flex flex-row justify-center items-center gap-1"
                    >
                        <Package size={25} /> Inventory
                    </Link>
                    <Link
                        href="/Skill"
                        className="hover:text-blue-600 transition flex flex-row justify-center items-center gap-1"
                    >
                        <Target size={25} /> Skill
                    </Link>
                </div>

                {/* Right section */}
                <div className="flex justify-center items-center">
                    {isConnected ? (
                        <div>
                            <button className="bg-green-800 py-2 px-4 rounded-md">
                                <span className="text-white font-bold text-center text-3xl">
                                    Inventory
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center gap-x-3">
                            <WalletOptions />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NavbarMarketplace;


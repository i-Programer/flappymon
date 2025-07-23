import React, { useState, useRef, useEffect } from "react";
import {
    AlignJustifyIcon,
    BookMarked,
    MessageSquareText,
    Package,
    Store,
} from "lucide-react";
import { WalletOptions } from "../walletOptions";
import Link from "next/link";

interface NavbarProps {
    isConnected: boolean | null;
    address: `0x${string}` | undefined;
}

const Navbar: React.FC<NavbarProps> = ({ isConnected, address }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
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
        <div className="w-full bg-white h-[64px] pl-3 relative">
            <div className="flex items-center justify-between px-8 relative">
                {/* Left side: logo + dropdown */}
                <div className="flex items-center gap-x-4 text-black relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="p-2 rounded-md hover:bg-gray-200 transition"
                    >
                        <AlignJustifyIcon />
                    </button>

                    {/* Dropdown Menu */}
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

                    <span className="text-3xl font-bold">Flappymon</span>
                </div>

                {/* Right side: Wallet/Play Button */}
                <div className="flex items-center">
                    {isConnected ? (
                        <Link
                            href="/Game"
                            className="absolute right-0 top-0 h-[64px] px-10 py-2 bg-gradient-to-l from-red-500 to-yellow-500 transition flex items-center justify-center"
                        >
                            <span className="text-white font-bold text-3xl flex flex-row justify-center items-center gap-1">
                                <img
                                    src="/assets/flappybird_gamestart.gif"
                                    alt="Flappy Bird Flying"
                                    className="w-16 h-16 object-contain"
                                />
                                GAME START
                            </span>
                        </Link>
                    ) : (
                        <div className="flex gap-x-3">
                            <WalletOptions />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;


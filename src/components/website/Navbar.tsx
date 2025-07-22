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
        <div className="w-full bg-white p-3 relative">
            <div className="flex items-center justify-between px-8">
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
                                        href="/marketplace"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <Store size={30} /> Marketplace
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/inventory"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <Package size={30} /> Inventory
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/whitepaper"
                                        className="p-3 w-64 flex flex-row gap-x-1 justify-start items-center rounded-3xl shadow-md border border-slate-500/80 text-xl font-bold hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <BookMarked size={30} /> Whitepaper
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/community"
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
                            href="/game"
                            className="bg-green-800 py-2 px-4 rounded-md hover:bg-green-700 transition"
                        >
                            <span className="text-white font-bold text-2xl">
                                Play
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


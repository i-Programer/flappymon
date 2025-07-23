import * as React from "react";
import { useConnect } from "wagmi";
import { Wallet } from "lucide-react";

export function WalletOptions() {
    const { connectors, connect } = useConnect();
    const connector = connectors[0]; // take the first one (usually MetaMask)

    if (!connector) return null;

    return (
        <button
            className="p-2 cursor-pointer rounded-md border-2 border-black"
            onClick={() => connect({ connector })}
        >
            <div className="flex justify-center items-center gap-x-3">
                <Wallet color="black" />
                <span className="text-black font-bold ">
                    Connect {connector.name}
                </span>
            </div>
        </button>
    );
}


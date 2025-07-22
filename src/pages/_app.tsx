import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig, WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WagmiConfig config={config}>
            <QueryClientProvider client={queryClient}>
                <Component {...pageProps} />
            </QueryClientProvider>
        </WagmiConfig>
    );
}


'use client';

import { useEffect, useRef } from 'react';
import { createPhaserGame } from './game/main';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from "@/lib/wagmi";
import { WalletOptions } from './components/walletOptions';

import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'
import { Account } from './components/account';

const queryClient = new QueryClient()

export default function GameCanvas() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  useEffect(() => {
    let game: Phaser.Game | null = null;

    if (gameContainerRef.current) {
      game = createPhaserGame(gameContainerRef.current.id);
    }

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  return (
    // <WagmiProvider config={config}>
    //   <QueryClientProvider client={queryClient}>n
    <>
      <div className={`w-screen h-screen fixed z-10 ${address ? "hidden" : "flex"} justify-center items-center bg-slate-900`}>
        <div className="flex justify-center items-center gap-7">
          <WalletOptions />
        </div>
      </div>

      {address && <Account/>}

      <div id="phaser-game" ref={gameContainerRef} className="w-screen h-screen" />
    </>
    //   </QueryClientProvider> 
    // </WagmiProvider>
  );
}

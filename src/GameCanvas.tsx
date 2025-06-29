'use client';

import { useEffect, useRef } from 'react';
import { createPhaserGame } from './game/main';

export default function GameCanvas() {
  const gameContainerRef = useRef<HTMLDivElement>(null);

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
    <div id="phaser-game" ref={gameContainerRef} className="w-screen h-screen" />
  );
}

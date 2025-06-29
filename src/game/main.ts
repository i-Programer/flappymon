import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const createPhaserGame = (parentId: string) => {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#87CEEB', // Light sky blue (customize this)
    scene: [GameScene],
    parent: parentId,
    physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // We set per object gravity in create()
          debug: false,
        },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
};

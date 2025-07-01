import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MainMenuScene } from './scenes/MainMenuScene';

export const createPhaserGame = (parentId: string) => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#87CEEB', // Light sky blue (customize this)
    scene: [MainMenuScene, GameScene],
    parent: parentId,
    physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 }, // We set per object gravity in create()
          debug: false,
        },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });

  return game;
};

import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterScene } from './scenes/CharacterScene';
import { SkillScene } from './scenes/SkillScene';
import { MarketplaceScene } from './scenes/MarketplaceScene';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';

export const createPhaserGame = (parentId: string) => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#87CEEB', // Light sky blue (customize this)
    scene: [Boot, MainMenuScene, GameScene, CharacterScene, SkillScene, MarketplaceScene],
    parent: parentId,
    physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 }, // We set per object gravity in create()
          debug: false,
          fixedStep: true,
        },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
  return game;
};

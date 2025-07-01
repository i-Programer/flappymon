import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    const title = this.add.text(width / 2, 80, 'Flappymon', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Connect Wallet
    const connectButton = this.add.text(width / 2, 200, 'Connect Wallet', {
      fontSize: '28px',
      backgroundColor: '#4444aa',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    connectButton.on('pointerdown', () => {
      console.log('TODO: Connect Wallet');
    });

    // Start Button
    const startButton = this.add.text(width / 2, 280, 'Start Game', {
      fontSize: '32px',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Settings Button
    const settingsButton = this.add.text(width / 2, 360, 'Settings', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    settingsButton.on('pointerdown', () => {
      console.log('TODO: Settings scene');
    });

    // Character Button
    const characterButton = this.add.text(width / 2, 430, 'Character', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    characterButton.on('pointerdown', () => {
      console.log('TODO: Character selection');
    });

    // Optional: background
    this.cameras.main.setBackgroundColor('#222');
  }
}

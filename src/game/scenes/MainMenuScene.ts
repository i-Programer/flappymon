import Phaser from 'phaser';
import { useWalletStore } from '@/store/walletStore'


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
    const address = useWalletStore.getState().address;
    const statusText = this.add.text(width / 2, 140, address 
      ? `Wallet Connected: ${address.slice(0, 6)}...`
      : 'Wallet Not Connected', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Start Button
    const startButton = this.add.text(width / 2, 280, 'Start Game', {
      fontSize: '32px',
      backgroundColor: address ? '#00aa00' : '#777',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    if (address) {
      startButton.on('pointerdown', () => {
        this.scene.start('GameScene');
      });
    } else {
      startButton.on('pointerdown', () => {
        alert('Connect your wallet first.');
      });
    }

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

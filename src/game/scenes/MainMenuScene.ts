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

    const address = useWalletStore.getState().address;
    const statusText = this.add.text(width / 2, 140, address 
      ? `Wallet Connected: ${address.slice(0, 6)}...`
      : 'Wallet Not Connected', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

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

    const settingsButton = this.add.text(width / 2, 360, 'Settings', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    settingsButton.on('pointerdown', () => {
      console.log('TODO: Settings scene');
    });

    const characterButton = this.add.text(width / 2, 430, 'Character', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    characterButton.on('pointerdown', () => {
      this.scene.start('CharacterScene')
    });

    const gachaButton = this.add.text(width / 2, 510, 'Open Gacha', {
      fontSize: '28px',
      backgroundColor: '#aa00aa',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();
    
    gachaButton.on('pointerdown', () => {
      if ((window as any).rollGacha) {
        (window as any).rollGacha();
      } else {
        console.warn('Gacha function not available yet.');
      }
    });

    // ✅ Define handlers using arrow functions to preserve `this`
    this.handleGachaResult = (e: any) => {
      const { rarity } = e.detail;

      const rarityNames = ['Common', 'Rare', 'Epic', 'Legendary'];
      const rarityColors = ['#4caf50', '#2196f3', '#9c27b0', '#ffc107'];
      const message = `You got a ${rarityNames[rarity]} Flappymon!`;

      const popup = this.add.text(this.scale.width / 2, this.scale.height / 2, message, {
        fontSize: '32px',
        color: rarityColors[rarity],
        backgroundColor: '#111',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(999);

      this.tweens.add({
        targets: popup,
        alpha: 0,
        duration: 2500,
        ease: 'Power1',
        onComplete: () => popup.destroy(),
      });
    };

    this.handleGachaFail = (e: any) => {
      const message = typeof e.detail === 'string' ? e.detail : 'Unknown error';

      const popup = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Gacha failed: ' + message, {
        fontSize: '24px',
        color: '#ff4444',
        backgroundColor: '#000',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(999);

      this.tweens.add({
        targets: popup,
        alpha: 0,
        duration: 2500,
        ease: 'Power1',
        onComplete: () => popup.destroy(),
      });
    };

    window.addEventListener('gacha:result', this.handleGachaResult);
    window.addEventListener('gacha:fail', this.handleGachaFail);

    // ✅ Clean up when scene is shutdown
    this.events.once('shutdown', () => {
      window.removeEventListener('gacha:result', this.handleGachaResult);
      window.removeEventListener('gacha:fail', this.handleGachaFail);
    });

    this.cameras.main.setBackgroundColor('#222');
  }

  // ✅ Declare handlers as class properties
  private handleGachaResult!: (e: any) => void;
  private handleGachaFail!: (e: any) => void;
}

import Phaser from 'phaser';
import { useWalletStore } from '@/store/walletStore'


export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    const scene = this // ✅ capture Phaser scene

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
      this.scene.start('CharacterScene')
    })
    

    // Gacha Button
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

    window.addEventListener('gacha:result', (e: any) => {
      const { rarity, txHash } = e.detail
  
      const rarityNames = ['Common', 'Rare', 'Epic', 'Legendary']
      const rarityColors = ['#4caf50', '#2196f3', '#9c27b0', '#ffc107']
  
      const message = `You got a ${rarityNames[rarity]} Flappymon!`
  
      const popup = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, message, {
        fontSize: '32px',
        color: rarityColors[rarity],
        backgroundColor: '#111',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(999)
  
      scene.tweens.add({
        targets: popup,
        alpha: 0,
        duration: 2500,
        ease: 'Power1',
        onComplete: () => popup.destroy(),
      })
    })
  
    window.addEventListener('gacha:fail', (e: any) => {
      const popup = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, 'Gacha failed: ' + e.detail, {
        fontSize: '24px',
        color: '#ff4444',
        backgroundColor: '#000',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(999)
  
      scene.tweens.add({
        targets: popup,
        alpha: 0,
        duration: 2500,
        ease: 'Power1',
        onComplete: () => popup.destroy(),
      })
    })
    
    // Optional: background
    this.cameras.main.setBackgroundColor('#222');
  }
}

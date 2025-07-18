import Phaser from 'phaser';
import { useWalletStore } from '@/store/walletStore';

export class MainMenuScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private backgroundSpeed = 0.3; // Adjust for scroll speed

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  private handleSkillGachaResult = (e: any) => {
    if (!this.sys || !this.sys.isActive()) return;

    const { skillType, level } = e.detail;
    const skillNames = ['Dash', 'Disappear', 'Gap Manipulation', 'Pipe Destroyer', 'Floating'];
    const message = `🎓 You got ${skillNames[skillType]} (Lv ${level})!`;

    const popup = this.add.text(this.scale.width / 2, this.scale.height / 2, message, {
      fontSize: '28px',
      color: '#00ffff',
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

  private handleGachaResult = (e: any) => {
    if (!this.sys || !this.sys.isActive()) return;

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

  create() {
    const { width, height } = this.scale;

    // Add background image and stretch it to twice the screen width
    this.background = this.add.image(0, 0, 'bg_sky')
      .setOrigin(0, 0)
      .setDisplaySize(width * 2, height)
      .setScrollFactor(0)
      .setDepth(-10); // behind everything

    const title = this.add.text(width / 2, 80, 'Flappymon', {
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6, // Adjust thickness
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        stroke: true,
        fill: true
      }
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

    const characterButton = this.add.text(width / 2, 360, 'Character', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    characterButton.on('pointerdown', () => {
      this.scene.start('CharacterScene');
    });

    const skillsButton = this.add.text(width / 2, 430, 'Skills', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    skillsButton.on('pointerdown', () => {
      this.scene.start('SkillScene');
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

    const skillGachaButton = this.add.text(width / 2, 580, 'Skill Gacha', {
      fontSize: '28px',
      backgroundColor: '#0066aa',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    skillGachaButton.on('pointerdown', () => {
      if ((window as any).rollSkillGacha) {
        (window as any).rollSkillGacha();
      } else {
        console.warn('Skill gacha function not available yet.');
      }
    });

    const marketplaceButton = this.add.text(130, 50, 'Marketplace', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    marketplaceButton.on('pointerdown', () => {
      this.scene.start('MarketplaceScene');
    });

    const whitepaperButton = this.add.text(130, 100, 'Whitepaper', {
      fontSize: '28px',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();

    whitepaperButton.on('pointerdown', () => {
      window.open('https://flappymon-whitepaper.vercel.app/', '_blank');
    });

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
    window.addEventListener('skillgacha:result', this.handleSkillGachaResult);

    this.events.once('shutdown', () => {
      window.removeEventListener('skillgacha:result', this.handleSkillGachaResult);
      window.removeEventListener('gacha:result', this.handleGachaResult);
      window.removeEventListener('gacha:fail', this.handleGachaFail);
    });
  }

  update() {
     // Move background left
     this.background.x -= this.backgroundSpeed;

     // Reset when half of it has moved off-screen
     if (this.background.x <= -this.background.displayWidth / 2) {
       this.background.x = 0;
     }
  }

  private handleGachaFail!: (e: any) => void;
}

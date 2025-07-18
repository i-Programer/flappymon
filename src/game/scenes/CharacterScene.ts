import Phaser from 'phaser'
import { getUserFlappymons } from '@/lib/nft'
import { useWalletStore } from '@/store/walletStore'
import { useFlappymonStore } from '@/store/flappymonStore'

export class CharacterScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private backgroundSpeed = 0.3; // Adjust for scroll speed

  constructor() {
    super({ key: 'CharacterScene' })
  }

  async create() {
    const { width, height } = this.scale;

    this.add.text(this.scale.width / 2, this.scale.height - 40, '← Back', {
      fontSize: '20px',
      backgroundColor: '#444',
      padding: { x: 20, y: 10 },
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
    }).setOrigin(0.5).setInteractive()
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
    
    this.background = this.add.image(0, 0, 'bg_sky')
      .setOrigin(0, 0)
      .setDisplaySize(width * 2, height)
      .setScrollFactor(0)
      .setDepth(-10); // behind everything

    const address = useWalletStore.getState().address
    const setSelected = useFlappymonStore.getState().setSelected

    if (!address) {
      this.add.text(100, 100, 'Connect your wallet first.', {
        fontSize: '20px',
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
      })
      return
    }

    const flappymons = await getUserFlappymons(address)

    if (flappymons.length === 0) {
      this.add.text(100, 100, 'You dont own any Flappymon yet.', {
        fontSize: '20px',
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
      })
      return
    }

    setSelected(flappymons[0])

    this.add.text(this.scale.width / 2, 60, 'Select Your Flappymon', {
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
    }).setOrigin(0.5)

    // Display NFTs
    for (let i = 0; i < flappymons.length; i++) {
      const nft = flappymons[i]
      const x = 150 + (i % 3) * 250
      const y = 150 + Math.floor(i / 3) * 250

      // Load image dynamically
      // this.load.image(`nft-${nft.tokenId}`, nft.image)
      this.load.once('complete', () => {
        const sprite = this.add.image(x, y, `nft-${nft.tokenId}`).setScale(0.4)
        sprite.setInteractive({ useHandCursor: true })

        sprite.on('pointerdown', () => {
          setSelected(nft) // store globally
          this.scene.start('MainMenuScene')
        })

        this.add.text(x, y + 100, `${nft.name}`, {
          fontSize: '18px',
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
        }).setOrigin(0.5)
      })
      this.load.start()
    }
  }

  update() {
    // Move background left
    this.background.x -= this.backgroundSpeed;

    // Reset when half of it has moved off-screen
    if (this.background.x <= -this.background.displayWidth / 2) {
      this.background.x = 0;
    }
  }
}

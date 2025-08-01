// scenes/MarketplaceScene.ts
import Phaser from 'phaser'
import { useWalletStore } from '@/store/walletStore'
import { flapTokenAbi } from '@/lib/contracts'

const skillNames = ['Dash', 'Disappear', 'Gap Manipulation', 'Pipe Destroyer', 'Floating']

export class MarketplaceScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private backgroundSpeed = 0.3; // Adjust for scroll speed

  constructor() {
    super({ key: 'MarketplaceScene' })
  }

  async create() {
    const { width, height } = this.scale;

    this.add.text(this.scale.width / 2, this.scale.height - 40, '← Back', {
      fontSize: '20px',
      backgroundColor: '#444',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive()
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
    
    this.background = this.add.image(0, 0, 'bg_sky')
      .setOrigin(0, 0)
      .setDisplaySize(width * 2, height)
      .setScrollFactor(0)
      .setDepth(-10); // behind everything

    const address = useWalletStore.getState().address
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

    this.add.text(this.scale.width / 2, 40, 'Skill Marketplace', {
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

    const res = await fetch('/api/marketplace/get_all_listings')
    const listings = await res.json()

    let col = 0
    let row = 0
    const spacingX = 160
    const spacingY = 180

    for (const skill of listings) {
    if (!skill.listed) continue // 🚫 Skip unlisted skills

    const x = 100 + col * spacingX
    const y = 120 + row * spacingY

    const imageKey = `skill-${skill.tokenId}`
    this.load.image(imageKey, skill.image || '/placeholder.png')
    this.load.once('complete', () => {
        const sprite = this.add.image(x, y, imageKey).setScale(0.4)

        this.add.text(x, y + 70, `${skillNames[skill.skillType]} Lv${skill.skillLevel}`, {
        fontSize: '16px',
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

        this.add.text(x, y + 90, `${Number(skill.price) / 1e18} FLAP`, {
        fontSize: '14px',
        color: '#ffff00',
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

        const isUserOwned = skill.seller.toLowerCase() === address.toLowerCase()

        const btn = this.add.text(x, y + 110, isUserOwned ? 'Cancel' : 'Buy', {
        fontSize: '14px',
        backgroundColor: isUserOwned ? '#aa5500' : '#006600',
        padding: { x: 6, y: 4 },
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

        btn.on('pointerdown', () => {
        if (isUserOwned) {
            this.cancelListing(skill.tokenId)
        } else {
            this.buySkill(skill.tokenId, skill.price)
        }
        })
    })

    this.load.start()

    col++
    if (col > 4) {
        col = 0
        row++
    }
    }
  }

  private async cancelListing(tokenId: number) {
    const res = await fetch('/api/marketplace/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    })
    const data = await res.json()
    if (res.ok) {
      this.showPopup(`Listing canceled for #${tokenId}`)
      this.scene.restart()
    } else {
      this.showPopup(`Cancel failed: ${data.error}`)
    }
  }

  private async buySkill(tokenId: number, price: string) {
    const handler = (window as any).buySkill
  
    if (!handler) {
      return this.showPopup('Wallet handler not ready')
    }
  
    try {
      this.showPopup('Buying skill...')
      await handler(tokenId, price)
      this.showPopup('Purchase success!')
      this.scene.restart()
    } catch (err: any) {
      this.showPopup(`Purchase failed: ${err.message}`)
    }
  }
  

  private showPopup(msg: string) {
    const popup = this.add.text(this.scale.width / 2, this.scale.height - 100, msg, {
      fontSize: '18px',
      backgroundColor: '#222',
      color: '#00ffff',
      padding: { x: 16, y: 8 },
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
    }).setOrigin(0.5).setDepth(999)

    this.tweens.add({
      targets: popup,
      alpha: 0,
      duration: 2500,
      onComplete: () => popup.destroy(),
    })
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

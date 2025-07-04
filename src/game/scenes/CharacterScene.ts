import Phaser from 'phaser'
import { getUserFlappymons } from '@/lib/nft'
import { useWalletStore } from '@/store/walletStore'
import { useFlappymonStore } from '@/store/flappymonStore'

export class CharacterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterScene' })
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1e1e1e')

    const address = useWalletStore.getState().address
    const setSelected = useFlappymonStore.getState().setSelected

    if (!address) {
      this.add.text(100, 100, 'Connect your wallet first.', {
        fontSize: '20px',
        color: '#ffffff',
      })
      return
    }

    const flappymons = await getUserFlappymons(address)
    // console.log(flappymons)

    if (flappymons.length === 0) {
      this.add.text(100, 100, 'You dont own any Flappymon yet.', {
        fontSize: '20px',
        color: '#ffffff',
      })
      return
    }

    this.add.text(this.scale.width / 2, 60, 'Select Your Flappymon', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // Display NFTs
    for (let i = 0; i < flappymons.length; i++) {
      const nft = flappymons[i]
      const x = 150 + (i % 3) * 250
      const y = 150 + Math.floor(i / 3) * 250

      // Load image dynamically
      this.load.image(`nft-${nft.tokenId}`, nft.image)
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
        }).setOrigin(0.5)
      })
      this.load.start()
    }
  }
}

// scenes/MarketplaceScene.ts
import Phaser from 'phaser'
import { useWalletStore } from '@/store/walletStore'
import { flapTokenAbi } from '@/lib/contracts'

const skillNames = ['Dash', 'Disappear', 'Gap Manipulation', 'Pipe Destroyer', 'Floating']

export class MarketplaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MarketplaceScene' })
  }

  async create() {
    this.cameras.main.setBackgroundColor('#111')

    const address = useWalletStore.getState().address
    if (!address) {
      this.add.text(100, 100, 'Connect your wallet first.', {
        fontSize: '20px',
        color: '#ffffff',
      })
      return
    }

    this.add.text(this.scale.width / 2, 40, 'Skill Marketplace', {
      fontSize: '32px',
      color: '#ffffff',
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
        }).setOrigin(0.5)

        this.add.text(x, y + 90, `${Number(skill.price) / 1e18} FLAP`, {
        fontSize: '14px',
        color: '#ffff00',
        }).setOrigin(0.5)

        const isUserOwned = skill.seller.toLowerCase() === address.toLowerCase()

        const btn = this.add.text(x, y + 110, isUserOwned ? 'Cancel' : 'Buy', {
        fontSize: '14px',
        backgroundColor: isUserOwned ? '#aa5500' : '#006600',
        padding: { x: 6, y: 4 },
        color: '#ffffff',
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


    // Back button
    this.add.text(this.scale.width / 2, this.scale.height - 40, '← Back', {
      fontSize: '20px',
      backgroundColor: '#444',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive()
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
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
    const wallet = (window as any).__wallet
    const address = wallet?.address
    const chainId = wallet?.chainId
    const signTypedData = wallet?.signTypedDataAsync
  
    if (!address || !chainId || !signTypedData) {
      return this.showPopup('Wallet not connected')
    }
  
    const FLAP_TOKEN = process.env.NEXT_PUBLIC_FLAP_TOKEN_ADDRESS as `0x${string}`
    const MARKETPLACE = process.env.NEXT_PUBLIC_SKILL_NFT_MARKETPLACE_ADDRESS as `0x${string}`
  
    try {
      this.showPopup('Generating permit signature...')
  
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10
  
      const nonce = await wallet.readContract({
        address: FLAP_TOKEN,
        abi: flapTokenAbi.abi,
        functionName: 'nonces',
        args: [address],
      }) as bigint
  
      const value = BigInt(price) // assume `price` is already in wei format
  
      const signature = await signTypedData({
        domain: {
          name: 'FLAPTOKEN',
          version: '1',
          chainId,
          verifyingContract: FLAP_TOKEN,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: MARKETPLACE,
          value,
          nonce,
          deadline,
        },
      })
  
      // Send the purchase request to backend
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          tokenId,
          amount: 1,
          price,
          permit: {
            signature,
            deadline,
          },
        }),
      })
  
      const data = await res.json()
  
      if (res.ok) {
        this.showPopup(`Purchased skill #${tokenId} successfully!`)
        this.scene.restart()
      } else {
        this.showPopup(`Purchase failed: ${data.error}`)
      }
  
    } catch (err: any) {
      console.error('[BUY_SKILL_ERROR]', err)
      this.showPopup(`Error: ${err.message || 'Unknown error'}`)
    }
  }

  private showPopup(msg: string) {
    const popup = this.add.text(this.scale.width / 2, this.scale.height - 100, msg, {
      fontSize: '18px',
      backgroundColor: '#222',
      color: '#00ffff',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(999)

    this.tweens.add({
      targets: popup,
      alpha: 0,
      duration: 2500,
      onComplete: () => popup.destroy(),
    })
  }
}

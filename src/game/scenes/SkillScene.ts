import Phaser from 'phaser'
import { useWalletStore } from '@/store/walletStore'
import { useSkillStore, SkillNFT } from '@/store/skillStore'

const skillNames = ['Dash', 'Disappear', 'Gap Manipulation', 'Pipe Destroyer', 'Floating']

export class SkillScene extends Phaser.Scene {
  private selectedSkills: SkillNFT[] = [] // For combining
  private equippedSkill?: SkillNFT        // For current equipped

  private levelUpButton!: Phaser.GameObjects.Text
  private unlockButton!: Phaser.GameObjects.Text
  private cancelButton!: Phaser.GameObjects.Text


  constructor() {
    super({ key: 'SkillScene' })
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1e1e1e')

    const address = useWalletStore.getState().address
    const { skills, setSelected } = useSkillStore.getState()

    if (!address) {
      this.add.text(100, 100, 'Connect your wallet first.', {
        fontSize: '20px',
        color: '#ffffff',
      })
      return
    }

    this.add.text(this.scale.width / 2, 40, 'Skill Inventory', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // === Left Panel: Skill List ===
    this.add.text(100, 80, 'Your Skills', {
      fontSize: '24px',
      color: '#ffffff',
    })

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]
      const x = 120 + (i % 2) * 160
      const y = 120 + Math.floor(i / 2) * 160
    
      const imageKey = `skill-${skill.tokenId}`
      this.load.image(imageKey, skill.image || '/placeholder.png')
    
      this.load.once('complete', async () => {
        const sprite = this.add.image(x, y, imageKey).setScale(0.4)
        sprite.setInteractive({ useHandCursor: true })
    
        let clickTimer: any = null

        // === Fetch listing info ===
        let isListed = false
        try {
          const res = await fetch(`/api/marketplace/get_listing?tokenId=${skill.tokenId}`)
          const data = await res.json()
          if (data.price !== '0') isListed = true
        } catch (err) {
          console.warn(`Failed to fetch listing for tokenId ${skill.tokenId}`, err)
        }
    
        
          sprite.on('pointerdown', () => {
            if (isListed){
              this.showPopup("You have to cancel listing first!")
            } else {
              if (clickTimer) {
                clearTimeout(clickTimer)
                clickTimer = null
                this.tryAddToCombination(skill)
              } else {
                clickTimer = setTimeout(() => {
                  this.equipSkill(skill)
                  clickTimer = null
                }, 250)
              }
            }
          })
        
    
        this.add.text(x, y + 70, `${skillNames[skill.skillType]} Lv${skill.skillLevel}`, {
          fontSize: '16px',
          color: '#ffffff',
        }).setOrigin(0.5)
    
    
        if (isListed) {
          this.add.text(x, y + 90, 'Listed', {
            fontSize: '14px',
            color: '#ff4444',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 },
          }).setOrigin(0.5)

          this.add.text(x, y + 110, 'Cancel Listing', {
            fontSize: '14px',
            color: '#ffaa00',
            backgroundColor: '#333',
            padding: { x: 6, y: 4 },
          })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.cancelListing(skill))
            .setOrigin(0.5)
        } else {
          this.add.text(x, y + 90, 'Sell', {
            fontSize: '14px',
            color: '#00ff00',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 },
          })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.sellSkill(skill))
            .setOrigin(0.5)
        }
      })
    
      this.load.start()
    }
     
    // === Right Panel: Combination Station ===
    const centerX = this.scale.width * 0.65
    const stationY = 160

    this.add.rectangle(centerX, stationY, 300, 200, 0x333333).setStrokeStyle(2, 0xffffff)
    this.add.text(centerX, stationY - 80, 'Combination Station', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.comboText = this.add.text(centerX, stationY + 100, 'Drop 2 skills here to combine', {
      fontSize: '14px',
      color: '#cccccc',
    }).setOrigin(0.5)

    // === Action Buttons ===
    this.levelUpButton = this.add.text(centerX - 100, stationY + 150, 'Level Up', {
      fontSize: '20px',
      backgroundColor: '#006600',
      padding: { x: 16, y: 8 },
      color: '#ffffff',
    })
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false)

    this.unlockButton = this.add.text(centerX + 100, stationY + 150, 'Unlock Skill', {
      fontSize: '20px',
      backgroundColor: '#004488',
      padding: { x: 16, y: 8 },
      color: '#ffffff',
    })
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false)

    this.cancelButton = this.add.text(centerX, stationY + 200, 'Cancel', {
      fontSize: '18px',
      backgroundColor: '#880000',
      padding: { x: 16, y: 6 },
      color: '#ffffff',
    })
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false)

    this.levelUpButton.on('pointerdown', () => this.handleLevelUp())
    this.unlockButton.on('pointerdown', () => this.handleUnlock())
    this.cancelButton.on('pointerdown', () => this.clearSelection())


    // === Back button ===
    const backButton = this.add.text(this.scale.width / 2, this.scale.height - 40, '← Back to Main Menu', {
      fontSize: '24px',
      backgroundColor: '#444',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive()

    backButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene')
    })
  }

  private comboText!: Phaser.GameObjects.Text

  private equipSkill(skill: SkillNFT) {
    this.equippedSkill = skill
    useSkillStore.getState().setSelected(skill)
    console.log('[Equip] Skill equipped:', skill)
    this.showPopup(`Equipped: ${skillNames[skill.skillType]} Lv${skill.skillLevel}`)
  }

  private getRarity(skillType: number): 'common' | 'rare' | 'epic' {
    if ([0, 4].includes(skillType)) return 'common'
    if ([1, 2].includes(skillType)) return 'rare'
    if ([3].includes(skillType)) return 'epic'
    throw new Error(`Unknown skill type: ${skillType}`)
  }
  
  
  private clearSelection() {
    this.selectedSkills = []
    this.comboText.setText('Drop 2 skills here to combine')
    this.updateComboButtons()
  }
  

  private updateComboButtons() {
    const [a, b] = this.selectedSkills
  
    if (this.selectedSkills.length !== 2) {
      this.levelUpButton?.setVisible(false)
      this.unlockButton?.setVisible(false)
      this.cancelButton?.setVisible(this.selectedSkills.length > 0)
      return
    }
  
    const sameType = a.skillType === b.skillType
    const sameLevel = a.skillLevel === b.skillLevel
    const sameRarity = this.getRarity(a.skillType) === this.getRarity(b.skillType)
  
    this.levelUpButton?.setVisible(sameType && sameLevel)
    this.unlockButton?.setVisible(!sameType && sameRarity)
    this.cancelButton?.setVisible(true)
  }

  private async handleLevelUp() {
    const [a, b] = this.selectedSkills
    if (!a || !b) return
  
    const levelUpFn = (window as any).levelUpSkills
    if (!levelUpFn) {
      this.showPopup('LevelUp function not available')
      return
    }
  
    levelUpFn([a.tokenId, b.tokenId])
  }
  
  
  private async sellSkill(skill: SkillNFT) {
    const sell = (window as any).sellSkill
    if (!sell) return this.showPopup('Sell function not available')
  
    const res = await fetch(`/api/marketplace/get_listing?tokenId=${skill.tokenId}`)
    const data = await res.json()
    if (data.price !== '0') {
      return this.showPopup(`Skill #${skill.tokenId} is already listed.`)
    }
  
    const price = prompt(`Enter price for ${skillNames[skill.skillType]} Lv${skill.skillLevel} (in FLAP):`)
    if (!price || isNaN(+price)) return this.showPopup('Invalid price.')
  
    sell(skill.tokenId, price)
  }
  
  private async cancelListing(skill: SkillNFT) {
    const cancelListing = (window as any).cancelListing
    if (!cancelListing) {
      this.showPopup('Cancel function not available')
      return
    }
  
    try {
      const txHash = await cancelListing(skill.tokenId)
      this.showPopup(`Listing cancelled!\nTx Hash:\n${txHash}`)
      this.scene.restart()
    } catch (err: any) {
      this.showPopup(`Cancel failed: ${err.message}`)
    }
  }
  
  
  private async handleUnlock() {
    const [a, b] = this.selectedSkills
    if (!a || !b) return

    const unlockSkills = (window as any).unlockSkills
    if (!unlockSkills) {
      this.showPopup('LevelUp function not available')
      return
    }
  
    unlockSkills([a.tokenId, b.tokenId])
  }
  
  
  private tryAddToCombination(skill: SkillNFT) {
    if (this.selectedSkills.some(s => s.tokenId === skill.tokenId)) {
      this.showPopup('Skill already in combination!')
      return
    }
  
    if (this.selectedSkills.length >= 2) {
      this.showPopup('Only 2 skills can be combined')
      return
    }
  
    this.selectedSkills.push(skill)
  
    const list = this.selectedSkills.map(
      (s) => `${skillNames[s.skillType]} Lv${s.skillLevel}`
    ).join(' + ')
  
    this.comboText.setText(`Selected:\n${list}`)
  
    this.updateComboButtons()
  }
  

  private showPopup(msg: string) {
    const popup = this.add.text(this.scale.width / 2, this.scale.height - 100, msg, {
      fontSize: '20px',
      color: '#00ffff',
      backgroundColor: '#111',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(999)

    this.tweens.add({
      targets: popup,
      alpha: 0,
      duration: 2500,
      onComplete: () => popup.destroy(),
    })
  }
}

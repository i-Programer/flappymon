import Phaser from 'phaser'
import { useFlappymonStore } from '@/store/flappymonStore'
import { useWalletStore } from '@/store/walletStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useSkillStore } from '@/store/skillStore'
import { gameItemAbi } from '@/lib/contracts'
import { publicClient } from '@/lib/walletClient'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { sepolia } from 'viem/chains'

const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom((window as any).ethereum),
})

const GAME_ITEM_ADDRESS = process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS as `0x${string}`
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as `0x${string}`

const PIPE_SPEED = -200
const PIPE_INTERVAL = 1000

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private pipes!: Phaser.Physics.Arcade.Group
  private scoreText!: Phaser.GameObjects.Text
  private debugText!: Phaser.GameObjects.Text
  private gameOverUI!: Phaser.GameObjects.Container
  private gameOverBtn!: Phaser.GameObjects.Container
  private finalScoreText?: Phaser.GameObjects.Text
  private floatingTexts!: Phaser.GameObjects.Group
  private pipeCollider?: Phaser.Physics.Arcade.Collider

  private pipeGap = 450

  private score = 0
  private lastPipeTime = 0
  private isGameOver = false

  private lastGapY = 0
  private isPointRain = false
  private pointRainCount = 0
  private pointRainTimer = 0

  private isZigzag = false
  private zigzagCount = 0
  private zigzagTimer = 0

  private isDoublePoint = false
  private activeEffects: Record<number, number> = {}

  private jumpRequested = false

  private textureKey = ''

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.load.image('background', '/assets/bg.jpg')
    this.load.image('pipe', '/assets/pipe.png')
  }

  init() {
    this.resetGameState()
  }

  create() {
    const address = useWalletStore.getState().address

    // const skill = useSkillStore.getState().selected
    // const flappymon = useFlappymonStore.getState().selected
    // console.log(skill)
    // console.log(flappymon)

    this.floatingTexts = this.add.group()

    this.input.on('pointerdown', () => {
      this.jumpRequested = true
    })
    
    this.input.keyboard?.on('keydown-SPACE', () => {
      // this.jumpRequested = true
      this.activateEquippedSkill() // <--- new
    })
    
    const bg = this.add.image(0, 0, 'background').setOrigin(0)
    bg.setDisplaySize(this.scale.width, this.scale.height)

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height)

    this.createPlayer()
    this.createScoreText()
    this.createDebugText()
    this.createGameOverUI()
    this.createGameOverBtn()

    this.pipes = this.physics.add.group({ immovable: true, allowGravity: false })

    this.pipeCollider = this.physics.add.collider(this.player, this.pipes, this.handleGameOver, undefined, this)

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const code = event.code.replace('Digit', '')
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
      const tokenId = map[code]
      if (tokenId !== undefined) this.useItem(tokenId)
    })
  }

  
  private resetGameState() {
    this.score = 0
    this.lastPipeTime = 0
    this.isGameOver = false

    this.activeEffects = {}
    this.isDoublePoint = false

    this.isPointRain = false
    this.pointRainCount = 0
    this.pointRainTimer = 0

    this.isZigzag = false
    this.zigzagCount = 0
    this.zigzagTimer = 0
  }

  private createPlayer() {
    const selected = useFlappymonStore.getState().selected;
  
    // Fallback to 'common' if rarity is undefined
    const rarityKey = ['common', 'rare', 'epic', 'legendary'][selected?.rarity ?? 0];
  
    this.player = this.physics.add.sprite(
      100,
      this.scale.height / 2,
      rarityKey // Use the preloaded image key
    );
  
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(500);
  
    // Optional: scale image if needed
    this.player.setScale(0.5); // adjust as needed depending on your sprite size
  }
  

  private createScoreText() {
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
    }).setDepth(1000)
  }

  private createDebugText() {
    this.debugText = this.add.text(20, 50, '', {
      fontSize: '16px',
      color: '#ffffff',
    }).setScrollFactor(0)
  }

  private createGameOverUI() {
    const width = this.scale.width
    const height = this.scale.height

    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.3).setOrigin(0)

    const gameOverText = this.add.text(width / 2, height / 2 - 80, 'Game Over', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.gameOverUI = this.add.container(0, 0, [bg, gameOverText])
    this.gameOverUI.setVisible(false)
  }

  private createGameOverBtn() {
    const width = this.scale.width
    const height = this.scale.height

    const restartButton = this.add.text(width / 2, height / 2 + 10, 'Restart', {
      fontSize: '32px',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive()

    restartButton.on('pointerdown', () => {
      this.cleanupBeforeRestart()
      this.scene.restart()
    })

    const mainMenuButton = this.add.text(width / 2, height / 2 + 80, 'Main Menu', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive()

    mainMenuButton.on('pointerdown', () => {
      window.location.href = '/'
    })

    this.gameOverBtn = this.add.container(0, 0, [restartButton, mainMenuButton])
    this.gameOverBtn.setVisible(false)
  }

  private cleanupBeforeRestart() {
    this.finalScoreText?.destroy()
    this.finalScoreText = undefined

    this.floatingTexts.clear(true, true)
    this.pipes?.clear(true, true)

    if (this.textureKey && this.textures.exists(this.textureKey)) {
      this.textures.remove(this.textureKey)
    }
  }

  private incrementScore() {
    const multiplier = this.isDoublePoint ? 4 : 2
    this.score += multiplier
    this.scoreText.setText(`Score: ${this.score}`)
  }

  private async handleGameOver() {
    if (this.isGameOver) return
    this.isGameOver = true

    this.pipes.setVelocityX(0)
    this.pipes.getChildren().forEach(pipe => {
      (pipe as Phaser.Physics.Arcade.Sprite).setVelocityX(0)
    })

    this.player.setTint(0xff0000)
    this.player.setVelocity(0)
    this.player.setGravityY(0)

    this.gameOverUI.setVisible(true)
    this.gameOverUI.setDepth(1000)
    this.scoreText.setVisible(false)

    this.physics.pause()

    const address = useWalletStore.getState().address

    if (address) {
      const isApproved = await publicClient.readContract({
        address: GAME_ITEM_ADDRESS,
        abi: gameItemAbi.abi,
        functionName: 'isApprovedForAll',
        args: [address, BACKEND_WALLET],
      })

      if (!isApproved) {
        await walletClient.writeContract({
          address: GAME_ITEM_ADDRESS,
          abi: gameItemAbi.abi,
          functionName: 'setApprovalForAll',
          args: [BACKEND_WALLET, true],
          account: address,
        })
      }
    }

    const store = useInventoryStore.getState()
    const usedItems = Object.entries(store.usedItemsThisSession)
    .filter(([_, count]) => count > 0)
    .map(([tokenId, count]) => ({
      tokenId: Number(tokenId),
      uses: count
    }))
    console.log(usedItems)

    if (address && this.score > 0) {
      try {
        const payload = { score: this.score, address }
        const res = await fetch('/api/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(await res.text())
      } catch (err) {
        console.error('[Reward Error]', err)
      }

      if (usedItems.length > 0 && address) {
        try {
          const burnRes = await fetch('/api/item/burn_used_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, usedItems }),
          })
      
          if (!burnRes.ok) throw new Error(await burnRes.text())
        } catch (err) {
          console.error('[Burn Error]', err)
        }
      }
      
      // Reset session usage after game over
      store.resetUsedItems()
    }

    this.gameOverBtn.setVisible(true)
    this.gameOverBtn.setDepth(1001)
    
    this.finalScoreText?.destroy()
    this.finalScoreText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 30, `Final Score: ${this.score}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5)
    this.gameOverUI.add(this.finalScoreText)
  }

  private spawnPipePair() {
    const screenHeight = this.scale.height
    const pipeWidth = 70
    const minGapY = 100
    const maxGapY = screenHeight - 100 - this.pipeGap

    let newGapY: number
    if (this.isPointRain) {
      newGapY = this.lastGapY
      if (--this.pointRainCount <= 0) this.isPointRain = false
    } else if (this.isZigzag) {
      newGapY = Phaser.Math.Between(minGapY, maxGapY)
      if (--this.zigzagCount <= 0) this.isZigzag = false
    } else {
      newGapY = Phaser.Math.Clamp(this.lastGapY + Phaser.Math.Between(-100, 100), minGapY, maxGapY)
    }

    this.lastGapY = newGapY

    if (this.pipes.getChildren().length >= 20) return

    const pipeOffset = 20 // amount of overhang you want

    const topPipe = this.pipes.create(this.scale.width, newGapY + pipeOffset, 'pipe')
      .setOrigin(0, 1)
      .setFlipY(true)
      .setDisplaySize(pipeWidth, newGapY + pipeOffset)
      .setVelocityX(PIPE_SPEED)

    const bottomPipe = this.pipes.create(this.scale.width, newGapY + this.pipeGap, 'pipe')
      .setOrigin(0, 0)
      .setDisplaySize(pipeWidth, screenHeight - newGapY - this.pipeGap + pipeOffset)
      .setVelocityX(PIPE_SPEED)


    const pair = { top: topPipe, bottom: bottomPipe }
    Object.assign(topPipe, { pair })
    Object.assign(bottomPipe, { pair, isScored: false })
  }

  private showFloatingText(text: string, color: number) {
    const msg = this.add.text(this.player.x, this.player.y - 40, text, {
      fontSize: '20px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.floatingTexts.add(msg)

    this.tweens.add({
      targets: msg,
      y: msg.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => msg.destroy(),
    })
  }

  private useItem(tokenId: number) {
    if (this.isGameOver) return
  
    const store = useInventoryStore.getState()
    const item = store.items?.find(i => i.tokenId === tokenId)
    if (!item || item.uses <= 0) {
      this.showFloatingText(`No item ${tokenId} left!`, 0xff0000)
      return
    }
  
    switch (item.tokenId) {
      case 0:
        if (this.isDoublePoint) {
          this.showFloatingText('Double Point already active!', 0xff0000)
          return
        }
        this.isDoublePoint = true
        this.activeEffects[0] = 4
        this.showFloatingText('🎯 Double Point Activated!', 0xffff00)
        break
      case 1:
        this.showFloatingText('🧠 Double EXP Activated!', 0x00ffff)
        break
      case 2:
        this.isZigzag = true
        this.zigzagCount = 4
        this.showFloatingText('🌪 Gap Expander!', 0x00ff00)
        break
      case 3:
        this.player.setVelocityY(-500)
        this.showFloatingText('💪 Stamina Boost!', 0xff00ff)
        break
      default:
        this.showFloatingText('Unknown Item!', 0xffffff)
        break
    }
  
    store.consumeItem(tokenId)
  }
  
  private activateEquippedSkill() {
    const equipped = useSkillStore.getState().selected
    if (!equipped || this.isGameOver) return
  
    const skill = equipped.skillType
    const level = equipped.skillLevel
  
    switch (skill) {
      case 0: // Dash → burst forward illusion
        this.showFloatingText('💨 Dash!', 0x00ffff)

        // Temporarily increase pipe speed (i.e., make the world scroll faster)
        const dashSpeed = -400 - level * 20
        this.pipes.setVelocityX(dashSpeed)

        this.time.delayedCall(1000 + level * 100, () => {
          this.pipes.setVelocityX(PIPE_SPEED) // revert to normal
        })
        break

      case 1: // Disappear → true invincibility
        const body = this.player.body as Phaser.Physics.Arcade.Body
        body.checkCollision.none = true
        this.player.setAlpha(0.1)
        if (this.pipeCollider) this.pipeCollider.active = false
      
        this.showFloatingText('🫥 Disappear!', 0xffffff)
      
        this.time.delayedCall(3500 + level * 100, () => {
          body.checkCollision.none = false
          this.player.setAlpha(1)
          if (this.pipeCollider) this.pipeCollider.active = true
        })
        break
      
  
      case 2: // Gap Manipulation → increase gap spacing
        this.pipeGap += 50
        this.showFloatingText('🌀 Gap Enlarged!', 0xffcc00)
        this.time.delayedCall(3000 + level * 200, () => {
          this.pipeGap -= 50
        })
        break
  
      case 3: // Pipe Destroyer → destroy upcoming pipe
        const nearest = this.pipes.getChildren().find((pipe: any) => pipe.x > this.player.x)
        if (nearest) {
          this.showFloatingText('💥 Pipe Destroyed!', 0xff0000)
          this.pipes.remove(nearest, true, true)
        }
        break
  
      case 4: // Floating → reverse gravity briefly
        this.player.setGravityY(-300)
        this.showFloatingText('🎈 Floating!', 0x00ff00)
        this.time.delayedCall(1500 + level * 100, () => {
          this.player.setGravityY(500)
        })
        break
  
      default:
        this.showFloatingText('Unknown Skill', 0xffffff)
        break
    }
  }
  

  private disableItemEffect(tokenId: number) {
    if (tokenId === 0) {
      this.isDoublePoint = false
      this.showFloatingText('🎯 Double Point Ended!', 0xffcc00)
    }
    delete this.activeEffects[tokenId]
  }

  update() {
    // this.debugText.setText([
    //   `FPS: ${this.game.loop.actualFps.toFixed(1)}`,
    //   `Pipes: ${this.pipes.getChildren().length}`,
    //   `Objects: ${this.children.list.length}`,
    // ])

    const now = this.time.now
    const interval = this.isPointRain ? 800 : PIPE_INTERVAL

    if (!this.isGameOver && now - this.lastPipeTime > interval) {
      this.lastPipeTime = now
      this.spawnPipePair()
    }

    if (!this.isGameOver && this.jumpRequested) {
      this.player.setVelocityY(-250)
      this.jumpRequested = false
    }
    

    this.pipes.getChildren().forEach(pipe => {
      const sprite = pipe as Phaser.Physics.Arcade.Sprite & { pair?: any; isScored?: boolean }

      if (sprite.x + sprite.displayWidth < 0) {
        if (sprite.pair) {
          this.pipes.remove(sprite.pair.top, true, true)
          this.pipes.remove(sprite.pair.bottom, true, true)
        } else {
          this.pipes.remove(sprite, true, true)
        }
        return
      }

      if (!sprite.isScored && sprite.pair?.bottom === sprite && sprite.x + sprite.displayWidth < this.player.x) {
        sprite.isScored = true
        this.incrementScore()

        for (const [idStr, remaining] of Object.entries(this.activeEffects)) {
          const id = parseInt(idStr)
          if (--this.activeEffects[id] === 0) this.disableItemEffect(id)
        }
      }
    })

    if (!this.isPointRain && now - this.pointRainTimer > 30000) {
      this.pointRainTimer = now
      if (Phaser.Math.Between(0, 100) < 25) {
        this.isPointRain = true
        this.pointRainCount = 4
      }
    }

    if (this.player.y > this.scale.height || this.player.y < 0) {
      this.handleGameOver()
    }
  }
}

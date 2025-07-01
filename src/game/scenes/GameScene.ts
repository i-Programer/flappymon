import Phaser from 'phaser';

const PIPE_SPEED = -200;
const PIPE_DISTANCE = 150; // Gap between top and bottom pipe
const PIPE_INTERVAL = 1000; // ms between pipe spawns

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private pipes!: Phaser.Physics.Arcade.Group;
  private lastPipeTime = 0;
  private isGameOver = false;

  private gameOverUI!: Phaser.GameObjects.Container;

  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private lastGapY = 0;

  private isPointRain = false;
  private pointRainCount = 0;
  private pointRainTimer = 0;

  private isZigzag = false;
  private zigzagCount = 0;
  private zigzagTimer = 0;


  private incrementScore() {
    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private handleGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop all pipes
    this.pipes.setVelocityX(0);
    this.pipes.getChildren().forEach(pipe => {
      (pipe as Phaser.Physics.Arcade.Sprite).setVelocityX(0);
    });

    // Stop player
    this.player.setTint(0xff0000);
    this.player.setVelocity(0);
    this.player.setGravityY(0);

    // Pause pipes and world
    this.physics.pause();

    // Show game over UI
    this.gameOverUI.setVisible(true);
    this.gameOverUI.setDepth(1000); // Force it to render above everything else

    this.scoreText.setText(`Final Score: ${this.score}`);
  }

  private spawnPipePair() {
    let newGapY: number;
    const screenHeight = this.scale.height;
    const pipeWidth = 50;
    const minGapY = 100;
    const maxGapY = screenHeight - 100 - PIPE_DISTANCE;

    if (this.isPointRain) {
      newGapY = this.lastGapY;
      this.pointRainCount--;
      if (this.pointRainCount <= 0) this.isPointRain = false;
    } else if (this.isZigzag) {
      newGapY = Phaser.Math.Between(minGapY, maxGapY);
      this.zigzagCount--;
      if (this.zigzagCount <= 0) this.isZigzag = false;
    } else {
      const shift = Phaser.Math.Between(-100, 100);
      newGapY = Phaser.Math.Clamp(this.lastGapY + shift, minGapY, maxGapY);
    }

    this.lastGapY = newGapY;


    // const isFake = Phaser.Math.Between(0, 100) < 10 && !this.isPointRain && !this.isZigzag;
  
    // Create pipes (same as before)
    const topPipe = this.pipes.create(this.scale.width, newGapY, 'pipe') as Phaser.Physics.Arcade.Sprite;
    topPipe.setOrigin(0, 1);
    topPipe.setDisplaySize(pipeWidth, newGapY);
    topPipe.setVelocityX(PIPE_SPEED);
  
    const bottomHeight = screenHeight - newGapY - PIPE_DISTANCE;
    const bottomPipe = this.pipes.create(this.scale.width, newGapY + PIPE_DISTANCE, 'pipe') as Phaser.Physics.Arcade.Sprite;
    bottomPipe.setOrigin(0, 0);
    bottomPipe.setDisplaySize(pipeWidth, bottomHeight);
    bottomPipe.setVelocityX(PIPE_SPEED);

    // if (isFake) {
    //   // Fake pipes: no physics
    //   topPipe.setAlpha(0.5).setTint(0xff00ff).setBlendMode(Phaser.BlendModes.ADD);
    //   bottomPipe.setAlpha(0.5).setTint(0xff00ff).setBlendMode(Phaser.BlendModes.ADD);
    
    //   this.pipes.remove(topPipe); // Remove from physics group
    //   this.pipes.remove(bottomPipe);
    // } else {
    //   (bottomPipe as any).isScored = false;
    // }
    
  
    (bottomPipe as any).isScored = false;
  }
  

  private createGameOverUI() {
    const width = this.scale.width;
    const height = this.scale.height;
  
    // Dim background
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.3).setOrigin(0);
  
    // Game Over text
    const gameOverText = this.add.text(width / 2, height / 2 - 80, 'Game Over', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);
  
    // Restart button
    const restartButton = this.add.text(width / 2, height / 2, 'Restart', {
      fontSize: '32px',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();
  
    restartButton.on('pointerdown', () => {
      this.scene.restart();
    });
  
    // Main Menu button (hook up later)
    const mainMenuButton = this.add.text(width / 2, height / 2 + 60, 'Main Menu', {
      fontSize: '28px',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive();
  
    mainMenuButton.on('pointerdown', () => {
      // We'll create the MainMenuScene later
      this.scene.start('MainMenuScene');
    });
  
    // Group them
    this.gameOverUI = this.add.container(0, 0, [
      bg,
      gameOverText,
      restartButton,
      mainMenuButton,
    ]);
  
    this.gameOverUI.setVisible(false);
  }  
  
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // We'll just create a shape for now using graphics in create()
  }

  init() {
    this.isGameOver = false;
    this.lastPipeTime = 0;
    this.score = 0;
  }
  

  create() {
    // Enable Arcade physics
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    // Create a simple rectangle texture for the player
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffd700, 1); // Gold color
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture('player', 20, 20);
    graphics.destroy();

    // Create the player using the generated texture
    this.player = this.physics.add.sprite(100, this.scale.height / 2, 'player');

    // Player physics properties
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setGravityY(800); // Gravity (tune this)

    // Optional: basic input to test jumping
    this.input.on('pointerdown', this.flap, this);
    this.input.keyboard?.on('keydown-SPACE', this.flap, this);

    // Group to manage pipes
    this.pipes = this.physics.add.group({
      immovable: true,
      allowGravity: false,
    });

    this.physics.add.collider(this.player, this.pipes, this.handleGameOver, undefined, this);

    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
    }).setScrollFactor(0);
    this.scoreText.setDepth(1000);


    this.createGameOverUI();
  }

  flap() {
    if (this.isGameOver) return;
    this.player.setVelocityY(-300); // Upward impulse
  }

  update() {
    const now = this.time.now;
    const interval = this.isPointRain ? 300 : PIPE_INTERVAL;

    if (now - this.lastPipeTime > interval) {
      this.lastPipeTime = now;
      this.spawnPipePair();
    }


    // Remove pipes off-screen
    this.pipes.getChildren().forEach((pipe) => {
      if ((pipe as Phaser.GameObjects.Sprite).x < -50) {
        this.pipes.remove(pipe, true, true); // remove + destroy
      }

      const p = pipe as Phaser.Physics.Arcade.Sprite & { isScored?: boolean };

      // Check only bottom pipes (they have isScored)
      if (!p.isScored && p.x + p.displayWidth < this.player.x) {
        p.isScored = true;
        this.incrementScore();
      }
    });

    if (this.player.y > this.scale.height || this.player.y < 0) {
      this.handleGameOver();
    }
    
    // Trigger point rain occasionally
    if (!this.isPointRain && this.time.now - this.pointRainTimer > 30000) {
      this.pointRainTimer = this.time.now;
      if (Phaser.Math.Between(0, 100) < 25) {
        this.isPointRain = true;
        this.pointRainCount = 4;
        console.log('💰 Point rain incoming!');
      }
    }

  }
}

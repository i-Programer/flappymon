import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // We'll just create a shape for now using graphics in create()
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
  }

  flap() {
    this.player.setVelocityY(-300); // Upward impulse
  }

  update() {
    // If needed, handle off-screen logic here
  }
}

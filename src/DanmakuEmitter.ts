import { Container } from 'pixi.js';
import { Bullet } from './Bullet';

/**
 * Pattern types for the Danmaku emitter
 */
export type PatternType = 'spiral' | 'flower' | 'nway';

/**
 * Configuration for bullet patterns
 */
export interface PatternConfig {
  type: PatternType;
  bulletSpeed: number;
  bulletRadius: number;
  bulletColor: number;
  // Spiral specific
  spiralArms?: number;
  spiralRotationSpeed?: number;
  // Flower specific
  flowerPetals?: number;
  flowerAmplitude?: number;
  // N-Way specific
  nwayCount?: number;
  nwaySpread?: number;
}

/**
 * DanmakuEmitter class - Generates complex geometric bullet patterns
 * Implements Spiral, Flower, and N-Way patterns using trigonometry
 */
export class DanmakuEmitter {
  public container: Container;
  public x: number;
  public y: number;
  public bullets: Bullet[] = [];

  private config: PatternConfig;
  private angle: number = 0;
  private timer: number = 0;
  private emitInterval: number = 4; // Emit every N frames

  // Screen bounds for cleanup
  private screenWidth: number;
  private screenHeight: number;

  constructor(
    x: number,
    y: number,
    screenWidth: number,
    screenHeight: number,
    config: PatternConfig
  ) {
    this.x = x;
    this.y = y;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.config = config;
    this.container = new Container();
  }

  /**
   * Update all bullets and emit new ones based on pattern
   */
  public update(delta: number, playerX?: number, playerY?: number): void {
    this.timer += delta;

    // Emit bullets at interval
    if (this.timer >= this.emitInterval) {
      this.timer = 0;
      this.emit(playerX, playerY);
    }

    // Update existing bullets
    for (const bullet of this.bullets) {
      bullet.update(delta);
    }

    // Clean up out-of-bounds bullets
    this.cleanup();

    // Increment angle for rotating patterns
    this.angle += this.config.spiralRotationSpeed ?? 0.02;
  }

  /**
   * Emit bullets based on current pattern type
   */
  private emit(playerX?: number, playerY?: number): void {
    switch (this.config.type) {
      case 'spiral':
        this.emitSpiral();
        break;
      case 'flower':
        this.emitFlower();
        break;
      case 'nway':
        if (playerX !== undefined && playerY !== undefined) {
          this.emitNWay(playerX, playerY);
        }
        break;
    }
  }

  /**
   * Spiral pattern - Bullets spawning in a rotating spiral
   */
  private emitSpiral(): void {
    const arms = this.config.spiralArms ?? 3;
    const speed = this.config.bulletSpeed;

    for (let i = 0; i < arms; i++) {
      const armAngle = this.angle + (i * 2 * Math.PI) / arms;
      const vx = Math.cos(armAngle) * speed;
      const vy = Math.sin(armAngle) * speed;

      const bullet = new Bullet(
        this.x,
        this.y,
        vx,
        vy,
        this.config.bulletRadius,
        this.config.bulletColor
      );
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Flower pattern - Bullets creating a flower shape using parametric equations
   * Uses rose curve: r = cos(k * theta) where k is the number of petals
   */
  private emitFlower(): void {
    const petals = this.config.flowerPetals ?? 5;
    const amplitude = this.config.flowerAmplitude ?? 1;
    const baseSpeed = this.config.bulletSpeed;

    // Create multiple bullets along the rose curve
    const numBullets = 12;
    for (let i = 0; i < numBullets; i++) {
      const theta = this.angle + (i * 2 * Math.PI) / numBullets;
      // Rose curve: r = A * cos(k * theta)
      const r = amplitude * Math.cos(petals * theta);
      const speed = baseSpeed * (0.5 + Math.abs(r) * 0.5);
      
      const vx = Math.cos(theta) * speed;
      const vy = Math.sin(theta) * speed;

      const bullet = new Bullet(
        this.x,
        this.y,
        vx,
        vy,
        this.config.bulletRadius,
        this.config.bulletColor
      );
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * N-Way pattern - Spread shot targeting player's current position
   */
  private emitNWay(playerX: number, playerY: number): void {
    const count = this.config.nwayCount ?? 5;
    const spread = this.config.nwaySpread ?? Math.PI / 4; // 45 degree spread
    const speed = this.config.bulletSpeed;

    // Calculate angle to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const baseAngle = Math.atan2(dy, dx);

    // Emit bullets in a spread pattern
    const startAngle = baseAngle - spread / 2;
    const angleStep = count > 1 ? spread / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const bullet = new Bullet(
        this.x,
        this.y,
        vx,
        vy,
        this.config.bulletRadius,
        this.config.bulletColor
      );
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Remove bullets that are out of bounds
   */
  private cleanup(): void {
    const activeBullets: Bullet[] = [];

    for (const bullet of this.bullets) {
      if (bullet.isOutOfBounds(this.screenWidth, this.screenHeight)) {
        this.container.removeChild(bullet.graphics);
        bullet.destroy();
      } else {
        activeBullets.push(bullet);
      }
    }

    this.bullets = activeBullets;
  }

  /**
   * Remove a specific bullet from the emitter
   */
  public removeBullet(bullet: Bullet): void {
    const index = this.bullets.indexOf(bullet);
    if (index !== -1) {
      this.container.removeChild(bullet.graphics);
      bullet.destroy();
      this.bullets.splice(index, 1);
    }
  }

  /**
   * Set emission interval (frames between bullet spawns)
   */
  public setEmitInterval(interval: number): void {
    this.emitInterval = interval;
  }

  /**
   * Change the pattern configuration
   */
  public setConfig(config: Partial<PatternConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear all bullets
   */
  public clearBullets(): void {
    for (const bullet of this.bullets) {
      this.container.removeChild(bullet.graphics);
      bullet.destroy();
    }
    this.bullets = [];
  }

  /**
   * Get total bullet count
   */
  public getBulletCount(): number {
    return this.bullets.length;
  }

  public destroy(): void {
    this.clearBullets();
    this.container.destroy({ children: true });
  }
}

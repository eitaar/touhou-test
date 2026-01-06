import { Container } from 'pixi.js';
import { Bullet } from './Bullet';

/**
 * Pattern types for the Danmaku emitter
 */
export type PatternType =
  | 'spiral'
  | 'flower'
  | 'nway'
  | 'lissajous'
  | 'lemniscate'
  | 'logspiral'
  | 'spirograph'
  | 'cardioid'
  | 'concentric'
  | 'wavy';

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

  // Lissajous
  lissajousA?: number;
  lissajousB?: number;
  lissajousAFreq?: number;
  lissajousBFreq?: number;
  lissajousPhase?: number;

  // Lemniscate
  lemniscateScale?: number;

  // Logarithmic spiral
  logA?: number;
  logB?: number;

  // Spirograph
  spiroR?: number;
  spiror?: number;
  spiroD?: number;

  // Cardioid
  cardioidA?: number;

  // Concentric rings
  ringCount?: number;
  ringSpacing?: number;

  // Wavy spiral
  waveA?: number;
  waveK?: number;
}

/**
 * DanmakuEmitter class - Generates complex geometric bullet patterns
 * Implements Spiral, Flower, N-Way and additional mathematical patterns using trigonometry
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

    // Increment angle for rotating/time-varying patterns
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
      case 'lissajous':
        this.emitLissajous();
        break;
      case 'lemniscate':
        this.emitLemniscate();
        break;
      case 'logspiral':
        this.emitLogSpiral();
        break;
      case 'spirograph':
        this.emitSpirograph();
        break;
      case 'cardioid':
        this.emitCardioid();
        break;
      case 'concentric':
        this.emitConcentric();
        break;
      case 'wavy':
        this.emitWavy();
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
   * Lissajous curve pattern
   */
  private emitLissajous(): void {
    const A = this.config.lissajousA ?? 80;
    const B = this.config.lissajousB ?? 60;
    const a = this.config.lissajousAFreq ?? 3;
    const b = this.config.lissajousBFreq ?? 2;
    const delta = this.config.lissajousPhase ?? Math.PI / 2;
    const speed = this.config.bulletSpeed;
    const numBullets = 24;

    for (let i = 0; i < numBullets; i++) {
      const t = this.angle + (i * 2 * Math.PI) / numBullets;
      const xPos = A * Math.sin(a * t + delta);
      const yPos = B * Math.sin(b * t);

      // approximate tangent by small step
      const dt = 0.0001;
      const nextX = A * Math.sin(a * (t + dt) + delta);
      const nextY = B * Math.sin(b * (t + dt));
      const vxRaw = nextX - xPos;
      const vyRaw = nextY - yPos;
      const len = Math.hypot(vxRaw, vyRaw) || 1;
      const vx = (vxRaw / len) * speed;
      const vy = (vyRaw / len) * speed;

      const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Lemniscate (figure-eight) pattern
   */
  private emitLemniscate(): void {
    const a = this.config.lemniscateScale ?? 60;
    const speed = this.config.bulletSpeed;
    const numBullets = 18;

    for (let i = 0; i < numBullets; i++) {
      const theta = this.angle + (i * 2 * Math.PI) / numBullets;
      const cos2 = Math.cos(2 * theta);
      const r = a * Math.sqrt(Math.abs(cos2));
      const sign = cos2 >= 0 ? 1 : -1;
      const xPos = sign * r * Math.cos(theta);
      const yPos = sign * r * Math.sin(theta);

      const dir = Math.atan2(yPos, xPos);
      const vx = Math.cos(dir) * speed;
      const vy = Math.sin(dir) * speed;

      const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Logarithmic spiral pattern
   */
  private emitLogSpiral(): void {
    const a = this.config.logA ?? 0.3;
    const b = this.config.logB ?? 0.25;
    const speed = this.config.bulletSpeed;
    const numBullets = 16;

    for (let i = 0; i < numBullets; i++) {
      const theta = this.angle + i * 0.8;
      const r = a * Math.exp(b * theta);
      const xPos = r * Math.cos(theta);
      const yPos = r * Math.sin(theta);

      const dt = 0.0005;
      const r2 = a * Math.exp(b * (theta + dt));
      const x2 = r2 * Math.cos(theta + dt);
      const y2 = r2 * Math.sin(theta + dt);
      const vxRaw = x2 - xPos;
      const vyRaw = y2 - yPos;
      const len = Math.hypot(vxRaw, vyRaw) || 1;
      const vx = (vxRaw / len) * speed;
      const vy = (vyRaw / len) * speed;

      const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Spirograph (epitrochoid) pattern
   */
  private emitSpirograph(): void {
    const R = this.config.spiroR ?? 80;
    const r = this.config.spiror ?? 20;
    const d = this.config.spiroD ?? 40;
    const speed = this.config.bulletSpeed;
    const numBullets = 32;

    const k = (R + r) / r;
    for (let i = 0; i < numBullets; i++) {
      const t = this.angle + (i * 2 * Math.PI) / numBullets;
      const xPos = (R + r) * Math.cos(t) - d * Math.cos(k * t);
      const yPos = (R + r) * Math.sin(t) - d * Math.sin(k * t);

      const dt = 0.0005;
      const t2 = t + dt;
      const x2 = (R + r) * Math.cos(t2) - d * Math.cos(k * t2);
      const y2 = (R + r) * Math.sin(t2) - d * Math.sin(k * t2);
      const vxRaw = x2 - xPos;
      const vyRaw = y2 - yPos;
      const len = Math.hypot(vxRaw, vyRaw) || 1;
      const vx = (vxRaw / len) * speed;
      const vy = (vyRaw / len) * speed;

      const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Cardioid pattern
   */
  private emitCardioid(): void {
    const a = this.config.cardioidA ?? 80;
    const speed = this.config.bulletSpeed;
    const numBullets = 20;

    for (let i = 0; i < numBullets; i++) {
      const theta = this.angle + (i * 2 * Math.PI) / numBullets;
      const r = a * (1 - Math.cos(theta));
      const xPos = r * Math.cos(theta);
      const yPos = r * Math.sin(theta);

      const dir = Math.atan2(yPos, xPos);
      const vx = Math.cos(dir) * speed;
      const vy = Math.sin(dir) * speed;

      const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
      this.bullets.push(bullet);
      this.container.addChild(bullet.graphics);
    }
  }

  /**
   * Concentric rings pattern
   */
  private emitConcentric(): void {
    const rings = this.config.ringCount ?? 3;
    const spacing = this.config.ringSpacing ?? 24;
    const speed = this.config.bulletSpeed;
    const bulletsPerRing = 24;

    for (let r = 0; r < rings; r++) {
      const radius = (r + 1) * spacing + ((this.angle * 5) % spacing);
      for (let i = 0; i < bulletsPerRing; i++) {
        const theta = (i * 2 * Math.PI) / bulletsPerRing;
        const xPos = radius * Math.cos(theta);
        const yPos = radius * Math.sin(theta);
        const dir = theta;
        const vx = Math.cos(dir) * speed;
        const vy = Math.sin(dir) * speed;

        const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
        this.bullets.push(bullet);
        this.container.addChild(bullet.graphics);
      }
    }
  }

  /**
   * Wavy spiral pattern
   */
  private emitWavy(): void {
    const a = 6; // spiral growth
    const A = this.config.waveA ?? 18;
    const k = this.config.waveK ?? 6;
    const speed = this.config.bulletSpeed;
    const numBullets = 20;

    for (let i = 0; i < numBullets; i++) {
      const theta = this.angle + i * 0.5;
      const r = a * theta + A * Math.sin(k * theta);
      const xPos = r * Math.cos(theta);
      const yPos = r * Math.sin(theta);

      const dt = 0.0005;
      const theta2 = theta + dt;
      const r2 = a * theta2 + A * Math.sin(k * theta2);
      const x2 = r2 * Math.cos(theta2);
      const y2 = r2 * Math.sin(theta2);
      const vxRaw = x2 - xPos;
      const vyRaw = y2 - yPos;
      const len = Math.hypot(vxRaw, vyRaw) || 1;
      const vx = (vxRaw / len) * speed;
      const vy = (vyRaw / len) * speed;

      const bullet = new Bullet(this.x + xPos, this.y + yPos, vx, vy, this.config.bulletRadius, this.config.bulletColor);
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

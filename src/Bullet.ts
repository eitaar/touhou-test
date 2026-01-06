import { Graphics } from 'pixi.js';

/**
 * Bullet class - Individual bullet with position, velocity, and visual
 * Uses PIXI.Graphics for rendering (no external assets)
 */
export class Bullet {
  public graphics: Graphics;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public active: boolean = true;

  private color: number;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number = 4,
    color: number = 0x00FFFF
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;

    this.graphics = new Graphics();
    this.draw();
    this.graphics.position.set(this.x, this.y);
  }

  private draw(): void {
    this.graphics.clear();
    // Draw a circle bullet
    this.graphics.circle(0, 0, this.radius);
    this.graphics.fill({ color: this.color });
    // Add a glow effect with a slightly larger transparent circle
    this.graphics.circle(0, 0, this.radius + 2);
    this.graphics.stroke({ color: this.color, width: 1, alpha: 0.5 });
  }

  public update(delta: number): void {
    if (!this.active) return;

    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.graphics.position.set(this.x, this.y);
  }

  /**
   * Check if bullet is outside screen bounds
   */
  public isOutOfBounds(screenWidth: number, screenHeight: number, margin: number = 50): boolean {
    return (
      this.x < -margin ||
      this.x > screenWidth + margin ||
      this.y < -margin ||
      this.y > screenHeight + margin
    );
  }

  /**
   * Check collision with a circular hitbox
   */
  public collidesWith(targetX: number, targetY: number, targetRadius: number): boolean {
    const dx = this.x - targetX;
    const dy = this.y - targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + targetRadius;
  }

  public destroy(): void {
    this.active = false;
    this.graphics.destroy();
  }
}

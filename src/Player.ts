import { Graphics, Container } from 'pixi.js';

/**
 * Player class - A small white triangle that moves with Arrow Keys
 * Focus Mode: Hold Shift to move slowly and display a visible hitbox dot
 */
export class Player {
  public container: Container;
  public x: number;
  public y: number;
  public readonly hitboxRadius: number = 3;

  private graphics: Graphics;
  private hitboxGraphics: Graphics;
  private readonly normalSpeed: number = 6;
  private readonly focusSpeed: number = 2;
  private readonly size: number = 16;

  // Movement state
  private keys: Set<string> = new Set();
  private isFocused: boolean = false;

  // Bounds
  private readonly minX: number;
  private readonly maxX: number;
  private readonly minY: number;
  private readonly maxY: number;

  constructor(x: number, y: number, screenWidth: number, screenHeight: number) {
    this.x = x;
    this.y = y;
    this.minX = this.size;
    this.maxX = screenWidth - this.size;
    this.minY = this.size;
    this.maxY = screenHeight - this.size;

    this.container = new Container();

    // Create the player triangle
    this.graphics = new Graphics();
    this.drawPlayer();
    this.container.addChild(this.graphics);

    // Create the hitbox indicator (visible in focus mode)
    this.hitboxGraphics = new Graphics();
    this.drawHitbox();
    this.hitboxGraphics.visible = false;
    this.container.addChild(this.hitboxGraphics);

    this.container.position.set(this.x, this.y);

    // Set up keyboard input
    this.setupInput();
  }

  private drawPlayer(): void {
    this.graphics.clear();
    // Draw a white triangle pointing upward
    this.graphics.poly([
      0, -this.size,           // Top vertex
      -this.size * 0.6, this.size * 0.6,   // Bottom left
      this.size * 0.6, this.size * 0.6     // Bottom right
    ]);
    this.graphics.fill({ color: 0xFFFFFF });
    this.graphics.stroke({ color: 0x00FFFF, width: 2 });
  }

  private drawHitbox(): void {
    this.hitboxGraphics.clear();
    // Draw a small red dot at center (the actual hitbox)
    this.hitboxGraphics.circle(0, 0, this.hitboxRadius);
    this.hitboxGraphics.fill({ color: 0xFF0000 });
    // Add a glowing ring around it
    this.hitboxGraphics.circle(0, 0, this.hitboxRadius + 3);
    this.hitboxGraphics.stroke({ color: 0xFF0000, width: 1, alpha: 0.5 });
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isFocused = true;
        this.hitboxGraphics.visible = true;
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isFocused = false;
        this.hitboxGraphics.visible = false;
      }
    });
  }

  public update(_delta: number): void {
    const speed = this.isFocused ? this.focusSpeed : this.normalSpeed;

    let dx = 0;
    let dy = 0;

    if (this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('ArrowDown')) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const factor = Math.SQRT1_2; // 1/sqrt(2)
      dx *= factor;
      dy *= factor;
    }

    this.x += dx * speed;
    this.y += dy * speed;

    // Clamp to screen bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));

    this.container.position.set(this.x, this.y);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

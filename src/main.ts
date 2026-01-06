import { Application, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from './Player';
import { DanmakuEmitter, PatternType } from './DanmakuEmitter';

/**
 * Touhou-style Danmaku Game
 * Main entry point and game loop
 */

// Game constants
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Pattern configurations
const PATTERNS: { type: PatternType; color: number; label: string }[] = [
  { type: 'spiral', color: 0x00FFFF, label: 'Spiral' },
  { type: 'flower', color: 0xFF00FF, label: 'Flower' },
  { type: 'nway', color: 0x00FF00, label: 'N-Way' },
];

let currentPatternIndex = 0;

async function main(): Promise<void> {
  // Create the PixiJS application
  const app = new Application();

  await app.init({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 0x000000,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Add canvas to DOM
  const container = document.getElementById('game-container');
  if (container) {
    container.appendChild(app.canvas as HTMLCanvasElement);
  }

  // Create background grid for visual effect
  const background = createBackground(SCREEN_WIDTH, SCREEN_HEIGHT);
  app.stage.addChild(background);

  // Create player
  const player = new Player(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT * 0.8,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
  );
  app.stage.addChild(player.container);

  // Create danmaku emitter
  let emitter = createEmitter(PATTERNS[currentPatternIndex].type);
  app.stage.addChild(emitter.container);

  // Create UI elements
  const ui = createUI();
  app.stage.addChild(ui.container);
  updateUIText(ui, PATTERNS[currentPatternIndex].label, 0);

  // Pattern switching with number keys
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Digit1') switchPattern(0);
    if (e.code === 'Digit2') switchPattern(1);
    if (e.code === 'Digit3') switchPattern(2);
    if (e.code === 'Space') {
      // Clear all bullets
      emitter.clearBullets();
    }
  });

  function switchPattern(index: number): void {
    if (index < 0 || index >= PATTERNS.length) return;
    currentPatternIndex = index;
    
    // Remove old emitter
    app.stage.removeChild(emitter.container);
    emitter.destroy();
    
    // Create new emitter with selected pattern
    emitter = createEmitter(PATTERNS[index].type);
    app.stage.addChild(emitter.container);
    
    // Ensure UI stays on top
    app.stage.removeChild(ui.container);
    app.stage.addChild(ui.container);
    
    // Ensure player stays on top
    app.stage.removeChild(player.container);
    app.stage.addChild(player.container);
  }

  function createEmitter(type: PatternType): DanmakuEmitter {
    const pattern = PATTERNS.find(p => p.type === type) ?? PATTERNS[0];
    
    return new DanmakuEmitter(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT * 0.15,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      {
        type: pattern.type,
        bulletSpeed: 3,
        bulletRadius: 4,
        bulletColor: pattern.color,
        spiralArms: 3,
        spiralRotationSpeed: 0.05,
        flowerPetals: 5,
        flowerAmplitude: 1,
        nwayCount: 7,
        nwaySpread: Math.PI / 3,
      }
    );
  }

  // Main game loop
  app.ticker.add((ticker) => {
    const delta = ticker.deltaTime;

    // Update player
    player.update(delta);

    // Update emitter (pass player position for aimed patterns)
    emitter.update(delta, player.x, player.y);

    // Check collisions
    for (const bullet of emitter.bullets) {
      if (bullet.collidesWith(player.x, player.y, player.hitboxRadius)) {
        // Flash effect on hit (simple visual feedback)
        player.container.alpha = 0.5;
        setTimeout(() => {
          player.container.alpha = 1;
        }, 100);
        
        // Remove the bullet that hit
        bullet.destroy();
      }
    }

    // Update UI
    updateUIText(ui, PATTERNS[currentPatternIndex].label, emitter.getBulletCount());
  });
}

/**
 * Create a subtle background grid
 */
function createBackground(width: number, height: number): Graphics {
  const bg = new Graphics();
  
  // Draw grid lines
  const gridSize = 50;
  const gridColor = 0x111111;
  
  for (let x = 0; x <= width; x += gridSize) {
    bg.moveTo(x, 0);
    bg.lineTo(x, height);
  }
  
  for (let y = 0; y <= height; y += gridSize) {
    bg.moveTo(0, y);
    bg.lineTo(width, y);
  }
  
  bg.stroke({ color: gridColor, width: 1 });
  
  return bg;
}

/**
 * Create UI elements
 */
function createUI(): { container: Graphics; patternText: Text; bulletText: Text; controlsText: Text } {
  const container = new Graphics();
  
  const style = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 14,
    fill: 0xFFFFFF,
  });
  
  const patternText = new Text({ text: '', style });
  patternText.position.set(10, 10);
  container.addChild(patternText);
  
  const bulletText = new Text({ text: '', style });
  bulletText.position.set(10, 30);
  container.addChild(bulletText);
  
  const controlsStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 12,
    fill: 0x888888,
  });
  
  const controlsText = new Text({
    text: 'Controls: Arrow Keys = Move | Shift = Focus | 1/2/3 = Switch Pattern | Space = Clear',
    style: controlsStyle
  });
  controlsText.position.set(10, SCREEN_HEIGHT - 25);
  container.addChild(controlsText);
  
  return { container, patternText, bulletText, controlsText };
}

/**
 * Update UI text displays
 */
function updateUIText(
  ui: { patternText: Text; bulletText: Text },
  patternName: string,
  bulletCount: number
): void {
  ui.patternText.text = `Pattern: ${patternName}`;
  ui.bulletText.text = `Bullets: ${bulletCount}`;
}

// Start the game
main().catch(console.error);

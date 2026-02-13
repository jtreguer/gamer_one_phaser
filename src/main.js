import Phaser from 'phaser';
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  backgroundColor: CONFIG.COLORS.SPACE_BG,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, UpgradeScene, GameOverScene],
  render: {
    pixelArt: false,
    antialias: true,
  },
  input: {
    activePointers: 1,
  },
};

window.game = new Phaser.Game(config);

// Dynamic resolution scaling: increase canvas pixel count when the display
// is larger than the base 800×600 (e.g. itch.io fullscreen, large monitors).
// Game coordinates stay 800×600 — only the rendering density changes.
let resizeTimer;
function updateCanvasResolution() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const zoom = Math.min(w / CONFIG.GAME_WIDTH, h / CONFIG.GAME_HEIGHT);
  const clamped = Math.max(1, Math.min(Math.round(zoom * 100) / 100, 3));
  window.game.scale.setZoom(clamped);
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateCanvasResolution, 150);
});

window.game.events.once('ready', updateCanvasResolution);

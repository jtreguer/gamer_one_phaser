import { CONFIG } from '../config.js';
import { randomBetween } from '../utils/math.js';

export default class Background {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(-10);
    this.stars = [];
    this._createStars();
  }

  _createStars() {
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.GAME_WIDTH,
        y: Math.random() * CONFIG.GAME_HEIGHT,
        size: Math.random() < 0.1 ? 1.5 : 0.8,
        baseAlpha: randomBetween(CONFIG.STAR_TWINKLE_MIN, CONFIG.STAR_TWINKLE_MAX),
        twinkleSpeed: randomBetween(0.5, 2.0),
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  update(time) {
    const g = this.graphics;
    g.clear();

    for (const star of this.stars) {
      const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.baseAlpha + twinkle * 0.2;
      g.fillStyle(0xffffff, Math.max(0.1, Math.min(1, alpha)));
      g.fillCircle(star.x, star.y, star.size);
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}

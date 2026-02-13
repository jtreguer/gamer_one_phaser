import { CONFIG } from '../config.js';

export default class Crosshair {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);
    this.x = CONFIG.GAME_WIDTH / 2;
    this.y = CONFIG.GAME_HEIGHT / 2;
    this.rejectFlash = 0;
  }

  update(delta) {
    const pointer = this.scene.input.activePointer;
    this.x = pointer.worldX;
    this.y = pointer.worldY;

    if (this.rejectFlash > 0) {
      this.rejectFlash -= delta;
    }

    this._draw();
  }

  flash() {
    this.rejectFlash = 200; // ms
  }

  _draw() {
    const g = this.graphics;
    g.clear();

    const isReject = this.rejectFlash > 0;
    const color = isReject ? CONFIG.TINT.CROSSHAIR_REJECT : CONFIG.TINT.CROSSHAIR;
    const alpha = isReject ? 0.9 : 0.8;
    const size = CONFIG.CROSSHAIR_SIZE;
    const gap = CONFIG.CROSSHAIR_GAP;

    g.lineStyle(1.5, color, alpha);

    // Horizontal lines
    g.beginPath();
    g.moveTo(this.x - size, this.y);
    g.lineTo(this.x - gap, this.y);
    g.moveTo(this.x + gap, this.y);
    g.lineTo(this.x + size, this.y);
    // Vertical lines
    g.moveTo(this.x, this.y - size);
    g.lineTo(this.x, this.y - gap);
    g.moveTo(this.x, this.y + gap);
    g.lineTo(this.x, this.y + size);
    g.strokePath();

    // Center dot
    g.fillStyle(color, alpha);
    g.fillCircle(this.x, this.y, 1.5);

    // Reject X
    if (isReject) {
      g.lineStyle(2, CONFIG.TINT.CROSSHAIR_REJECT, 0.8);
      const xs = 5;
      g.beginPath();
      g.moveTo(this.x - xs, this.y - xs);
      g.lineTo(this.x + xs, this.y + xs);
      g.moveTo(this.x + xs, this.y - xs);
      g.lineTo(this.x - xs, this.y + xs);
      g.strokePath();
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}

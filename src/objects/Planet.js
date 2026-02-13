import { CONFIG } from '../config.js';

export default class Planet {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = CONFIG.PLANET_RADIUS;
    this.currentRotation = 0;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0);
  }

  update(delta) {
    this.currentRotation += CONFIG.ROTATION_SPEED * (delta / 1000);
    if (this.currentRotation > Math.PI * 2) {
      this.currentRotation -= Math.PI * 2;
    }
    this._draw();
  }

  _draw() {
    const g = this.graphics;
    g.clear();

    // Atmosphere glow (outer ring)
    g.lineStyle(2, CONFIG.TINT.PLANET_ATMOSPHERE, 0.15);
    g.strokeCircle(this.x, this.y, this.radius + 12);
    g.lineStyle(1.5, CONFIG.TINT.PLANET_ATMOSPHERE, 0.25);
    g.strokeCircle(this.x, this.y, this.radius + 6);
    g.lineStyle(1, CONFIG.TINT.PLANET_ATMOSPHERE, 0.4);
    g.strokeCircle(this.x, this.y, this.radius + 2);

    // Planet body — filled disk
    g.fillStyle(CONFIG.TINT.PLANET_BODY, 1);
    g.fillCircle(this.x, this.y, this.radius);

    // Surface detail — rotating grid lines to convey rotation
    g.lineStyle(0.5, CONFIG.TINT.PLANET_BODY_LIGHT, 0.3);
    const lineCount = 6;
    for (let i = 0; i < lineCount; i++) {
      const angle = this.currentRotation + (i / lineCount) * Math.PI * 2;
      // Longitude lines (curved appearance via offset circles)
      const offsetX = Math.cos(angle) * this.radius * 0.5;
      const scaleX = Math.abs(Math.sin(angle)) * 0.8 + 0.2;
      // Draw as vertical ellipse segments
      g.beginPath();
      for (let t = -Math.PI / 2; t <= Math.PI / 2; t += 0.15) {
        const px = this.x + Math.cos(angle) * Math.cos(t) * this.radius * 0.9;
        const py = this.y + Math.sin(t) * this.radius * 0.9;
        if (t === -Math.PI / 2) {
          g.moveTo(px, py);
        } else {
          g.lineTo(px, py);
        }
      }
      g.strokePath();
    }

    // Latitude lines
    for (let i = 1; i < 4; i++) {
      const latRadius = this.radius * (i / 4);
      g.lineStyle(0.5, CONFIG.TINT.PLANET_BODY_LIGHT, 0.2);
      g.strokeCircle(this.x, this.y, latRadius);
    }

    // Edge highlight
    g.lineStyle(1, CONFIG.TINT.PLANET_ATMOSPHERE, 0.15);
    g.strokeCircle(this.x, this.y, this.radius);
  }

  isPointInside(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return (dx * dx + dy * dy) < (this.radius * this.radius);
  }

  destroy() {
    this.graphics.destroy();
  }
}

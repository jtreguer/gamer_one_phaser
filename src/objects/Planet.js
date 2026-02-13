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

    // Planet body — volumetric shading with offset circles
    // Light source: upper-left
    const lx = -0.3;
    const ly = -0.4;
    const r = this.radius;

    // Shadow base (darkest tone)
    g.fillStyle(0x0d2830, 1);
    g.fillCircle(this.x, this.y, r);

    // Mid tone — shifted towards light
    g.fillStyle(CONFIG.TINT.PLANET_BODY, 0.7);
    g.fillCircle(this.x + lx * r * 0.15, this.y + ly * r * 0.15, r * 0.92);

    // Lighter band
    g.fillStyle(CONFIG.TINT.PLANET_BODY_LIGHT, 0.5);
    g.fillCircle(this.x + lx * r * 0.3, this.y + ly * r * 0.3, r * 0.75);

    // Bright area
    g.fillStyle(0x3a8a9a, 0.35);
    g.fillCircle(this.x + lx * r * 0.45, this.y + ly * r * 0.45, r * 0.55);

    // Specular highlight
    g.fillStyle(0x5acada, 0.2);
    g.fillCircle(this.x + lx * r * 0.55, this.y + ly * r * 0.55, r * 0.3);

    // Surface detail — rotating longitude lines
    g.lineStyle(0.5, CONFIG.TINT.PLANET_BODY_LIGHT, 0.2);
    const lineCount = 6;
    for (let i = 0; i < lineCount; i++) {
      const angle = this.currentRotation + (i / lineCount) * Math.PI * 2;
      g.beginPath();
      for (let t = -Math.PI / 2; t <= Math.PI / 2; t += 0.15) {
        const px = this.x + Math.cos(angle) * Math.cos(t) * r * 0.9;
        const py = this.y + Math.sin(t) * r * 0.9;
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
      const latRadius = r * (i / 4);
      g.lineStyle(0.5, CONFIG.TINT.PLANET_BODY_LIGHT, 0.12);
      g.strokeCircle(this.x, this.y, latRadius);
    }

    // Limb darkening — dark ring at the edge
    g.lineStyle(3, 0x0d2830, 0.25);
    g.strokeCircle(this.x, this.y, r - 1);

    // Atmosphere edge highlight (bright rim on lit side)
    g.lineStyle(1.5, CONFIG.TINT.PLANET_ATMOSPHERE, 0.2);
    g.beginPath();
    g.arc(this.x, this.y, r, Math.PI * 0.9, Math.PI * 1.7, false);
    g.strokePath();
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

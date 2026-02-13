import { CONFIG } from '../config.js';
import { EVENTS } from '../utils/constants.js';
import { distance } from '../utils/math.js';

export default class Interceptor {
  constructor(scene, startX, startY, targetX, targetY, speed) {
    this.scene = scene;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
    this.alive = true;
    this.detonated = false;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.dirX = dx / dist;
    this.dirY = dy / dist;
    this.totalDist = dist;
    this.traveled = 0;

    // Trail
    this.trailPoints = [{ x: startX, y: startY }];
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5);
  }

  update(delta) {
    if (!this.alive) return;

    const dt = delta / 1000;
    const move = this.speed * dt;
    this.x += this.dirX * move;
    this.y += this.dirY * move;
    this.traveled += move;

    // Add trail point
    this.trailPoints.push({ x: this.x, y: this.y });
    if (this.trailPoints.length > CONFIG.TRAIL_MAX_POINTS) {
      this.trailPoints.shift();
    }

    // Check if reached target
    if (this.traveled >= this.totalDist) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.detonate();
      return;
    }

    this._draw();
  }

  detonate() {
    this.alive = false;
    this.detonated = true;
    this.scene.events.emit(EVENTS.INTERCEPTOR_DETONATED, this.x, this.y);
    this._startTrailFade();
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    this._drawTrail(g, 1);

    // Head point
    g.fillStyle(0xffffff, 1);
    g.fillCircle(this.x, this.y, 2);
  }

  _drawTrail(g, alpha) {
    const points = this.trailPoints;
    if (points.length < 2) return;

    for (let i = 1; i < points.length; i++) {
      const t = i / points.length;
      const segAlpha = t * 0.8 * alpha;
      const width = CONFIG.TRAIL_WIDTH * t;
      g.lineStyle(width, CONFIG.TINT.INTERCEPTOR, segAlpha);
      g.beginPath();
      g.moveTo(points[i - 1].x, points[i - 1].y);
      g.lineTo(points[i].x, points[i].y);
      g.strokePath();
    }
  }

  _startTrailFade() {
    const fadeTime = CONFIG.TRAIL_LIFETIME * 1000;
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0,
      duration: fadeTime,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

import { CONFIG } from '../config.js';
import { distance } from '../utils/math.js';

export default class EnemyMissile {
  constructor(scene, startX, startY, targetX, targetY, speed, isMirv = false) {
    this.scene = scene;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
    this.alive = true;
    this.impacted = false;
    this.destroyed = false;
    this.isMirv = isMirv;
    this.isWarhead = false; // set true for MIRV warheads

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
    this.graphics.setDepth(3);

    // MIRV pulse
    this.mirvPulseTimer = 0;
  }

  update(delta, planetX, planetY) {
    if (!this.alive) return;

    const dt = delta / 1000;
    const move = this.speed * dt;
    this.x += this.dirX * move;
    this.y += this.dirY * move;
    this.traveled += move;

    // Trail
    this.trailPoints.push({ x: this.x, y: this.y });
    if (this.trailPoints.length > CONFIG.TRAIL_MAX_POINTS) {
      this.trailPoints.shift();
    }

    // MIRV pulse
    if (this.isMirv) {
      this.mirvPulseTimer += dt;
    }

    // Check if reached target
    if (this.traveled >= this.totalDist) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.impact();
      return;
    }

    this._draw();
    return this._getDistanceToPlanet(planetX, planetY);
  }

  _getDistanceToPlanet(planetX, planetY) {
    return distance(this.x, this.y, planetX, planetY);
  }

  impact() {
    this.alive = false;
    this.impacted = true;
    this._startTrailFade();
  }

  kill() {
    this.alive = false;
    this.destroyed = true;
    this._startTrailFade();
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    this._drawTrail(g, 1);

    // Head point
    if (this.isMirv) {
      // Pulsing MIRV head
      const pulse = Math.sin(this.mirvPulseTimer * 6) * 0.3 + 0.7;
      const headSize = 3 + pulse;
      g.fillStyle(CONFIG.TINT.MIRV, 1);
      g.fillCircle(this.x, this.y, headSize);
      g.fillStyle(CONFIG.TINT.MIRV, 0.3);
      g.fillCircle(this.x, this.y, headSize + 3);
    } else if (this.isWarhead) {
      g.fillStyle(CONFIG.TINT.MIRV_WARHEAD, 1);
      g.fillCircle(this.x, this.y, 2);
    } else {
      g.fillStyle(CONFIG.TINT.ENEMY, 1);
      g.fillCircle(this.x, this.y, 2.5);
    }
  }

  _drawTrail(g, alpha) {
    const points = this.trailPoints;
    if (points.length < 2) return;

    const baseColor = this.isMirv ? CONFIG.TINT.MIRV :
                      this.isWarhead ? CONFIG.TINT.MIRV_WARHEAD :
                      CONFIG.TINT.ENEMY;

    for (let i = 1; i < points.length; i++) {
      const t = i / points.length;
      const segAlpha = t * 0.7 * alpha;
      const width = CONFIG.ENEMY_TRAIL_WIDTH * t;
      g.lineStyle(width, baseColor, segAlpha);
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

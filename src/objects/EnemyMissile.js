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
    this.isSine = false;   // set true for sinusoidal missiles

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
    this._showDestroyEffect();
    this._startQuickFade();
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    this._drawTrail(g, 1);

    const angle = Math.atan2(this.dirY, this.dirX);

    if (this.isMirv) {
      // Pulsing MIRV rocket — larger, with glow
      const pulse = Math.sin(this.mirvPulseTimer * 6) * 0.3 + 0.7;
      const len = 7 + pulse;
      this._drawRocket(g, this.x, this.y, angle, len, 4, CONFIG.TINT.MIRV);
      // Glow
      g.fillStyle(CONFIG.TINT.MIRV, 0.2);
      g.fillCircle(this.x, this.y, len + 2);
    } else if (this.isWarhead) {
      this._drawRocket(g, this.x, this.y, angle, 5, 2.5, CONFIG.TINT.MIRV_WARHEAD);
    } else {
      this._drawRocket(g, this.x, this.y, angle, 6, 3, CONFIG.TINT.ENEMY);
    }
  }

  _drawRocket(g, x, y, angle, length, width, color) {
    // Nose tip
    const tipX = x + Math.cos(angle) * length;
    const tipY = y + Math.sin(angle) * length;

    // Body shoulders (perpendicular to travel direction)
    const perpX = Math.cos(angle + Math.PI / 2);
    const perpY = Math.sin(angle + Math.PI / 2);
    const shoulderX = x + Math.cos(angle) * length * 0.2;
    const shoulderY = y + Math.sin(angle) * length * 0.2;
    const lsX = shoulderX + perpX * width * 0.6;
    const lsY = shoulderY + perpY * width * 0.6;
    const rsX = shoulderX - perpX * width * 0.6;
    const rsY = shoulderY - perpY * width * 0.6;

    // Tail center
    const tailX = x - Math.cos(angle) * length * 0.4;
    const tailY = y - Math.sin(angle) * length * 0.4;

    // Fins (wider than body, at the tail)
    const finX = x - Math.cos(angle) * length * 0.3;
    const finY = y - Math.sin(angle) * length * 0.3;
    const lfX = finX + perpX * width;
    const lfY = finY + perpY * width;
    const rfX = finX - perpX * width;
    const rfY = finY - perpY * width;

    // Draw body: nose → left shoulder → left fin → tail → right fin → right shoulder → nose
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(tipX, tipY);
    g.lineTo(lsX, lsY);
    g.lineTo(lfX, lfY);
    g.lineTo(tailX, tailY);
    g.lineTo(rfX, rfY);
    g.lineTo(rsX, rsY);
    g.closePath();
    g.fillPath();

    // Bright nose highlight
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(tipX, tipY, 1);
  }

  _drawTrail(g, alpha) {
    const points = this.trailPoints;
    if (points.length < 2) return;

    const baseColor = this.isMirv ? CONFIG.TINT.MIRV :
                      this.isWarhead ? CONFIG.TINT.MIRV_WARHEAD :
                      this.isSine ? CONFIG.TINT.SINE :
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

  _showDestroyEffect() {
    const color = this.isMirv ? CONFIG.TINT.MIRV :
                  this.isWarhead ? CONFIG.TINT.MIRV_WARHEAD :
                  this.isSine ? CONFIG.TINT.SINE :
                  CONFIG.TINT.ENEMY;
    const explosionGfx = this.scene.add.graphics().setDepth(7);
    explosionGfx.fillStyle(0xffffff, 0.9);
    explosionGfx.fillCircle(this.x, this.y, 4);
    explosionGfx.fillStyle(color, 0.7);
    explosionGfx.fillCircle(this.x, this.y, 8);

    this.scene.tweens.add({
      targets: explosionGfx,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 250,
      ease: 'Power2',
      onComplete: () => explosionGfx.destroy(),
    });
  }

  _startQuickFade() {
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.destroy();
      },
    });
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

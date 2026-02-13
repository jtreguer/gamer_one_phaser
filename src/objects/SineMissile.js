import { CONFIG } from '../config.js';
import EnemyMissile from './EnemyMissile.js';

export default class SineMissile extends EnemyMissile {
  constructor(scene, startX, startY, targetX, targetY, speed) {
    super(scene, startX, startY, targetX, targetY, speed, false);
    this.isSine = true;
    this.sineAmplitude = CONFIG.SINE_AMPLITUDE;
    this.sineFrequency = CONFIG.SINE_FREQUENCY;

    // Perpendicular direction for oscillation
    this.perpX = -this.dirY;
    this.perpY = this.dirX;

    // Base position tracks the straight-line path
    this.baseX = startX;
    this.baseY = startY;
  }

  update(delta, planetX, planetY) {
    if (!this.alive) return;

    const dt = delta / 1000;
    const move = this.speed * dt;

    // Advance base position along straight line
    this.baseX += this.dirX * move;
    this.baseY += this.dirY * move;
    this.traveled += move;

    // Sinusoidal offset perpendicular to flight direction
    const progress = this.traveled / this.totalDist;
    const sineT = progress * this.sineFrequency * Math.PI * 2;
    const offset = this.sineAmplitude * Math.sin(sineT);
    this.x = this.baseX + this.perpX * offset;
    this.y = this.baseY + this.perpY * offset;

    // Trail
    this.trailPoints.push({ x: this.x, y: this.y });
    if (this.trailPoints.length > CONFIG.TRAIL_MAX_POINTS) {
      this.trailPoints.shift();
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

  _draw() {
    const g = this.graphics;
    g.clear();
    this._drawTrail(g, 1);

    // Tangent direction (derivative of sine path) for rocket orientation
    const progress = this.traveled / this.totalDist;
    const sineT = progress * this.sineFrequency * Math.PI * 2;
    const dOffset = this.sineAmplitude * Math.cos(sineT) * this.sineFrequency * Math.PI * 2 / this.totalDist;

    const tangentX = this.dirX + this.perpX * dOffset;
    const tangentY = this.dirY + this.perpY * dOffset;
    const angle = Math.atan2(tangentY, tangentX);

    // Slightly larger rocket in purple
    this._drawRocket(g, this.x, this.y, angle, 8, 4, CONFIG.TINT.SINE);

    // Subtle glow
    g.fillStyle(CONFIG.TINT.SINE, 0.15);
    g.fillCircle(this.x, this.y, 6);
  }
}

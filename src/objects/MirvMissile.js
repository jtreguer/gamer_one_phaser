import { CONFIG } from '../config.js';
import { randomBetween, randomInt } from '../utils/math.js';
import EnemyMissile from './EnemyMissile.js';

export default class MirvMissile extends EnemyMissile {
  constructor(scene, startX, startY, targetX, targetY, speed, waveData) {
    super(scene, startX, startY, targetX, targetY, speed, true);
    this.splitDistance = randomBetween(CONFIG.MIRV_SPLIT_DIST_MIN, CONFIG.MIRV_SPLIT_DIST_MAX);
    this.warheadCount = randomInt(waveData.mirvMinWarheads, waveData.mirvMaxWarheads);
    this.hasSplit = false;
  }

  checkSplit(planetX, planetY) {
    if (this.hasSplit || !this.alive) return null;

    const dx = this.x - planetX;
    const dy = this.y - planetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= this.splitDistance) {
      this.hasSplit = true;
      return this._split(planetX, planetY);
    }
    return null;
  }

  _split(planetX, planetY) {
    const warheads = [];
    const planetRadius = CONFIG.PLANET_RADIUS;

    // Generate spread-out target angles on the circumference
    const baseAngle = Math.atan2(this.targetY - planetY, this.targetX - planetX);
    const targets = [];

    for (let i = 0; i < this.warheadCount; i++) {
      let angle;
      if (i === 0) {
        angle = baseAngle;
      } else {
        // Spread at least MIRV_WARHEAD_SPREAD apart
        let tries = 0;
        do {
          angle = baseAngle + (Math.random() - 0.5) * Math.PI * 1.5;
          tries++;
        } while (tries < 20 && targets.some(a => Math.abs(((angle - a + Math.PI) % (Math.PI * 2)) - Math.PI) < CONFIG.MIRV_WARHEAD_SPREAD));
      }
      targets.push(angle);
    }

    // Create warhead missiles
    for (const angle of targets) {
      const tx = planetX + Math.cos(angle) * planetRadius;
      const ty = planetY + Math.sin(angle) * planetRadius;

      const warhead = new EnemyMissile(
        this.scene,
        this.x, this.y,
        tx, ty,
        this.speed * 0.9,
        false
      );
      warhead.isWarhead = true;
      warheads.push(warhead);
    }

    // Kill the carrier
    this.kill();

    return warheads;
  }
}

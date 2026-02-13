import { CONFIG } from '../config.js';
import { SILO_STATE, EVENTS } from '../utils/constants.js';
import { angleDiff } from '../utils/math.js';
import Silo from './Silo.js';

export default class SiloManager {
  constructor(scene) {
    this.scene = scene;
    this.silos = [];
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);
  }

  init(count) {
    this.silos = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.silos.push(new Silo(i, angle));
    }
  }

  update(delta, planetX, planetY, planetRadius, rotation) {
    for (const silo of this.silos) {
      silo.updatePosition(planetX, planetY, planetRadius, rotation);
      const justReloaded = silo.update(delta);
      if (justReloaded) {
        this.scene.events.emit(EVENTS.SILO_RELOADED, silo);
      }
    }
    this._draw(planetX, planetY);
  }

  getNearestAvailable(targetX, targetY) {
    let bestSilo = null;
    let bestDist = Infinity;

    for (const silo of this.silos) {
      if (silo.state !== SILO_STATE.READY) continue;
      const dx = silo.x - targetX;
      const dy = silo.y - targetY;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestSilo = silo;
      }
    }

    return bestSilo;
  }

  checkSiloHit(impactX, impactY, planetX, planetY, planetRadius) {
    const impactAngle = Math.atan2(impactY - planetY, impactX - planetX);

    for (const silo of this.silos) {
      if (silo.state === SILO_STATE.DESTROYED) continue;

      const siloAngle = Math.atan2(silo.y - planetY, silo.x - planetX);
      const arcDistance = angleDiff(impactAngle, siloAngle) * planetRadius;

      if (arcDistance < CONFIG.SILO_HIT_TOLERANCE) {
        silo.destroy();
        this.scene.events.emit(EVENTS.SILO_DESTROYED, silo);

        if (this.getActiveCount() === 0) {
          this.scene.events.emit(EVENTS.ALL_SILOS_DESTROYED);
        }
        return true;
      }
    }
    return false;
  }

  getActiveCount() {
    let count = 0;
    for (const silo of this.silos) {
      if (silo.state !== SILO_STATE.DESTROYED) count++;
    }
    return count;
  }

  getFirstDestroyed() {
    return this.silos.find(s => s.state === SILO_STATE.DESTROYED) || null;
  }

  _draw(planetX, planetY) {
    const g = this.graphics;
    g.clear();
    const size = CONFIG.SILO_SIZE;

    for (const silo of this.silos) {
      const { x, y, angle, state } = silo;

      if (state === SILO_STATE.DESTROYED) {
        // Crater
        g.fillStyle(CONFIG.TINT.SILO_DESTROYED, 0.6);
        g.fillCircle(x, y, size * 0.6);
        continue;
      }

      // Triangle pointing outward
      const color = state === SILO_STATE.READY ? CONFIG.TINT.SILO_READY : CONFIG.TINT.SILO_RELOADING;
      const outAngle = angle;

      const tipX = x + Math.cos(outAngle) * size;
      const tipY = y + Math.sin(outAngle) * size;
      const leftX = x + Math.cos(outAngle + 2.4) * size * 0.6;
      const leftY = y + Math.sin(outAngle + 2.4) * size * 0.6;
      const rightX = x + Math.cos(outAngle - 2.4) * size * 0.6;
      const rightY = y + Math.sin(outAngle - 2.4) * size * 0.6;

      g.fillStyle(color, 1);
      g.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);

      // Reload indicator arc
      if (state === SILO_STATE.RELOADING) {
        const progress = silo.getReloadProgress();
        if (progress > 0 && progress < 1) {
          g.lineStyle(2, CONFIG.TINT.SILO_READY, 0.5);
          g.beginPath();
          g.arc(x, y, size + 3, outAngle - Math.PI * progress, outAngle + Math.PI * progress, false);
          g.strokePath();
        }
      }

      // Ready glow
      if (state === SILO_STATE.READY) {
        g.fillStyle(CONFIG.TINT.SILO_READY, 0.15);
        g.fillCircle(x, y, size + 2);
      }
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}

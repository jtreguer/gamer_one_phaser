import { CONFIG } from '../config.js';
import { SILO_STATE } from '../utils/constants.js';

export default class Silo {
  constructor(index, baseAngle) {
    this.index = index;
    this.baseAngle = baseAngle;
    this.state = SILO_STATE.READY;
    this.x = 0;
    this.y = 0;
    this.angle = 0;             // current angle including rotation
    this.reloadTimer = 0;
    this.reloadDuration = CONFIG.SILO_RELOAD_TIME;
  }

  fire(reloadTime) {
    if (this.state !== SILO_STATE.READY) return false;
    this.state = SILO_STATE.RELOADING;
    this.reloadDuration = reloadTime;
    this.reloadTimer = reloadTime;
    return true;
  }

  destroy() {
    this.state = SILO_STATE.DESTROYED;
    this.reloadTimer = 0;
  }

  repair(reloadTime) {
    this.state = SILO_STATE.READY;
    this.reloadTimer = 0;
    this.reloadDuration = reloadTime;
  }

  update(delta) {
    if (this.state === SILO_STATE.RELOADING) {
      this.reloadTimer -= delta / 1000;
      if (this.reloadTimer <= 0) {
        this.reloadTimer = 0;
        this.state = SILO_STATE.READY;
        return true; // just reloaded
      }
    }
    return false;
  }

  getReloadProgress() {
    if (this.state !== SILO_STATE.RELOADING) return 1;
    if (this.reloadDuration <= 0) return 1;
    return 1 - (this.reloadTimer / this.reloadDuration);
  }

  updatePosition(planetX, planetY, planetRadius, rotation) {
    this.angle = this.baseAngle + rotation;
    this.x = planetX + Math.cos(this.angle) * planetRadius;
    this.y = planetY + Math.sin(this.angle) * planetRadius;
  }
}

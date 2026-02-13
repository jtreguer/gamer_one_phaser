import { CONFIG } from '../config.js';
import { SILO_STATE, EVENTS } from '../utils/constants.js';
import { randomBetween } from '../utils/math.js';
import { generateSpawnPoint, generateTargetPoint } from './SpawnValidator.js';
import EnemyMissile from '../objects/EnemyMissile.js';
import MirvMissile from '../objects/MirvMissile.js';

export default class WaveSpawner {
  constructor(scene) {
    this.scene = scene;
    this.waveData = null;
    this.spawned = 0;
    this.currentBurst = 0;
    this.spawnedInBurst = 0;
    this.enemiesPerBurst = 0;
    this.burstTimer = null;
    this.spawnTimer = null;
    this.active = false;
  }

  startWave(waveData, planetX, planetY, planetRadius, silos) {
    this.waveData = waveData;
    this.planetX = planetX;
    this.planetY = planetY;
    this.planetRadius = planetRadius;
    this.silos = silos;
    this.spawned = 0;
    this.currentBurst = 0;
    this.spawnedInBurst = 0;
    this.enemiesPerBurst = Math.ceil(waveData.enemyCount / waveData.burstCount);
    this.active = true;

    // Start first burst after wave start delay
    this.burstTimer = this.scene.time.delayedCall(
      CONFIG.WAVE_START_DELAY * 1000,
      () => this._startBurst()
    );
  }

  _startBurst() {
    if (!this.active) return;

    this.currentBurst++;
    this.spawnedInBurst = 0;

    const remaining = this.waveData.enemyCount - this.spawned;
    const toSpawn = Math.min(this.enemiesPerBurst, remaining);

    if (toSpawn <= 0) {
      this._waveSpawningComplete();
      return;
    }

    this._spawnNext(toSpawn);
  }

  _spawnNext(burstTotal) {
    if (!this.active || this.spawnedInBurst >= burstTotal) {
      // Burst complete — schedule next burst
      const remaining = this.waveData.enemyCount - this.spawned;
      if (remaining > 0) {
        this.burstTimer = this.scene.time.delayedCall(
          CONFIG.BURST_INTERVAL * 1000,
          () => this._startBurst()
        );
      } else {
        this._waveSpawningComplete();
      }
      return;
    }

    // Spawn one enemy
    const enemy = this._createEnemy();
    this.scene.events.emit('enemy_spawned', enemy);
    this.spawned++;
    this.spawnedInBurst++;

    // Schedule next spawn in burst
    this.spawnTimer = this.scene.time.delayedCall(
      CONFIG.SPAWN_INTERVAL * 1000,
      () => this._spawnNext(burstTotal)
    );
  }

  _createEnemy() {
    const wd = this.waveData;

    // Determine target
    const targetsSilo = Math.random() < wd.siloTargetRatio;
    let targetAngle = null;

    if (targetsSilo) {
      // Pick a random active silo
      const activeSilos = this.silos.filter(s => s.state !== SILO_STATE.DESTROYED);
      if (activeSilos.length > 0) {
        const silo = activeSilos[Math.floor(Math.random() * activeSilos.length)];
        targetAngle = silo.angle;
      }
    }

    const target = generateTargetPoint(
      this.planetX, this.planetY, this.planetRadius,
      targetAngle, targetsSilo && targetAngle !== null
    );

    const spawn = generateSpawnPoint(
      target.x, target.y,
      this.planetX, this.planetY, this.planetRadius
    );

    const speed = randomBetween(wd.speedMin, wd.speedMax);

    // MIRV check
    const isMirv = Math.random() < wd.mirvChance;

    if (isMirv) {
      return new MirvMissile(
        this.scene,
        spawn.x, spawn.y,
        target.x, target.y,
        speed,
        wd
      );
    }

    return new EnemyMissile(
      this.scene,
      spawn.x, spawn.y,
      target.x, target.y,
      speed,
      false
    );
  }

  _waveSpawningComplete() {
    this.active = false;
    this.scene.events.emit(EVENTS.WAVE_ENEMIES_SPAWNED);
  }

  stop() {
    this.active = false;
    if (this.burstTimer) {
      this.burstTimer.destroy();
      this.burstTimer = null;
    }
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
  }

  destroy() {
    this.stop();
  }
}

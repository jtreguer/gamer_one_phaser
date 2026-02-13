import { CONFIG } from '../config.js';
import { GAME_STATE } from '../utils/constants.js';

class GameManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentState = GAME_STATE.MENU;
    this.currentWave = 0;
    this.score = 0;
    this.highScore = this._loadHighScore();
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.waveShotsFired = 0;
    this.waveShotsHit = 0;
    this.totalEnemiesDestroyed = 0;
    this.waveSilosLost = 0;
    this.activeSiloCount = CONFIG.INITIAL_SILO_COUNT;
    this.upgradeLevel = {
      interceptor_speed: 0,
      blast_radius: 0,
      reload_speed: 0,
    };
  }

  startGame() {
    this.score = 0;
    this.currentWave = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.totalEnemiesDestroyed = 0;
    this.activeSiloCount = CONFIG.INITIAL_SILO_COUNT;
    this.upgradeLevel = {
      interceptor_speed: 0,
      blast_radius: 0,
      reload_speed: 0,
    };
  }

  startNextWave() {
    this.currentWave++;
    this.waveShotsFired = 0;
    this.waveShotsHit = 0;
    this.waveSilosLost = 0;
    this.currentState = GAME_STATE.PLAYING;
    return this.generateWaveData(this.currentWave);
  }

  // --- Effective values (base + upgrades) ---

  getEffectiveInterceptorSpeed() {
    return CONFIG.INTERCEPTOR_SPEED + this.upgradeLevel.interceptor_speed * CONFIG.UPGRADES.interceptor_speed.perLevel;
  }

  getEffectiveBlastRadius() {
    return CONFIG.BLAST_RADIUS + this.upgradeLevel.blast_radius * CONFIG.UPGRADES.blast_radius.perLevel;
  }

  getEffectiveReloadTime() {
    return Math.max(CONFIG.SILO_RELOAD_TIME + this.upgradeLevel.reload_speed * CONFIG.UPGRADES.reload_speed.perLevel, 0.6);
  }

  // --- Scoring ---

  addScore(points) {
    this.score += points;
  }

  recordShotFired() {
    this.shotsFired++;
    this.waveShotsFired++;
  }

  recordShotHit() {
    this.shotsHit++;
    this.waveShotsHit++;
  }

  getWaveAccuracy() {
    if (this.waveShotsFired === 0) return 0;
    return Math.min(this.waveShotsHit / this.waveShotsFired, 1);
  }

  getOverallAccuracy() {
    if (this.shotsFired === 0) return 0;
    return Math.min(this.shotsHit / this.shotsFired, 1);
  }

  calculateWaveBonuses() {
    let bonus = 0;

    // Wave clear bonus (always awarded for completing a wave)
    bonus += CONFIG.WAVE_CLEAR_BONUS * this.currentWave;

    // Silo survival bonus
    bonus += CONFIG.SILO_SURVIVAL_BONUS * this.activeSiloCount * this.currentWave;

    // Accuracy bonus
    if (this.getWaveAccuracy() >= CONFIG.ACCURACY_BONUS_THRESHOLD) {
      bonus += CONFIG.ACCURACY_BONUS * this.currentWave;
    }

    return bonus;
  }

  // --- Upgrades ---

  getUpgradeCost(upgradeId) {
    const upgrade = CONFIG.UPGRADES[upgradeId];
    if (!upgrade) return Infinity;

    if (upgradeId === 'silo_repair') {
      return CONFIG.SILO_REPAIR_COST_MULT * this.currentWave;
    }

    const level = this.upgradeLevel[upgradeId] || 0;
    if (level >= upgrade.maxLevel) return Infinity;
    return upgrade.costs[level];
  }

  canAffordUpgrade(upgradeId) {
    return this.score >= this.getUpgradeCost(upgradeId);
  }

  isUpgradeMaxed(upgradeId) {
    if (upgradeId === 'silo_repair') {
      return this.activeSiloCount >= CONFIG.INITIAL_SILO_COUNT;
    }
    const upgrade = CONFIG.UPGRADES[upgradeId];
    return (this.upgradeLevel[upgradeId] || 0) >= upgrade.maxLevel;
  }

  purchaseUpgrade(upgradeId) {
    const cost = this.getUpgradeCost(upgradeId);
    if (this.score < cost) return false;
    if (this.isUpgradeMaxed(upgradeId)) return false;

    this.score -= cost;

    if (upgradeId === 'silo_repair') {
      // Handled by the scene — it restores a silo
      return true;
    }

    this.upgradeLevel[upgradeId]++;
    return true;
  }

  // --- Wave generation (GDD 5.1 formulas) ---

  generateWaveData(waveNum) {
    const enemyCount = Math.min(
      CONFIG.INITIAL_ENEMY_COUNT + (waveNum - 1) * CONFIG.ENEMY_COUNT_ESCALATION,
      CONFIG.ENEMY_COUNT_CAP
    );

    const speedMin = Math.min(
      CONFIG.ENEMY_SPEED_MIN_BASE + (waveNum - 1) * CONFIG.ENEMY_SPEED_ESCALATION,
      CONFIG.ENEMY_SPEED_CAP - 20
    );

    const speedMax = Math.min(
      CONFIG.ENEMY_SPEED_MAX_BASE + (waveNum - 1) * CONFIG.ENEMY_SPEED_MAX_ESCALATION,
      CONFIG.ENEMY_SPEED_CAP
    );

    let mirvChance = 0;
    if (waveNum >= CONFIG.MIRV_START_WAVE) {
      mirvChance = Math.min(
        CONFIG.MIRV_BASE_CHANCE + (waveNum - CONFIG.MIRV_START_WAVE) * CONFIG.MIRV_CHANCE_PER_WAVE,
        CONFIG.MIRV_CHANCE_CAP
      );
    }

    let mirvMaxWarheads = CONFIG.MIRV_MIN_WARHEADS;
    if (waveNum >= 15) {
      mirvMaxWarheads = CONFIG.MIRV_MAX_WARHEADS;
    } else if (waveNum >= 8) {
      mirvMaxWarheads = 3;
    }

    const burstCount = Math.min(2 + Math.floor(waveNum / 3), 7);

    return {
      waveNumber: waveNum,
      enemyCount,
      speedMin,
      speedMax,
      mirvChance,
      mirvMinWarheads: CONFIG.MIRV_MIN_WARHEADS,
      mirvMaxWarheads,
      burstCount,
      siloTargetRatio: CONFIG.SILO_TARGET_RATIO,
    };
  }

  // --- High score persistence (localStorage) ---

  _loadHighScore() {
    try {
      const saved = localStorage.getItem('planet_defense_high_score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('planet_defense_high_score', String(this.highScore));
      } catch { /* ignore */ }
    }
  }
}

// Module-level singleton
const gameManager = new GameManager();
export default gameManager;

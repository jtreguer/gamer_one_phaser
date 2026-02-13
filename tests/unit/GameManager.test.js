import { describe, it, expect, beforeEach } from 'vitest';
import { CONFIG } from '../../src/config.js';

// We need to import after mocking localStorage
const localStorageMock = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  clear() { this.store = {}; },
};
globalThis.localStorage = localStorageMock;

const { default: gameManager } = await import('../../src/systems/GameManager.js');

describe('GameManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    gameManager.reset();
    gameManager.startGame();
  });

  describe('initial state', () => {
    it('starts with score 0', () => {
      expect(gameManager.score).toBe(0);
    });

    it('starts with wave 0', () => {
      expect(gameManager.currentWave).toBe(0);
    });

    it('has all upgrade levels at 0', () => {
      expect(gameManager.upgradeLevel.interceptor_speed).toBe(0);
      expect(gameManager.upgradeLevel.blast_radius).toBe(0);
      expect(gameManager.upgradeLevel.reload_speed).toBe(0);
    });
  });

  describe('effective values', () => {
    it('returns base interceptor speed at level 0', () => {
      expect(gameManager.getEffectiveInterceptorSpeed()).toBe(CONFIG.INTERCEPTOR_SPEED);
    });

    it('returns increased speed at level 1', () => {
      gameManager.upgradeLevel.interceptor_speed = 1;
      expect(gameManager.getEffectiveInterceptorSpeed()).toBe(CONFIG.INTERCEPTOR_SPEED + 60);
    });

    it('returns base blast radius at level 0', () => {
      expect(gameManager.getEffectiveBlastRadius()).toBe(CONFIG.BLAST_RADIUS);
    });

    it('returns increased radius at level 3', () => {
      gameManager.upgradeLevel.blast_radius = 3;
      expect(gameManager.getEffectiveBlastRadius()).toBe(CONFIG.BLAST_RADIUS + 18);
    });

    it('returns base reload time at level 0', () => {
      expect(gameManager.getEffectiveReloadTime()).toBe(CONFIG.SILO_RELOAD_TIME);
    });

    it('clamps reload time to 0.6s minimum', () => {
      gameManager.upgradeLevel.reload_speed = 10; // way past max
      expect(gameManager.getEffectiveReloadTime()).toBe(0.6);
    });
  });

  describe('scoring', () => {
    it('adds score correctly', () => {
      gameManager.addScore(100);
      gameManager.addScore(250);
      expect(gameManager.score).toBe(350);
    });

    it('tracks shots', () => {
      gameManager.recordShotFired();
      gameManager.recordShotFired();
      gameManager.recordShotHit();
      expect(gameManager.waveShotsFired).toBe(2);
      expect(gameManager.waveShotsHit).toBe(1);
    });

    it('calculates wave accuracy', () => {
      gameManager.recordShotFired();
      gameManager.recordShotFired();
      gameManager.recordShotHit();
      expect(gameManager.getWaveAccuracy()).toBe(0.5);
    });

    it('returns 0 accuracy when no shots fired', () => {
      expect(gameManager.getWaveAccuracy()).toBe(0);
    });
  });

  describe('wave generation', () => {
    it('generates correct wave 1 data', () => {
      const data = gameManager.generateWaveData(1);
      expect(data.waveNumber).toBe(1);
      expect(data.enemyCount).toBe(6);
      expect(data.speedMin).toBe(80);
      expect(data.speedMax).toBe(120);
      expect(data.mirvChance).toBe(0);
      expect(data.burstCount).toBe(2);
    });

    it('generates correct wave 5 data (MIRV introduction)', () => {
      const data = gameManager.generateWaveData(5);
      expect(data.mirvChance).toBe(CONFIG.MIRV_BASE_CHANCE);
      expect(data.mirvMaxWarheads).toBe(2);
    });

    it('generates correct wave 10 data', () => {
      const data = gameManager.generateWaveData(10);
      expect(data.enemyCount).toBe(Math.min(6 + 9 * 2, 60));
      expect(data.mirvMaxWarheads).toBe(3);
      expect(data.burstCount).toBe(Math.min(2 + Math.floor(10 / 3), 7));
    });

    it('caps enemy count', () => {
      const data = gameManager.generateWaveData(100);
      expect(data.enemyCount).toBe(CONFIG.ENEMY_COUNT_CAP);
    });

    it('caps enemy speed', () => {
      const data = gameManager.generateWaveData(100);
      expect(data.speedMax).toBeLessThanOrEqual(CONFIG.ENEMY_SPEED_CAP);
    });

    it('caps MIRV chance', () => {
      const data = gameManager.generateWaveData(100);
      expect(data.mirvChance).toBeLessThanOrEqual(CONFIG.MIRV_CHANCE_CAP);
    });
  });

  describe('upgrades', () => {
    it('returns correct upgrade cost', () => {
      expect(gameManager.getUpgradeCost('interceptor_speed')).toBe(1000);
    });

    it('returns cost for next level', () => {
      gameManager.upgradeLevel.interceptor_speed = 1;
      expect(gameManager.getUpgradeCost('interceptor_speed')).toBe(2000);
    });

    it('returns Infinity when maxed', () => {
      gameManager.upgradeLevel.interceptor_speed = 5;
      expect(gameManager.getUpgradeCost('interceptor_speed')).toBe(Infinity);
    });

    it('purchases upgrade successfully', () => {
      gameManager.score = 2000;
      const result = gameManager.purchaseUpgrade('interceptor_speed');
      expect(result).toBe(true);
      expect(gameManager.upgradeLevel.interceptor_speed).toBe(1);
      expect(gameManager.score).toBe(1000);
    });

    it('rejects purchase when too expensive', () => {
      gameManager.score = 500;
      const result = gameManager.purchaseUpgrade('interceptor_speed');
      expect(result).toBe(false);
      expect(gameManager.upgradeLevel.interceptor_speed).toBe(0);
    });

    it('calculates silo repair cost based on wave', () => {
      gameManager.currentWave = 3;
      expect(gameManager.getUpgradeCost('silo_repair')).toBe(15000);
    });
  });

  describe('wave bonuses', () => {
    it('calculates wave bonuses', () => {
      gameManager.currentWave = 1;
      gameManager.activeSiloCount = 6;
      gameManager.waveShotsFired = 10;
      gameManager.waveShotsHit = 9; // 90% accuracy

      const bonus = gameManager.calculateWaveBonuses();

      // wave_clear: 500 * 1 = 500
      // silo_survival: 200 * 6 * 1 = 1200
      // accuracy (90% >= 80%): 300 * 1 = 300
      expect(bonus).toBe(2000);
    });

    it('no accuracy bonus below threshold', () => {
      gameManager.currentWave = 1;
      gameManager.activeSiloCount = 6;
      gameManager.waveShotsFired = 10;
      gameManager.waveShotsHit = 5; // 50% accuracy

      const bonus = gameManager.calculateWaveBonuses();

      // wave_clear: 500 + silo_survival: 1200 = 1700 (no accuracy bonus)
      expect(bonus).toBe(1700);
    });
  });
});
